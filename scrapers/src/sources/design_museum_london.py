"""Design Museum London — HTML scrape of their site search.

No public API. Their site search at /search?q=<query> returns server-rendered
HTML with `<div class="page-item">` blocks. Selectors are brittle by nature —
if their site is redesigned, parsing will return [] and the pipeline continues.

NOTE: Design Museum London is more of an exhibitions/events organization than
a queryable collection — search hits are typically pages, talks, articles
rather than catalog records.
"""
from __future__ import annotations

import re
from typing import Any, Optional
from urllib.parse import quote

from bs4 import BeautifulSoup

from src.sources.base import BaseSource, polite_get


BASE = "https://designmuseum.org"
SEARCH = BASE + "/search?q={q}"

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/130.0.0.0 Safari/537.36"
)


class DesignMuseumLondon(BaseSource):
    name = "design_museum_london"

    def __init__(self) -> None:
        super().__init__()
        self.session.headers.update({
            "User-Agent": BROWSER_UA,
            "Accept-Language": "en;q=0.9",
        })

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not query:
            return []
        url = SEARCH.format(q=quote(query))
        try:
            r = polite_get(self.session, url)
        except Exception:
            return []

        soup = BeautifulSoup(r.text, "lxml")
        results: list[dict[str, Any]] = []
        for item in soup.select("div.page-item"):
            parsed = self._parse_item(item)
            if parsed:
                results.append(parsed)
            if len(results) >= limit:
                break
        return results

    @staticmethod
    def _parse_item(item: Any) -> Optional[dict[str, Any]]:
        title_el = item.select_one("h2")
        title = title_el.get_text(strip=True) if title_el else None
        if not title:
            return None

        link_el = item.find("a", href=True)
        url = link_el["href"] if link_el else None
        if url and url.startswith("/"):
            url = BASE + url

        date_el = item.select_one("time, .icon-date")
        date = date_el.get_text(strip=True) if date_el else None

        desc_el = item.select_one(".rich-text")
        desc = None
        if desc_el:
            text = desc_el.get_text(" ", strip=True)
            desc = re.sub(r"\s+", " ", text)[:300] or None

        image = None
        fig = item.find("figure")
        if fig:
            style = fig.get("style", "")
            m = re.search(r"url\(([^)]+)\)", style)
            if m:
                image_url = m.group(1).strip().strip("'\"")
                if image_url.startswith("/"):
                    image_url = BASE + image_url
                image = image_url

        return {
            "title": title,
            "url": url,
            "date": date,
            "description": desc,
            "image": image,
        }
