"""Internet Archive — free public search. No key needed.

Docs: https://archive.org/advancedsearch.php (also see /developers)
Great for out-of-copyright design-history books and historical documents.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


IA_SEARCH = "https://archive.org/advancedsearch.php"


class InternetArchive(BaseSource):
    name = "internet_archive"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(
        self,
        query: str,
        mediatype: str = "texts",
        limit: int = 5,
        sort: str = "downloads desc",
    ) -> list[dict[str, Any]]:
        if not query:
            return []
        # Escape inner quotes for query safety.
        clean = query.replace('"', '\\"')
        q = f'mediatype:{mediatype} AND ("{clean}")'
        params = {
            "q": q,
            "fl[]": ["identifier", "title", "creator", "year", "description", "language", "subject"],
            "sort[]": sort,
            "rows": limit,
            "page": 1,
            "output": "json",
        }
        try:
            r = polite_get(self.session, IA_SEARCH, params=params)
        except Exception:
            return []
        data = r.json()
        results: list[dict[str, Any]] = []
        for doc in ((data.get("response") or {}).get("docs") or [])[:limit]:
            desc = doc.get("description")
            if isinstance(desc, list):
                desc = " ".join(desc)
            if desc:
                desc = desc[:300].strip()
            results.append({
                "id": doc.get("identifier"),
                "title": doc.get("title"),
                "creator": doc.get("creator"),
                "year": doc.get("year"),
                "language": doc.get("language"),
                "subject": doc.get("subject"),
                "description": desc,
                "url": f"https://archive.org/details/{doc.get('identifier')}",
            })
        return results
