"""Convert 大陸繁體 → 台灣繁體 — vocabulary + 譯名 aware.

Wikidata's `zh-hant` labels are often 大陸繁體 (e.g. 勒·柯布西耶, 包豪斯,
弗蘭克·勞埃德·賴特). The design-history site uses 台灣繁體 (勒·柯比意, 包浩斯,
弗蘭克·洛伊·萊特).

Strategy:
  1. OpenCC `s2twp` for char-level + general phrase conversion (網絡 → 網路 etc.)
  2. Custom design-history term dict for 專名 (Western architect/designer names)
     that aren't in OpenCC's standard data.

The custom dict was seeded by harvesting actual title vocab from
`content/{40-流派,50-人物,60-作品}/*.md` — i.e. what the user already authored.
Extend as new mismatches are discovered during review.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Optional


# 大陸繁體 / Wikidata zh-hant default → 台灣繁體 (site vocabulary).
# Longest keys are applied first to avoid partial overlap (e.g. "勒·柯布西耶"
# before "柯布西耶").
CUSTOM_TW: dict[str, str] = {
    # === Architects ===
    "勒·柯布西耶": "勒·柯比意",
    "勒·柯布西埃": "勒·柯比意",
    "柯布西耶": "柯比意",
    "柯布西埃": "柯比意",
    "瓦爾特·格羅皮烏斯": "華特·葛羅培斯",
    "華特·格羅皮烏斯": "華特·葛羅培斯",
    "格羅皮烏斯": "葛羅培斯",
    "格羅佩斯": "葛羅培斯",
    "葛羅佩斯": "葛羅培斯",
    "弗蘭克·勞埃德·賴特": "弗蘭克·洛伊·萊特",
    "法蘭克·勞埃德·賴特": "弗蘭克·洛伊·萊特",
    "勞埃德·賴特": "洛伊·萊特",
    "弗蘭克·歐恩·蓋裡": "法蘭克·蓋瑞",
    "弗蘭克·蓋裡": "法蘭克·蓋瑞",
    "扎哈·哈迪德": "札哈·哈蒂",
    "哈迪德": "哈蒂",
    "倫佐·皮亞諾": "倫佐·皮亞諾",  # same — kept for safety
    "貝聿銘": "貝聿銘",
    "讓·努維爾": "尚·努維爾",
    "努維爾": "努維爾",

    # === Artists / Painters ===
    "瓦西里·康定斯基": "瓦西里·康丁斯基",
    "康定斯基": "康丁斯基",
    "古斯塔夫·克林姆特": "古斯塔夫·克林姆",
    "克林姆特": "克林姆",
    "安迪·沃霍爾": "安迪·沃荷",
    "沃霍爾": "沃荷",
    "皮特·蒙德里安": "皮特·蒙德里安",
    "皮特·蒙德裡安": "皮特·蒙德里安",
    "蒙德裡安": "蒙德里安",
    "馬克·夏加爾": "馬克·夏卡爾",
    "夏加爾": "夏卡爾",
    "畢加索": "畢卡索",
    "畢沙羅": "畢沙羅",

    # === Designers ===
    "馬西莫·維尼利": "馬西莫·維涅利",
    "查爾斯·雷尼·麥金托什": "查爾斯·雷尼·麥金托什",  # same
    "查爾斯·麥金托什": "查爾斯·雷尼·麥金托什",
    "阿爾瓦·阿爾托": "阿爾瓦·阿爾托",  # same
    "阿恩·雅各布森": "阿恩·雅各布森",  # same

    # === Schools / Movements ===
    "包豪斯": "包浩斯",
    "包豪斯運動": "包浩斯運動",
    "包豪斯設計": "包浩斯設計",
    "斯堪的納維亞": "斯堪地那維亞",
    "斯堪的納維亞設計": "斯堪地那維亞設計",
    "新藝術主義": "新藝術運動",  # 大陸 sometimes calls it 主義
    "達達": "達達",  # same

    # === Buildings / Works ===
    "薩伏依別墅": "薩伏伊別墅",  # site uses 薩伏伊
    "包豪斯校舍": "包浩斯校舍",
    "包豪斯德紹校舍": "包浩斯德紹校舍",
    "畢爾巴鄂古根海姆博物館": "畢爾包古根漢美術館",
    "古根海姆": "古根漢",

    # === Places (in name context) ===
    "巴塞羅那": "巴塞隆納",
    "畢爾巴鄂": "畢爾包",
    "悉尼": "雪梨",
    "悉尼歌劇院": "雪梨歌劇院",
    "戛納": "坎城",
    "舊金山": "舊金山",  # same
    "聖彼得堡": "聖彼得堡",  # same
}


@lru_cache(maxsize=1)
def _opencc_converter():
    """Try the C-binding `opencc` first (faster, complete dict), fall back to
    `opencc-python-reimplemented`. Return None if neither is importable."""
    try:
        import opencc  # type: ignore
        return opencc.OpenCC("s2twp")
    except Exception:
        return None


def to_taiwan(text: Optional[str]) -> Optional[str]:
    """Convert one string from 大陸繁體 / 簡體 to 台灣繁體, preserving non-CJK text."""
    if not text or not isinstance(text, str):
        return text
    converted = text
    cc = _opencc_converter()
    if cc is not None:
        try:
            converted = cc.convert(text)
        except Exception:
            converted = text
    return _apply_custom_dict(converted)


def _apply_custom_dict(text: str) -> str:
    # Apply longest mappings first so that "勒·柯布西耶" replaces before
    # "柯布西耶" matches and only converts the suffix.
    for k in sorted(CUSTOM_TW.keys(), key=len, reverse=True):
        if k in text:
            text = text.replace(k, CUSTOM_TW[k])
    return text


def is_available() -> bool:
    """Returns True if OpenCC is available; otherwise we run with custom dict only."""
    return _opencc_converter() is not None
