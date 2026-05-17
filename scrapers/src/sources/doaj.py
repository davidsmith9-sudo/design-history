"""DOAJ — Directory of Open Access Journals. Free API, no key.

Docs: https://doaj.org/api/v3/docs
Useful for finding open-access academic articles on design history topics.
"""
from __future__ import annotations

from typing import Any, Optional
from urllib.parse import quote

from src.sources.base import BaseSource, polite_get


DOAJ_BASE = "https://doaj.org/api/v3/search/articles"


class DOAJ(BaseSource):
    name = "doaj"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not query:
            return []
        url = f"{DOAJ_BASE}/{quote(query, safe='')}"
        params = {"pageSize": limit}
        try:
            r = polite_get(self.session, url, params=params)
        except Exception:
            return []
        data = r.json()
        results: list[dict[str, Any]] = []
        for hit in (data.get("results") or [])[:limit]:
            bib = hit.get("bibjson", {}) or {}
            fulltext_url = None
            for link in (bib.get("link") or []):
                if link.get("type") == "fulltext":
                    fulltext_url = link.get("url")
                    break
            authors = [a.get("name") for a in (bib.get("author") or []) if a.get("name")]
            results.append({
                "id": hit.get("id"),
                "title": bib.get("title"),
                "authors": authors,
                "year": bib.get("year"),
                "journal": (bib.get("journal") or {}).get("title"),
                "language": ", ".join((bib.get("journal") or {}).get("language") or []) or None,
                "abstract": (bib.get("abstract") or "").strip() or None,
                "url": fulltext_url or f"https://doaj.org/article/{hit.get('id')}",
            })
        return results
