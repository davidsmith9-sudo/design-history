"""百度百科 — HTML scrape for simplified-Chinese supplement.

Baidu Baike has no public API. We GET the article URL and parse with BeautifulSoup.
Their page structure is server-rendered (mostly); typical anti-bot is checking the
User-Agent, which we set to a recent Chrome UA. Be polite — small fetch limits,
respect their server.
"""
from __future__ import annotations

import re
from typing import Any, Optional
from urllib.parse import quote

from bs4 import BeautifulSoup

from src.sources.base import BaseSource, polite_get


BAIKE_BASE = "https://baike.baidu.com/item/"
BAIKE_SEARCH = "https://baike.baidu.com/search/word"

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/130.0.0.0 Safari/537.36"
)


class BaiduBaike(BaseSource):
    name = "baidu_baike"

    def __init__(self) -> None:
        super().__init__()
        # Baidu has aggressive anti-bot. Send a full browser-like header set.
        # Even so, requests from outside mainland China may be 403'd — see
        # README "已知限制" section.
        self.session.headers.update({
            "User-Agent": BROWSER_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        })

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        result = self.fetch_by_title(identifier)
        return result or {}

    def fetch_by_title(self, title: str) -> Optional[dict[str, Any]]:
        if not title:
            return None
        result = self._try_fetch(title)
        if result:
            return result
        # Fallback: route via Baidu's search endpoint, which finds the canonical
        # article title even when the input uses a different variant (e.g.
        # 台灣繁體「包浩斯」→ Baidu canonical「包豪斯」).
        return self._search_then_fetch(title)

    def _try_fetch(self, title: str) -> Optional[dict[str, Any]]:
        url = BAIKE_BASE + quote(title, safe="")
        try:
            r = polite_get(self.session, url)
        except Exception:
            return None
        return self._parse(r.text, url, title)

    def _search_then_fetch(self, query: str) -> Optional[dict[str, Any]]:
        try:
            r = polite_get(
                self.session,
                BAIKE_SEARCH,
                params={"word": query, "pn": 0, "rn": 10},
            )
        except Exception:
            return None
        # Search results page contains anchors like <a href="/item/包豪斯/...">...
        m = re.search(r'href="(/item/[^"#?]+)', r.text)
        if not m:
            return None
        url = "https://baike.baidu.com" + m.group(1)
        try:
            r2 = polite_get(self.session, url)
        except Exception:
            return None
        return self._parse(r2.text, url, query)

    def _parse(self, html: str, url: str, original_query: str) -> Optional[dict[str, Any]]:
        if "百度百科尚未收录" in html or "您所访问的页面不存在" in html:
            return None
        if "lemmaWgt-lemmaTitle" not in html and "lemma-summary" not in html and "J-lemma-content" not in html and "lemmaSummary" not in html:
            return None

        soup = BeautifulSoup(html, "lxml")
        actual_title = self._extract_title(soup) or original_query
        summary = self._extract_summary(soup)
        info_box = self._extract_info_box(soup)
        sections = self._extract_section_titles(soup)

        # Empty result = treat as miss (caller skips the section).
        if not summary and not info_box and not sections:
            return None

        return {
            "title": actual_title,
            "summary": summary,
            "info_box": info_box,
            "section_titles": sections,
            "url": url,
        }

    # --- parsers ---

    @staticmethod
    def _extract_title(soup: BeautifulSoup) -> Optional[str]:
        for sel in ("h1.lemmaTitle", ".lemmaWgt-lemmaTitle-title h1", "h1"):
            el = soup.select_one(sel)
            if el:
                return el.get_text(strip=True)
        return None

    @staticmethod
    def _extract_summary(soup: BeautifulSoup) -> Optional[str]:
        for sel in (".lemma-summary", ".lemmaSummary_p7Ima", ".J-lemma-content", "div[label-module=lemmaSummary]"):
            el = soup.select_one(sel)
            if el:
                text = el.get_text("\n", strip=True)
                # Strip Baidu reference markers [1][2] etc.
                text = re.sub(r"\s*\[\d+(?:-\d+)?\]\s*", "", text)
                return text
        return None

    @staticmethod
    def _extract_info_box(soup: BeautifulSoup) -> dict[str, str]:
        info: dict[str, str] = {}
        # Old structure
        names = soup.select(".basicInfo-item.name")
        values = soup.select(".basicInfo-item.value")
        for n, v in zip(names, values):
            k = re.sub(r"\s+", "", n.get_text(strip=True))
            val = re.sub(r"\s*\[\d+(?:-\d+)?\]\s*", "", v.get_text(" ", strip=True))
            if k:
                info[k] = val
        # New structure (data-module=basicInfo wrappers)
        for row in soup.select("dt.basicInfo-item, .basicInfoItem_w7TT2 dt"):
            sib = row.find_next_sibling("dd")
            if sib:
                k = re.sub(r"\s+", "", row.get_text(strip=True))
                val = re.sub(r"\s*\[\d+(?:-\d+)?\]\s*", "", sib.get_text(" ", strip=True))
                if k and k not in info:
                    info[k] = val
        return info

    @staticmethod
    def _extract_section_titles(soup: BeautifulSoup) -> list[str]:
        titles: list[str] = []
        for h in soup.select("h2.lemma-h2, h2 .title-text, .para-title h2"):
            t = h.get_text(strip=True)
            t = re.sub(r"^[\d\.\s]+", "", t)
            if t and t not in titles:
                titles.append(t)
        return titles[:20]
