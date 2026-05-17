"""Design Museum London — stub.

No public API. The site uses dynamic search at https://designmuseum.org/.
Left as a stub returning empty results.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource


class DesignMuseumLondon(BaseSource):
    name = "design_museum_london"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": []}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        # TODO: implement HTML scrape of designmuseum.org/search
        return []
