"""Vitra Design Museum — stub.

Status: their digital collection at https://collection.design-museum.de/ is a
client-side SPA — the HTML shell is only ~2 KB with `<div id="app"></div>` and
two JS bundles. No JSON API endpoint was discoverable from external probing
(/api, /api/v1, /api/search, /api/objects all 404). Their main-site search at
www.design-museum.de also 404s on common URL patterns.

To implement this properly you'd need one of:

  (a) Playwright/Selenium browser automation to render the SPA and scrape the
      rendered DOM. Heavy dependency, slow.
  (b) Reverse-engineer the actual API endpoint by inspecting their JS bundle
      and replicating their fetch calls. Brittle if they redeploy.
  (c) Contact Vitra Design Museum directly to request API access.

For now this scraper returns []; the pipeline gracefully skips it.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource


class Vitra(BaseSource):
    name = "vitra"

    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        return {"hits": []}

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        return []
