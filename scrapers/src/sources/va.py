"""Victoria & Albert Museum — public API, no key needed.

Docs: https://developers.vam.ac.uk/
Returns search hits directly with metadata + IIIF image URLs.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


VA_BASE = "https://api.vam.ac.uk/v2"


class VandA(BaseSource):
    name = "va"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def search(self, query: str, limit: int = 5, images_only: bool = True) -> list[dict[str, Any]]:
        if not query:
            return []
        params: dict[str, Any] = {
            "q": query,
            "page_size": limit,
        }
        if images_only:
            params["images_exist"] = "1"
        try:
            r = polite_get(self.session, f"{VA_BASE}/objects/search", params=params)
        except Exception:
            return []
        data = r.json()
        results: list[dict[str, Any]] = []
        for rec in (data.get("records") or [])[:limit]:
            results.append(self._parse_record(rec))
        return results

    @staticmethod
    def _parse_record(rec: dict[str, Any]) -> dict[str, Any]:
        sys_id = rec.get("systemNumber") or rec.get("system_number")
        maker = (rec.get("_primaryMaker") or {}).get("name")
        date = rec.get("_primaryDate") or (rec.get("_primaryDateMade") or {}).get("date")

        image_url = None
        imgs = rec.get("_images") or {}
        iiif_base = imgs.get("_iiif_image_base_url")
        if iiif_base:
            image_url = iiif_base.rstrip("/") + "/full/!400,400/0/default.jpg"
        elif imgs.get("_primary_thumbnail"):
            image_url = imgs["_primary_thumbnail"]

        return {
            "id": sys_id,
            "title": rec.get("_primaryTitle") or rec.get("title"),
            "maker": maker,
            "date": date,
            "place": (rec.get("_primaryPlace") or None),
            "materials": rec.get("_primaryMaterials"),
            "image": image_url,
            "url": f"https://collections.vam.ac.uk/item/{sys_id}/" if sys_id else None,
        }
