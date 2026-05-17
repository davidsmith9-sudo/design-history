"""Met Museum Open Access — public API, no key needed.

Docs: https://metmuseum.github.io/
Search returns object IDs; we fetch full metadata for the top N.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1"


class MetMuseum(BaseSource):
    name = "met_museum"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5, only_with_images: bool = True) -> list[dict[str, Any]]:
        if not query:
            return []
        params = {"q": query}
        if only_with_images:
            params["hasImages"] = "true"
        try:
            r = polite_get(self.session, f"{MET_BASE}/search", params=params)
        except Exception:
            return []
        data = r.json()
        ids = (data.get("objectIDs") or [])[:limit]
        results = []
        for oid in ids:
            obj = self._object(oid)
            if obj:
                results.append(obj)
        return results

    def _object(self, oid: int) -> Optional[dict[str, Any]]:
        try:
            r = polite_get(self.session, f"{MET_BASE}/objects/{oid}")
        except Exception:
            return None
        d = r.json()
        return {
            "id": d.get("objectID"),
            "title": d.get("title"),
            "artist": d.get("artistDisplayName") or None,
            "artist_nationality": d.get("artistNationality") or None,
            "date": d.get("objectDate"),
            "culture": d.get("culture") or d.get("country"),
            "medium": d.get("medium"),
            "classification": d.get("classification"),
            "department": d.get("department"),
            "image": d.get("primaryImageSmall") or d.get("primaryImage") or None,
            "url": d.get("objectURL"),
            "credit": d.get("creditLine"),
            "is_public_domain": d.get("isPublicDomain"),
        }
