"""Wikipedia source — multi-lingual fetch (zh-Hant, zh-Hans, en).

zh.wikipedia.org serves both Hant and Hans variants of the SAME article;
selection is done via the `variant` parameter or Accept-Language header.
So one zhwiki sitelink → two language variants in our output.
"""
from __future__ import annotations

from typing import Any, Optional
from urllib.parse import quote

from src.sources.base import BaseSource, polite_get


LANG_CONFIG: dict[str, dict[str, Optional[str]]] = {
    "zh-hant": {"host": "zh.wikipedia.org", "variant": "zh-tw"},
    "zh-hans": {"host": "zh.wikipedia.org", "variant": "zh-cn"},
    "en":      {"host": "en.wikipedia.org",  "variant": None},
}


class WikipediaSource(BaseSource):
    name = "wikipedia"

    def fetch(self, title: str, lang: str = "en") -> dict[str, Any]:
        if lang not in LANG_CONFIG:
            raise ValueError(f"Unsupported wikipedia lang: {lang}")
        cfg = LANG_CONFIG[lang]
        host: str = cfg["host"]  # type: ignore[assignment]
        variant: Optional[str] = cfg["variant"]

        record: dict[str, Any] = {
            "lang": lang,
            "title": title,
            "host": host,
            "variant": variant,
        }

        summary = self._fetch_summary(host, title, variant)
        if summary:
            record["summary"] = summary

        extract = self._fetch_extract(host, title, variant)
        if extract:
            record["extract"] = extract

        record["url"] = self._page_url(host, title, variant)
        return record

    @staticmethod
    def _page_url(host: str, title: str, variant: Optional[str]) -> str:
        url = f"https://{host}/wiki/{quote(title.replace(' ', '_'))}"
        if variant:
            url += f"?variant={variant}"
        return url

    def _fetch_summary(
        self, host: str, title: str, variant: Optional[str]
    ) -> Optional[dict[str, Any]]:
        url = f"https://{host}/api/rest_v1/page/summary/{quote(title.replace(' ', '_'))}"
        headers = {}
        if variant:
            headers["Accept-Language"] = variant
        try:
            r = polite_get(self.session, url, headers=headers)
        except Exception:
            return None
        data = r.json()
        return {
            "title": data.get("title"),
            "display_title": data.get("displaytitle"),
            "description": data.get("description"),
            "extract": data.get("extract"),
            "image": (data.get("thumbnail") or {}).get("source"),
            "original_image": (data.get("originalimage") or {}).get("source"),
            "url": (data.get("content_urls") or {}).get("desktop", {}).get("page"),
        }

    def _fetch_extract(
        self,
        host: str,
        title: str,
        variant: Optional[str],
        intro_only: bool = True,
        max_chars: int = 4000,
    ) -> Optional[str]:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "titles": title,
            "prop": "extracts",
            "explaintext": 1,
            "exlimit": 1,
            "redirects": 1,
            "exchars": max_chars,
        }
        if intro_only:
            params["exintro"] = 1
        if variant:
            params["variant"] = variant
        url = f"https://{host}/w/api.php"
        try:
            r = polite_get(self.session, url, params=params)
        except Exception:
            return None
        data = r.json()
        pages = data.get("query", {}).get("pages", {}) or {}
        for _, page in pages.items():
            if "extract" in page:
                return page["extract"]
        return None
