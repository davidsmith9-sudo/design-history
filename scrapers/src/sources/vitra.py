"""Vitra Design Museum — stub.

No public API. HTML scrape would be fragile and yields limited structured data.
Left as a stub returning empty results. To implement, target the collection
search page at https://www.design-museum.de/en/collection/search.html and parse
the result list HTML.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource


class Vitra(BaseSource):
    name = "vitra"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": []}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        # TODO: implement HTML scrape of design-museum.de/en/collection/search.html
        return []
