"""Fetch pipeline — given a Wikidata QID, pull data from all configured sources
and produce one merged JSON record per entity.

Wikidata is the structural backbone (provides QID, sitelinks, labels). All other
sources are queried in parallel using their preferred identifier:
  - Wikipedia: zh-Hant title (variant=zh-tw), zh-Hans (variant=zh-cn), English
  - Baidu Baike: Chinese label
  - Met / V&A / Europeana / Smithsonian / DOAJ / Internet Archive / MoMA: English label
  - Vitra / Design Museum London: stub

Any source failure is swallowed — pipeline never fails because of one bad source.
"""
from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from src.sources.wikidata import WikidataSource
from src.sources.wikipedia import WikipediaSource
from src.sources.baidu_baike import BaiduBaike
from src.sources.met import MetMuseum
from src.sources.va import VandA
from src.sources.europeana import Europeana
from src.sources.smithsonian import Smithsonian
from src.sources.doaj import DOAJ
from src.sources.internet_archive import InternetArchive
from src.sources.moma import MoMA
from src.sources.vitra import Vitra
from src.sources.design_museum_london import DesignMuseumLondon


def fetch_entity(qid: str, raw_dir: Path, merged_dir: Path) -> dict[str, Any]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    merged_dir.mkdir(parents=True, exist_ok=True)

    wikidata = WikidataSource()
    wikipedia = WikipediaSource()

    print(f"[{qid}] → Wikidata", file=sys.stderr)
    wd = wikidata.fetch(qid)
    _save(raw_dir / "wikidata" / f"{qid}.json", wd)

    sitelinks = wd.get("sitelinks", {})
    zh_title = sitelinks.get("zhwiki")
    en_title = sitelinks.get("enwiki")
    en_label = (wd.get("labels") or {}).get("en") or en_title
    zh_label = _best_zh_label(wd)

    wiki: dict[str, Any] = {}
    if zh_title:
        print(f"[{qid}] → Wikipedia zh-Hant ({zh_title})", file=sys.stderr)
        wiki["zh-hant"] = wikipedia.fetch(zh_title, "zh-hant")
        print(f"[{qid}] → Wikipedia zh-Hans ({zh_title})", file=sys.stderr)
        wiki["zh-hans"] = wikipedia.fetch(zh_title, "zh-hans")
    if en_title:
        print(f"[{qid}] → Wikipedia en ({en_title})", file=sys.stderr)
        wiki["en"] = wikipedia.fetch(en_title, "en")

    _save(raw_dir / "wikipedia" / f"{qid}.json", wiki)

    # Parallel: extra sources keyed by their preferred query.
    extra = _fetch_extra_sources(qid, zh_label, en_label, raw_dir, wd=wd)

    # Resolve any referenced QIDs to labels (used by markdown converter).
    qid_refs = _collect_qid_references(wd)
    print(f"[{qid}] resolving {len(qid_refs)} referenced QIDs", file=sys.stderr)
    label_map = wikidata.resolve_labels(qid_refs) if qid_refs else {}

    record = {
        "qid": qid,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "wikidata": wd,
        "wikipedia": wiki,
        "qid_labels": label_map,
        "sources": extra,
    }
    _save(merged_dir / f"{qid}.json", record)
    return record


def _fetch_extra_sources(
    qid: str,
    zh_label: str | None,
    en_label: str | None,
    raw_dir: Path,
    wd: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run every supplementary source in parallel. Each returns a dict or list."""
    jobs: dict[str, Callable[[], Any]] = {}

    # Baidu Baike is a mainland service — prefer simplified-vocabulary label
    # (包豪斯) over Taiwan繁體 (包浩斯). Falls back to whatever zh label we have.
    baidu_label = _best_simplified_label(wd) or zh_label
    if baidu_label:
        jobs["baidu_baike"] = lambda: BaiduBaike().fetch_by_title(baidu_label)

    if en_label:
        jobs["met_museum"] = lambda: MetMuseum().search(en_label, limit=5)
        jobs["va"] = lambda: VandA().search(en_label, limit=5)
        jobs["doaj"] = lambda: DOAJ().search(en_label, limit=5)
        jobs["internet_archive"] = lambda: InternetArchive().search(en_label, limit=5)

        eu = Europeana()
        if eu.is_configured():
            jobs["europeana"] = lambda: eu.search(en_label, limit=5)
        si = Smithsonian()
        if si.is_configured():
            jobs["smithsonian"] = lambda: si.search(en_label, limit=5)

        if MoMA.is_imported():
            jobs["moma"] = lambda: MoMA().search(en_label, limit=5)

        jobs["vitra"] = lambda: Vitra().search(en_label, limit=5)
        jobs["design_museum_london"] = lambda: DesignMuseumLondon().search(en_label, limit=5)

    out: dict[str, Any] = {}
    if not jobs:
        return out

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(_safe_call, name, fn): name for name, fn in jobs.items()}
        for fut in as_completed(futures):
            name = futures[fut]
            try:
                out[name] = fut.result()
                count = (
                    len(out[name]) if isinstance(out[name], list)
                    else (1 if out[name] else 0)
                )
                print(f"[{qid}] → {name}: {count} hit(s)", file=sys.stderr)
            except Exception as e:
                print(f"[{qid}] FAILED {name}: {e}", file=sys.stderr)
                out[name] = None

    # Cache raw per-source under data/raw/<name>/<qid>.json
    for name, payload in out.items():
        if payload:
            _save(raw_dir / name / f"{qid}.json", payload)

    return out


def _safe_call(name: str, fn: Callable[[], Any]) -> Any:
    try:
        return fn()
    except Exception as e:
        print(f"  source {name} threw: {e}", file=sys.stderr)
        return None


def _best_zh_label(wd: dict[str, Any]) -> str | None:
    labels = wd.get("labels", {}) or {}
    for lang in ("zh-tw", "zh-hant", "zh", "zh-hk", "zh-cn", "zh-hans"):
        if labels.get(lang):
            return labels[lang]
    return None


def _best_simplified_label(wd: dict[str, Any] | None) -> str | None:
    """Pick a label suitable for mainland-China services (Baidu Baike).
    Prefer zh-cn / zh-hans over Taiwan-variant labels."""
    if not wd:
        return None
    labels = wd.get("labels", {}) or {}
    for lang in ("zh-cn", "zh-hans", "zh", "zh-hk", "zh-hant", "zh-tw"):
        if labels.get(lang):
            return labels[lang]
    return None


def _collect_qid_references(wd: dict[str, Any]) -> list[str]:
    qids: list[str] = []
    for values in wd.get("claims", {}).values():
        for v in values:
            if isinstance(v, dict) and "qid" in v:
                qids.append(v["qid"])
    return qids


def _save(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
