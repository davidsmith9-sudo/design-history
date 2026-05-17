"""Europeana — pan-European cultural heritage aggregator.

Docs: https://pro.europeana.eu/page/apis
Requires a free API key. Get one at https://api.europeana.eu/api/v2/getApiKey
Set as env var EUROPEANA_API_KEY.
"""
from __future__ import annotations

import os
from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


EUROPEANA_BASE = "https://api.europeana.eu/record/v2/search.json"


class Europeana(BaseSource):
    name = "europeana"

    def __init__(self) -> None:
        super().__init__()
        self.api_key = os.environ.get("EUROPEANA_API_KEY", "").strip()

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not query or not self.api_key:
            return []
        params: dict[str, Any] = {
            "wskey": self.api_key,
            "query": query,
            "rows": limit,
            "media": "true",
            "thumbnail": "true",
            "qf": "TYPE:IMAGE",
            "profile": "minimal",
        }
        try:
            r = polite_get(self.session, EUROPEANA_BASE, params=params)
        except Exception:
            return []
        data = r.json()
        results: list[dict[str, Any]] = []
        for item in (data.get("items") or [])[:limit]:
            results.append({
                "id": item.get("id"),
                "title": (item.get("title") or [None])[0],
                "creator": (item.get("dcCreator") or [None])[0],
                "date": (item.get("year") or [None])[0],
                "provider": (item.get("dataProvider") or [None])[0],
                "country": (item.get("country") or [None])[0],
                "rights": item.get("rights", [None])[0],
                "image": item.get("edmPreview", [None])[0],
                "url": item.get("guid") or (item.get("edmIsShownAt") or [None])[0],
            })
        return results

    def is_configured(self) -> bool:
        return bool(self.api_key)
