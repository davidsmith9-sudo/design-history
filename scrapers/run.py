"""CLI entry point for the design-history scraper.

Usage:
  python run.py fetch <QID>             Fetch one entity by Wikidata QID
  python run.py fetch-all               Fetch every QID in config/topics.yaml
  python run.py to-markdown <QID>       Convert merged JSON to markdown preview
  python run.py all <QID>               fetch + to-markdown in one shot
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Force UTF-8 stdout/stderr — on Windows the default is often cp950, which
# breaks on any CJK character outside Big5. Must happen before any prints.
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

# Best-effort .env loader — no external dep. Parses KEY=value lines.
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v

import yaml

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from src.pipeline.fetch import fetch_entity
from src.pipeline.to_markdown import convert_file
from src.sources.wikidata import WikidataSource
from src.sources.moma import MoMA

RAW_DIR = ROOT / "data" / "raw"
MERGED_DIR = ROOT / "data" / "merged"
MARKDOWN_DIR = ROOT / "data" / "markdown"
TOPICS_FILE = ROOT / "config" / "topics.yaml"


def cmd_fetch(qid: str) -> None:
    fetch_entity(qid, RAW_DIR, MERGED_DIR)
    print(f"OK [{qid}] → {MERGED_DIR / (qid + '.json')}")


def cmd_to_markdown(qid: str) -> None:
    merged = MERGED_DIR / f"{qid}.json"
    if not merged.exists():
        print(f"ERROR: {merged} not found. Run `fetch {qid}` first.", file=sys.stderr)
        sys.exit(1)
    out = convert_file(merged, MARKDOWN_DIR)
    print(f"OK [{qid}] → {out}")


def cmd_all(qid: str) -> None:
    cmd_fetch(qid)
    cmd_to_markdown(qid)


def cmd_moma_import() -> None:
    """Download MoMA's Artists.json and Artworks.json from their public GitHub repo
    into data/cache/moma/. This is a one-time setup, ~30 MB total."""
    moma = MoMA()
    moma.import_data()
    print("OK — MoMA data cached. Future fetches will include MoMA results.")


def cmd_lookup(query: str, lang: str = "zh") -> None:
    """Search Wikidata for QIDs matching a string. Helpful for filling topics.yaml."""
    wd = WikidataSource()
    primary = wd.search(query, lang=lang, limit=7)
    fallback: list = []
    if lang != "en":
        fallback = wd.search(query, lang="en", limit=5)

    print(f"\nSearch '{query}' (lang={lang}):")
    seen: set[str] = set()
    for r in primary + fallback:
        if not r.get("qid") or r["qid"] in seen:
            continue
        seen.add(r["qid"])
        label = r.get("label") or "?"
        desc = r.get("description") or ""
        print(f"  {r['qid']:10}  {label}  —  {desc}")


def cmd_fetch_all() -> None:
    if not TOPICS_FILE.exists():
        print(f"ERROR: {TOPICS_FILE} not found", file=sys.stderr)
        sys.exit(1)
    topics = yaml.safe_load(TOPICS_FILE.read_text(encoding="utf-8")) or {}
    qids: list[str] = []
    for _category, items in topics.items():
        for item in items or []:
            qids.append(item["qid"])
    print(f"Fetching {len(qids)} entities from topics.yaml")
    errors = []
    for qid in qids:
        try:
            cmd_fetch(qid)
            cmd_to_markdown(qid)
        except Exception as e:
            errors.append((qid, str(e)))
            print(f"FAIL [{qid}] {e}", file=sys.stderr)
    if errors:
        print(f"\n{len(errors)} failures:", file=sys.stderr)
        for qid, err in errors:
            print(f"  {qid}: {err}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Design history scraper CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_fetch = sub.add_parser("fetch", help="Fetch one QID")
    p_fetch.add_argument("qid")

    sub.add_parser("fetch-all", help="Fetch every QID in config/topics.yaml")

    p_md = sub.add_parser("to-markdown", help="Convert merged JSON to markdown")
    p_md.add_argument("qid")

    p_all = sub.add_parser("all", help="fetch + to-markdown in one shot")
    p_all.add_argument("qid")

    p_lookup = sub.add_parser("lookup", help="Find Wikidata QIDs by name")
    p_lookup.add_argument("query")
    p_lookup.add_argument("--lang", default="zh", help="search language (zh/en/...)")

    sub.add_parser("moma-import", help="One-time download of MoMA collection data (~30 MB)")

    args = parser.parse_args()

    if args.cmd == "fetch":
        cmd_fetch(args.qid)
    elif args.cmd == "fetch-all":
        cmd_fetch_all()
    elif args.cmd == "to-markdown":
        cmd_to_markdown(args.qid)
    elif args.cmd == "all":
        cmd_all(args.qid)
    elif args.cmd == "lookup":
        cmd_lookup(args.query, args.lang)
    elif args.cmd == "moma-import":
        cmd_moma_import()


if __name__ == "__main__":
    main()
