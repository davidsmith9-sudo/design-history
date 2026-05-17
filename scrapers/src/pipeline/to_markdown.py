"""Convert a merged JSON record into a Quartz markdown preview file.

Detects the entity 'type' (流派 / 人物 / 作品) from Wikidata instance_of claims,
then fills the appropriate frontmatter template. Output goes to data/markdown/ —
NOT to content/. Human review required before merging into the live site.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from src.utils.zh_convert import to_taiwan

# Wikidata QIDs that indicate "this is X" — used to pick a content type.
# Curated subset; expand as needed.
TYPE_RULES: list[tuple[str, set[str]]] = [
    # 人物
    ("人物", {
        "Q5",          # human
    }),
    # 流派(藝術運動 / 建築運動 / 設計運動 / 流派)
    ("流派", {
        "Q968159",     # art movement
        "Q1792379",    # art genre
        "Q483394",     # genre
        "Q2198855",    # cultural movement
        "Q49773",      # social movement
        "Q4502119",    # art style
        "Q1792644",    # art style
        "Q15053706",   # design movement
        "Q11635",      # philosophical movement
        "Q3917681",    # architectural style
        "Q32880",      # architectural movement
    }),
    # 作品(建築物 / 字體 / 家具 / 產品 / 平面 etc.)
    ("作品", {
        "Q41176",      # building
        "Q811979",     # architectural structure
        "Q3947",       # house
        "Q3950",       # villa
        "Q1307276",    # single-family detached home
        "Q5008701",    # row house
        "Q24398318",   # religious building
        "Q16970",      # church building
        "Q1107656",    # garden
        "Q1469734",    # monument
        "Q570116",     # tourist attraction
        "Q11303",      # skyscraper
        "Q17537576",   # creative work
        "Q838948",     # work of art
        "Q571",        # book
        "Q11460",      # furniture
        "Q14406742",   # chair model
        "Q15401930",   # product
        "Q1969320",    # product model
        "Q186408",     # typeface
        "Q282",        # font
        "Q1153484",    # poster
        "Q1668893",    # logo
        "Q47461344",   # written work
    }),
]

# Fallback: if instance_of labels contain any of these keywords, classify as 作品.
# Catches subclasses of building/typeface/furniture we haven't enumerated.
WORK_LABEL_HINTS = (
    "building", "house", "villa", "tower", "structure", "monument",
    "church", "cathedral", "museum", "memorial", "pavilion",
    "chair", "table", "lamp", "sofa", "stool", "furniture",
    "typeface", "font", "poster", "logo", "graphic", "product",
    "建築", "房屋", "別墅", "塔", "建物", "教堂", "紀念碑",
    "椅", "桌", "燈", "家具", "字體", "海報", "標誌",
)


def _detect_type(wd: dict[str, Any], label_map: dict[str, dict[str, str]]) -> str:
    instance_of = wd.get("claims", {}).get("instance_of", [])
    instance_qids = {v["qid"] for v in instance_of if isinstance(v, dict) and "qid" in v}

    subclass_of = wd.get("claims", {}).get("subclass_of", [])
    subclass_qids = {v["qid"] for v in subclass_of if isinstance(v, dict) and "qid" in v}

    pool = instance_qids | subclass_qids

    for type_name, qid_set in TYPE_RULES:
        if pool & qid_set:
            return type_name

    # Fallback: keyword-match instance_of labels.
    for qid in pool:
        labels = label_map.get(qid, {})
        for label in labels.values():
            label_lower = label.lower()
            if any(h.lower() in label_lower for h in WORK_LABEL_HINTS):
                return "作品"

    return "未分類"


def _label(qid_or_obj: Any, label_map: dict[str, dict[str, str]], lang_priority: tuple[str, ...] = ("zh-tw", "zh-hant", "zh", "zh-hk", "zh-hans", "en")) -> Optional[str]:
    """Resolve a {qid: ...} reference to a human-readable label.

    Priority: Taiwan zh (zh-tw) → zh-hant → generic zh → zh-hk → zh-hans → en.
    Non-zh-tw labels are passed through `to_taiwan` to convert 大陸繁體
    vocabulary (e.g. 柯布西耶 → 柯比意) using OpenCC + custom design dict.
    """
    if not isinstance(qid_or_obj, dict) or "qid" not in qid_or_obj:
        return None
    qid = qid_or_obj["qid"]
    labels = label_map.get(qid, {})
    for lang in lang_priority:
        if lang in labels:
            value = labels[lang]
            # Apply Taiwan-繁體 normalization for any zh variant.
            if lang.startswith("zh") and lang != "zh-tw":
                value = to_taiwan(value)
            return value
    return qid


def _format_year(time_obj: Any) -> Optional[str]:
    """Wikidata time format: '+1919-01-01T00:00:00Z'. Extract year."""
    if not isinstance(time_obj, dict) or "time" not in time_obj:
        return None
    m = re.match(r"^[+-]?(\d{1,4})", time_obj["time"])
    if not m:
        return None
    year = int(m.group(1))
    if time_obj["time"].startswith("-"):
        return f"-{year}"
    return str(year)


def _claim_labels(wd: dict[str, Any], key: str, label_map: dict[str, dict[str, str]]) -> list[str]:
    out = []
    for v in wd.get("claims", {}).get(key, []):
        label = _label(v, label_map)
        if label:
            out.append(label)
    return out


def _claim_year(wd: dict[str, Any], key: str) -> Optional[str]:
    vals = wd.get("claims", {}).get(key, [])
    if not vals:
        return None
    return _format_year(vals[0])


def _pick_summary(wiki: dict[str, Any], langs: tuple[str, ...] = ("zh-hant", "zh-hans", "en")) -> tuple[Optional[str], Optional[str]]:
    """Return (best_extract, lang_used) — prefer zh-Hant, fall back."""
    for lang in langs:
        if lang in wiki:
            ext = wiki[lang].get("extract") or (wiki[lang].get("summary") or {}).get("extract")
            if ext:
                return ext, lang
    return None, None


def _pick_title(wd: dict[str, Any], wiki: dict[str, Any]) -> str:
    """Pick the best display title.

    The Wikipedia summary API returns two title fields:
      - title: the canonical article title (not auto-converted) → 包豪斯
      - display_title: HTML-wrapped converted title → <span...>包浩斯</span>
    For zh-tw variant we want the converted form, so strip HTML from display_title.
    Wikidata's zh-hant label often uses 大陸繁體 vocabulary (e.g. 包豪斯) — we
    apply `to_taiwan` as a final safety pass.
    """
    if "zh-hant" in wiki:
        s = wiki["zh-hant"].get("summary") or {}
        dt = s.get("display_title")
        if dt:
            cleaned = _strip_html(dt)
            if cleaned:
                return to_taiwan(cleaned)
        if s.get("title"):
            return to_taiwan(s["title"])
    labels = wd.get("labels", {})
    for lang in ("zh-tw", "zh-hant", "zh", "zh-hk", "zh-hans", "zh-cn", "en"):
        if lang in labels:
            val = labels[lang]
            if lang.startswith("zh") and lang != "zh-tw":
                val = to_taiwan(val)
            return val
    return wd["qid"]


def _strip_html(s: str) -> str:
    """Strip HTML tags from a string. display_title is HTML-wrapped."""
    return re.sub(r"<[^>]+>", "", s).strip()


def _pick_description(wd: dict[str, Any], wiki: dict[str, Any]) -> Optional[str]:
    """Prefer Wikipedia summary description (with zh-tw variant) over Wikidata's.

    Wikidata descriptions are short curated strings (e.g. '世界遗产') but they
    sometimes describe a tangential aspect of the entity.
    """
    if "zh-hant" in wiki:
        s = wiki["zh-hant"].get("summary") or {}
        if s.get("description"):
            return to_taiwan(s["description"])
    descriptions = wd.get("descriptions", {})
    for lang in ("zh-tw", "zh-hant", "zh", "zh-hk", "en"):
        if lang in descriptions:
            val = descriptions[lang]
            if lang.startswith("zh") and lang != "zh-tw":
                val = to_taiwan(val)
            return val
    return None


def _pick_image(wd: dict[str, Any], wiki: dict[str, Any]) -> Optional[str]:
    images = wd.get("claims", {}).get("image", [])
    if images:
        img = images[0]
        if isinstance(img, str):
            filename = img.replace(" ", "_")
            from urllib.parse import quote
            return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename)}"
    for lang in ("zh-hant", "en", "zh-hans"):
        if lang in wiki:
            orig = (wiki[lang].get("summary") or {}).get("original_image")
            if orig:
                return orig
    return None


def _yaml_str(s: str) -> str:
    if any(c in s for c in [":", "#", "[", "]", "{", "}", ",", "&", "*", "!", "|", ">", "'", "\""]):
        return '"' + s.replace('"', '\\"') + '"'
    return s


def _yaml_list(items: list[str], indent: str = "  ") -> str:
    if not items:
        return " []"
    lines = [f"{indent}- {_yaml_str(i)}" for i in items]
    return "\n" + "\n".join(lines)


def to_markdown(record: dict[str, Any]) -> tuple[str, str]:
    """Returns (filename_slug, markdown_string)."""
    wd = record["wikidata"]
    wiki = record["wikipedia"]
    labels = record["qid_labels"]
    qid = record["qid"]

    entity_type = _detect_type(wd, labels)
    title = _pick_title(wd, wiki)

    extract, extract_lang = _pick_summary(wiki)
    image_url = _pick_image(wd, wiki)

    # Build frontmatter per type.
    fm_lines = ["---", f"title: {_yaml_str(title)}", f"type: {entity_type}"]
    fm_lines.append(f"qid: {qid}")

    desc = _pick_description(wd, wiki)
    if desc:
        fm_lines.append(f"description: {_yaml_str(desc)}")

    en_label = wd.get("labels", {}).get("en")
    if en_label and en_label != title:
        fm_lines.append(f"name_original: {_yaml_str(en_label)}")

    aliases = wd.get("aliases", {}).get("zh-hant", []) + wd.get("aliases", {}).get("zh-hans", [])
    if aliases:
        fm_lines.append("aliases:" + _yaml_list(list(dict.fromkeys(aliases))))

    if entity_type == "人物":
        if (birth := _claim_year(wd, "birth_date")):
            fm_lines.append(f"birth: {birth}")
        if (death := _claim_year(wd, "death_date")):
            fm_lines.append(f"death: {death}")
        if (cit := _claim_labels(wd, "citizenship", labels)):
            fm_lines.append(f"nationality: {_yaml_str(cit[0])}")
        if (occ := _claim_labels(wd, "occupation", labels)):
            fm_lines.append("field:" + _yaml_list(occ))
        if (mv := _claim_labels(wd, "movement", labels)):
            fm_lines.append("movement:" + _yaml_list(mv))
        if (works := _claim_labels(wd, "notable_work", labels)):
            fm_lines.append("key_works:" + _yaml_list(works))
        if (advisor := _claim_labels(wd, "student_of", labels)):
            fm_lines.append("mentors:" + _yaml_list(advisor))
        if (students := _claim_labels(wd, "students", labels)):
            fm_lines.append("students:" + _yaml_list(students))
    elif entity_type == "流派":
        if (start := _claim_year(wd, "inception")):
            fm_lines.append(f"year_start: {start}")
        if (end := _claim_year(wd, "dissolved")):
            fm_lines.append(f"year_end: {end}")
        if (country := _claim_labels(wd, "country", labels)):
            fm_lines.append(f"region: {_yaml_str(country[0])}")
        if (founders := _claim_labels(wd, "founded_by", labels)):
            fm_lines.append("founders:" + _yaml_list([f"[[{f}]]" for f in founders]))
        if (works := _claim_labels(wd, "notable_work", labels)):
            fm_lines.append("key_works:" + _yaml_list([f"[[{w}]]" for w in works]))
        if (influences := _claim_labels(wd, "influenced_by", labels)):
            fm_lines.append("influenced_by:" + _yaml_list([f"[[{i}]]" for i in influences]))
    elif entity_type == "作品":
        if (year := _claim_year(wd, "inception")):
            fm_lines.append(f"year: {year}")
        if (creators := _claim_labels(wd, "creator", labels)):
            fm_lines.append("designer:" + _yaml_list([f"[[{c}]]" for c in creators]))
        if (mv := _claim_labels(wd, "movement", labels)):
            fm_lines.append(f"movement: {_yaml_str(mv[0])}")
        if (loc := _claim_labels(wd, "location", labels)):
            fm_lines.append(f"location: {_yaml_str(loc[0])}")
        if (material := _claim_labels(wd, "material", labels)):
            fm_lines.append("medium:" + _yaml_list(material))

    fm_lines.append("tags:")
    fm_lines.append(f"  - {entity_type}")
    fm_lines.append("  - auto-imported")

    fm_lines.append("sources:")
    for lang_key, wiki_data in wiki.items():
        url = wiki_data.get("url")
        if url:
            fm_lines.append(f"  - {url}")
    fm_lines.append(f"  - https://www.wikidata.org/wiki/{qid}")

    fm_lines.append("status: draft")
    fm_lines.append("---")
    fm_lines.append("")

    body: list[str] = [f"# {title}", ""]
    if desc:
        body.append(f"> {desc}")
        body.append("")

    if extract:
        body.append("## 簡述")
        if extract_lang == "zh-hant":
            body.append("(來源:中文維基百科 — 繁體變體,已自動轉台灣用語)")
        elif extract_lang == "zh-hans":
            body.append("(來源:中文維基百科 — 簡體變體,已自動轉台灣用語)")
        elif extract_lang == "en":
            body.append("(來源:英文維基百科,待翻譯)")
        body.append("")
        body.append(to_taiwan(extract) if extract_lang and extract_lang.startswith("zh") else extract)
        body.append("")

    if "zh-hans" in wiki and "zh-hant" in wiki:
        hans_ext = wiki["zh-hans"].get("extract")
        hant_ext = wiki["zh-hant"].get("extract")
        if hans_ext and hant_ext and hans_ext != hant_ext:
            body.append("## 簡體版本對照")
            body.append(hans_ext)
            body.append("")

    if "en" in wiki:
        en_ext = wiki["en"].get("extract")
        if en_ext:
            body.append("## 英文資料")
            body.append(en_ext)
            body.append("")

    if image_url:
        body.append("## 主圖")
        body.append(f"![]({image_url})")
        body.append("")

    # Supplementary sources from the extra-source pipeline.
    extra_sources = record.get("sources") or {}
    body += _render_baidu(extra_sources.get("baidu_baike"))
    body += _render_museum_section(extra_sources)
    body += _render_exhibitions_section(extra_sources)
    body += _render_academic_section(extra_sources)

    body.append("## 來源")
    for lang_key, wiki_data in wiki.items():
        url = wiki_data.get("url")
        if url:
            body.append(f"- Wikipedia ({lang_key}): {url}")
    body.append(f"- Wikidata: https://www.wikidata.org/wiki/{qid}")
    if extra_sources.get("baidu_baike") and extra_sources["baidu_baike"].get("url"):
        body.append(f"- 百度百科: {extra_sources['baidu_baike']['url']}")
    body.append("")

    body.append("<!-- 自動匯入 — 請人工審稿後再合併進 content/ 對應子資料夾 -->")
    body.append("")

    markdown = "\n".join(fm_lines) + "\n".join(body)
    slug = _slugify(title)
    return slug, markdown


def _render_baidu(baidu: Any) -> list[str]:
    if not baidu or not isinstance(baidu, dict):
        return []
    out = ["## 百度百科(簡體中文補充)", ""]
    if baidu.get("summary"):
        out.append(baidu["summary"])
        out.append("")
    info = baidu.get("info_box") or {}
    if info:
        out.append("### 基本資訊")
        for k, v in info.items():
            out.append(f"- **{k}**: {v}")
        out.append("")
    sections = baidu.get("section_titles") or []
    if sections:
        out.append("### 百度百科原文目錄(僅供參考)")
        for s in sections:
            out.append(f"- {s}")
        out.append("")
    return out


def _museum_label(key: str) -> str:
    return {
        "met_museum": "大都會藝術博物館 (Met)",
        "va": "維多利亞與艾伯特博物館 (V&A)",
        "europeana": "Europeana(歐洲文化遺產聚合)",
        "smithsonian": "史密森尼學會 (Smithsonian)",
        "moma": "現代藝術博物館 (MoMA)",
        "vitra": "Vitra Design Museum",
        "design_museum_london": "Design Museum London",
    }.get(key, key)


def _render_museum_section(extra: dict[str, Any]) -> list[str]:
    """博物館典藏 — collection objects (artworks/objects with date/medium/maker)."""
    keys = ("met_museum", "va", "europeana", "smithsonian", "moma", "vitra")
    populated = [(k, extra.get(k)) for k in keys if extra.get(k)]
    if not populated:
        return []
    out = ["## 博物館典藏", ""]
    for key, hits in populated:
        if not isinstance(hits, list):
            continue
        out.append(f"### {_museum_label(key)}")
        for h in hits[:5]:
            title = h.get("title") or "(無標題)"
            url = h.get("url")
            line = f"- **[{title}]({url})**" if url else f"- **{title}**"
            details = []
            for field in ("maker", "artist", "creator", "designer"):
                if h.get(field):
                    details.append(str(h[field]))
                    break
            if h.get("date"):
                details.append(str(h["date"]))
            if h.get("medium"):
                details.append(str(h["medium"]))
            elif h.get("materials"):
                details.append(str(h["materials"]))
            if h.get("place"):
                details.append(str(h["place"]))
            elif h.get("country"):
                details.append(str(h["country"]))
            if details:
                line += "  \n  " + " · ".join(details)
            out.append(line)
            if h.get("image"):
                out.append(f"  ![]({h['image']})")
        out.append("")
    return out


def _render_exhibitions_section(extra: dict[str, Any]) -> list[str]:
    """展覽 / 活動 / 文章 — search hits from sites focused on events not collections."""
    hits = extra.get("design_museum_london")
    if not hits or not isinstance(hits, list):
        return []
    out = ["## 相關展覽與活動", "", "### Design Museum London"]
    for h in hits[:5]:
        title = h.get("title") or "(無標題)"
        url = h.get("url")
        line = f"- **[{title}]({url})**" if url else f"- **{title}**"
        details = []
        if h.get("date"):
            details.append(str(h["date"]))
        if details:
            line += "  \n  " + " · ".join(details)
        out.append(line)
        if h.get("description"):
            out.append(f"  > {h['description'][:240]}")
        if h.get("image"):
            out.append(f"  ![]({h['image']})")
    out.append("")
    return out


def _render_academic_section(extra: dict[str, Any]) -> list[str]:
    doaj = extra.get("doaj") or []
    ia = extra.get("internet_archive") or []
    if not doaj and not ia:
        return []
    out = ["## 學術資源", ""]
    if doaj:
        out.append("### DOAJ(開放取用期刊)")
        for a in doaj[:5]:
            title = a.get("title") or "(無標題)"
            url = a.get("url")
            line = f"- **[{title}]({url})**" if url else f"- **{title}**"
            details = []
            if a.get("authors"):
                details.append(", ".join(a["authors"][:3]))
            if a.get("journal"):
                details.append(f"_{a['journal']}_")
            if a.get("year"):
                details.append(str(a["year"]))
            if details:
                line += "  \n  " + " · ".join(details)
            out.append(line)
            if a.get("abstract"):
                snippet = a["abstract"][:280] + ("…" if len(a["abstract"]) > 280 else "")
                out.append(f"  > {snippet}")
        out.append("")
    if ia:
        out.append("### Internet Archive(電子書與歷史文獻)")
        for b in ia[:5]:
            title = b.get("title") or "(無標題)"
            url = b.get("url")
            line = f"- **[{title}]({url})**" if url else f"- **{title}**"
            details = []
            if b.get("creator"):
                creator = b["creator"]
                if isinstance(creator, list):
                    creator = ", ".join(creator[:2])
                details.append(str(creator))
            if b.get("year"):
                details.append(str(b["year"]))
            if details:
                line += "  \n  " + " · ".join(details)
            out.append(line)
        out.append("")
    return out


def _slugify(title: str) -> str:
    # Keep CJK characters; replace spaces/punctuation with hyphen.
    out = re.sub(r"[\s/\\:*?\"<>|]+", "-", title.strip())
    out = re.sub(r"-+", "-", out).strip("-")
    return out or "untitled"


def convert_file(merged_path: Path, out_dir: Path) -> Path:
    record = json.loads(merged_path.read_text(encoding="utf-8"))
    slug, md = to_markdown(record)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.md"
    out_path.write_text(md, encoding="utf-8")
    return out_path
