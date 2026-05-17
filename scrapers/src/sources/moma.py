"""MoMA — Museum of Modern Art (NYC).

MoMA has NO public REST API for the collection, but they publish the entire
collection data as CC0 JSON on GitHub:
  https://github.com/MuseumofModernArt/collection

Strategy: download Artists.json + Artworks.json once (~30 MB combined), cache to
data/cache/moma/, and search locally.

Run once:
  python run.py moma-import

Then `MoMA().search(name)` queries the local cache.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from src.sources.base import BaseSource, polite_get


ARTISTS_URL = "https://media.githubusercontent.com/media/MuseumofModernArt/collection/main/Artists.json"
ARTWORKS_URL = "https://media.githubusercontent.com/media/MuseumofModernArt/collection/main/Artworks.json"

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / "data" / "cache" / "moma"
ARTISTS_PATH = CACHE_DIR / "Artists.json"
ARTWORKS_PATH = CACHE_DIR / "Artworks.json"


class MoMA(BaseSource):
    name = "moma"

    def __init__(self) -> None:
        super().__init__()
        self._artists: Optional[list[dict[str, Any]]] = None
        self._artworks: Optional[list[dict[str, Any]]] = None

    @staticmethod
    def is_imported() -> bool:
        return ARTISTS_PATH.exists() and ARTWORKS_PATH.exists()

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": self.search(identifier)}

    def import_data(self) -> None:
        """Download Artists.json and Artworks.json to local cache."""
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        for url, dest in ((ARTISTS_URL, ARTISTS_PATH), (ARTWORKS_URL, ARTWORKS_PATH)):
            print(f"Downloading {url} → {dest} ...")
            r = polite_get(self.session, url, stream=True, timeout=300)
            with open(dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 16):
                    if chunk:
                        f.write(chunk)
            print(f"  saved {dest.stat().st_size:,} bytes")

    def _load(self) -> None:
        if self._artists is None and ARTISTS_PATH.exists():
            self._artists = json.loads(ARTISTS_PATH.read_text(encoding="utf-8"))
        if self._artworks is None and ARTWORKS_PATH.exists():
            self._artworks = json.loads(ARTWORKS_PATH.read_text(encoding="utf-8"))

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not self.is_imported() or not query:
            return []
        self._load()
        if self._artists is None or self._artworks is None:
            return []

        q_lower = query.lower()
        # Match artists whose name contains the query.
        matching_artist_ids: set[int] = set()
        artist_info: dict[int, dict[str, Any]] = {}
        for a in self._artists:
            name = (a.get("DisplayName") or "").lower()
            if q_lower in name:
                cid = a.get("ConstituentID")
                if cid is not None:
                    matching_artist_ids.add(cid)
                    artist_info[cid] = a
                    if len(matching_artist_ids) >= 20:
                        break

        hits: list[dict[str, Any]] = []

        # First: works by matching artists.
        if matching_artist_ids:
            for w in self._artworks:
                ids = w.get("ConstituentID") or []
                if any(cid in matching_artist_ids for cid in ids):
                    hits.append(self._parse_artwork(w, artist_info))
                    if len(hits) >= limit:
                        break

        # Fallback: works whose title contains the query.
        if len(hits) < limit:
            for w in self._artworks:
                title = (w.get("Title") or "").lower()
                if q_lower in title:
                    hits.append(self._parse_artwork(w, artist_info))
                    if len(hits) >= limit:
                        break

        return hits[:limit]

    @staticmethod
    def _parse_artwork(w: dict[str, Any], artist_info: dict[int, dict[str, Any]]) -> dict[str, Any]:
        artist_names = []
        for cid in (w.get("ConstituentID") or []):
            a = artist_info.get(cid)
            if a and a.get("DisplayName"):
                artist_names.append(a["DisplayName"])
        return {
            "id": w.get("ObjectID"),
            "title": w.get("Title"),
            "artist": ", ".join(artist_names) or (w.get("Artist") or [None])[0] if isinstance(w.get("Artist"), list) else w.get("Artist"),
            "date": w.get("Date"),
            "medium": w.get("Medium"),
            "classification": w.get("Classification"),
            "department": w.get("Department"),
            "image": w.get("ThumbnailURL") or w.get("URL"),
            "url": w.get("URL"),
        }
