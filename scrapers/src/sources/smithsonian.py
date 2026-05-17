"""Smithsonian Open Access — covers Cooper Hewitt (NY design museum) too.

Docs: https://edan.si.edu/openaccess/apidocs/
Requires a free api.data.gov API key. Set env var SMITHSONIAN_API_KEY
(or DATA_GOV_API_KEY).
"""
from __future__ import annotations

import os
from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


SI_BASE = "https://api.si.edu/openaccess/api/v1.0/search"


class Smithsonian(BaseSource):
    name = "smithsonian"

    def __init__(self) -> None:
        super().__init__()
        self.api_key = (
            os.environ.get("SMITHSONIAN_API_KEY")
            or os.environ.get("DATA_GOV_API_KEY")
            or ""
        ).strip()

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5, design_unit_only: bool = True) -> list[dict[str, Any]]:
        if not query or not self.api_key:
            return []
        q = query
        if design_unit_only:
            # Bias toward Cooper Hewitt (design) but don't strictly require it.
            q = f'{query} AND (unit_code:CHNDM OR unit_code:NMAH)'
        params: dict[str, Any] = {
            "api_key": self.api_key,
            "q": q,
            "rows": limit,
        }
        try:
            r = polite_get(self.session, SI_BASE, params=params)
        except Exception:
            return []
        data = r.json()
        rows = ((data.get("response") or {}).get("rows") or [])[:limit]
        results: list[dict[str, Any]] = []
        for row in rows:
            content = row.get("content", {}) or {}
            desc = content.get("descriptiveNonRepeating", {}) or {}
            indexed = content.get("indexedStructured", {}) or {}
            online = (desc.get("online_media") or {}).get("media") or []
            image = online[0].get("thumbnail") if online else None
            results.append({
                "id": row.get("id"),
                "title": (desc.get("title", {}) or {}).get("content") or row.get("title"),
                "creator": ", ".join(indexed.get("name", []) or []) or None,
                "date": ", ".join(indexed.get("date", []) or []) or None,
                "object_type": ", ".join(indexed.get("object_type", []) or []) or None,
                "unit": row.get("unitCode"),
                "image": image,
                "url": (desc.get("record_link") or row.get("url")),
            })
        return results

    def is_configured(self) -> bool:
        return bool(self.api_key)
