#!/usr/bin/env python3
"""Download externally-linked images into 99-素材/images/ and rewrite markdown to use local ![[]] embeds."""
import re
import urllib.request
import urllib.parse
from pathlib import Path

BASE = Path(r"D:\design-history-website\content")
IMG_BASE = BASE / "99-素材" / "images"

UA = "DesignHistoryNotes/1.0 (https://design-history.pages.dev; pdbl8951@gmail.com)"

# Files to process: (relpath, target_subfolder, output_filename_stem)
TARGETS = [
    # 流派
    ("40-流派/中國書法傳統.md", "流派", "中國書法傳統"),
    ("40-流派/伊斯蘭幾何設計.md", "流派", "伊斯蘭幾何設計"),
    ("40-流派/古希臘古典.md", "流派", "古希臘古典"),
    ("40-流派/哥德式建築.md", "流派", "哥德式建築"),
    ("40-流派/國際樣式.md", "流派", "國際樣式"),
    ("40-流派/孟菲斯設計.md", "流派", "孟菲斯設計"),
    ("40-流派/工藝美術運動.md", "流派", "工藝美術運動"),
    ("40-流派/巴洛克.md", "流派", "巴洛克"),
    ("40-流派/文藝復興建築.md", "流派", "文藝復興建築"),
    ("40-流派/新藝術運動.md", "流派", "新藝術運動"),
    ("40-流派/日本民藝運動.md", "流派", "日本民藝運動"),
    ("40-流派/普普藝術.md", "流派", "普普藝術"),
    ("40-流派/構成主義.md", "流派", "構成主義"),
    ("40-流派/浮世繪.md", "流派", "浮世繪"),
    ("40-流派/瑞士國際主義.md", "流派", "瑞士國際主義"),
    ("40-流派/維也納分離派.md", "流派", "維也納分離派"),
    ("40-流派/裝飾藝術.md", "流派", "裝飾藝術"),
    ("40-流派/解構主義.md", "流派", "解構主義"),
    ("40-流派/達達主義.md", "流派", "達達主義"),
    ("40-流派/風格派.md", "流派", "風格派"),
    ("40-流派/包浩斯.md", "流派", "包浩斯"),
    # 時代
    ("10-時代/中世紀設計.md", "時代", "中世紀設計"),
    ("10-時代/古代設計.md", "時代", "古代設計"),
    ("10-時代/工業革命與設計.md", "時代", "工業革命與設計"),
    ("10-時代/後現代主義.md", "時代", "後現代主義"),
    ("10-時代/文藝復興設計.md", "時代", "文藝復興設計"),
    ("10-時代/現代主義.md", "時代", "現代主義"),
    ("10-時代/當代設計.md", "時代", "當代設計"),
    # 地區
    ("20-地區/印度設計史.md", "地區", "印度設計史"),
    ("20-地區/東亞設計史.md", "地區", "東亞設計史"),
    ("20-地區/歐洲設計史.md", "地區", "歐洲設計史"),
    ("20-地區/美洲設計史.md", "地區", "美洲設計史"),
    ("20-地區/其他地區設計史.md", "地區", "其他地區設計史"),
    # 領域
    ("30-領域/UI-UX設計史.md", "領域", "UI-UX設計史"),
    ("30-領域/字體設計史.md", "領域", "字體設計史"),
    ("30-領域/家具設計史.md", "領域", "家具設計史"),
    ("30-領域/工業設計史.md", "領域", "工業設計史"),
    ("30-領域/平面設計史.md", "領域", "平面設計史"),
    ("30-領域/建築史.md", "領域", "建築史"),
    # 作品 + 理論 (skip 落水山莊 — already local)
    ("60-作品/1964東京奧運海報.md", "作品", "1964東京奧運海報"),
    ("60-作品/光之教堂.md", "作品", "光之教堂"),
    ("70-理論/包浩斯宣言.md", "理論", "包浩斯宣言"),
]

# Regex to find external image lines: ![caption](https://...) or ![[Special:FilePath/...]]
EXT_PATTERN = re.compile(
    r"!\[([^\]]*)\]\((https?://[^\)]+)\)"
)

def download(url: str, target: Path) -> bool:
    """Download URL to target. Returns True on success."""
    if target.exists():
        print(f"  already downloaded: {target.name}")
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        target.write_bytes(data)
        print(f"  downloaded {len(data)//1024} KB -> {target.name}")
        return True
    except Exception as e:
        print(f"  FAILED: {url} -> {e}")
        return False

def process(file_path: Path, subfolder: str, stem: str):
    print(f"[{file_path.name}]")
    text = file_path.read_text(encoding="utf-8")

    # Find external image line
    m = EXT_PATTERN.search(text)
    if not m:
        print("  no external image found, skipping")
        return

    caption, url = m.group(1), m.group(2)
    # Determine extension from URL
    url_path = urllib.parse.urlparse(url).path
    ext = Path(url_path).suffix.lower() or ".jpg"
    if ext == ".jpeg":
        ext = ".jpg"

    img_dir = IMG_BASE / subfolder
    img_dir.mkdir(parents=True, exist_ok=True)
    target = img_dir / f"{stem}{ext}"

    if not download(url, target):
        return

    # Rewrite markdown: replace the external image line with a local embed
    new_embed = f"![[99-素材/images/{subfolder}/{stem}{ext}]]"
    new_text = text.replace(m.group(0), new_embed)
    file_path.write_text(new_text, encoding="utf-8")
    print(f"  rewrote markdown to use local embed")

for rel, sub, stem in TARGETS:
    process(BASE / rel, sub, stem)

print("\nDone.")
