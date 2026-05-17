"""Wikidata source — fetches structured claims and sitelinks for an entity.

Wikidata acts as the structural backbone:
  - One QID per real-world entity, regardless of language
  - sitelinks → which titles to fetch on each language Wikipedia
  - claims → birth/death dates, nationality, movement, influences, image, etc.
"""
from __future__ import annotations

from typing import Any, Optional

from src.sources.base import BaseSource, polite_get

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"

# Properties we care about for design-history entities.
# Map Wikidata PIDs → human-readable keys used in merged JSON.
USEFUL_PROPS: dict[str, str] = {
    "P31":   "instance_of",
    "P279":  "subclass_of",
    "P569":  "birth_date",
    "P570":  "death_date",
    "P19":   "place_of_birth",
    "P20":   "place_of_death",
    "P27":   "citizenship",
    "P106":  "occupation",
    "P135":  "movement",
    "P136":  "genre",
    "P800":  "notable_work",
    "P571":  "inception",
    "P576":  "dissolved",
    "P17":   "country",
    "P276":  "location",
    "P170":  "creator",
    "P112":  "founded_by",
    "P737":  "influenced_by",
    "P802":  "students",
    "P1066": "student_of",
    "P184":  "doctoral_advisor",
    "P140":  "religion_or_worldview",
    "P186":  "material",
    "P18":   "image",
    "P154":  "logo_image",
    "P1424": "topic_main_template",
    "P973":  "described_at_url",
}

# Languages we collect labels/aliases/descriptions in.
LANGS = ("zh-hant", "zh-hans", "zh", "zh-tw", "zh-cn", "en")

# Sitelinks we care about.
SITES = ("zhwiki", "enwiki")


class WikidataSource(BaseSource):
    name = "wikidata"

    def fetch(self, qid: str, lang: Optional[str] = None) -> dict[str, Any]:
        url = WIKIDATA_ENTITY.format(qid=qid)
        r = polite_get(self.session, url)
        data = r.json()
        entity = data["entities"][qid]
        return self._parse(entity)

    def _parse(self, entity: dict[str, Any]) -> dict[str, Any]:
        result: dict[str, Any] = {
            "qid": entity["id"],
            "labels": {},
            "descriptions": {},
            "aliases": {},
            "sitelinks": {},
            "claims": {},
        }

        for lang in LANGS:
            if lang in entity.get("labels", {}):
                result["labels"][lang] = entity["labels"][lang]["value"]
            if lang in entity.get("descriptions", {}):
                result["descriptions"][lang] = entity["descriptions"][lang]["value"]
            if lang in entity.get("aliases", {}):
                result["aliases"][lang] = [a["value"] for a in entity["aliases"][lang]]

        for site in SITES:
            if site in entity.get("sitelinks", {}):
                result["sitelinks"][site] = entity["sitelinks"][site]["title"]

        for pid, key in USEFUL_PROPS.items():
            if pid not in entity.get("claims", {}):
                continue
            values = []
            for claim in entity["claims"][pid]:
                val = self._extract_claim_value(claim)
                if val is not None:
                    values.append(val)
            if values:
                result["claims"][key] = values

        return result

    @staticmethod
    def _extract_claim_value(claim: dict[str, Any]) -> Any:
        try:
            mainsnak = claim["mainsnak"]
            if mainsnak["snaktype"] != "value":
                return None
            datavalue = mainsnak["datavalue"]
            dtype = datavalue["type"]
            value = datavalue["value"]
            if dtype == "wikibase-entityid":
                return {"qid": value["id"]}
            if dtype == "time":
                return {"time": value["time"], "precision": value.get("precision")}
            if dtype == "string":
                return value
            if dtype == "monolingualtext":
                return {"text": value["text"], "lang": value["language"]}
            if dtype == "quantity":
                return value.get("amount")
            if dtype == "globecoordinate":
                return {"lat": value.get("latitude"), "lon": value.get("longitude")}
        except (KeyError, TypeError):
            return None
        return None

    def search(
        self,
        query: str,
        lang: str = "en",
        limit: int = 7,
    ) -> list[dict[str, Any]]:
        """Search Wikidata for entities matching a free-text query.

        Returns a list of {qid, label, description, aliases?} dicts so the user
        can pick the right entity before fetching.
        """
        params = {
            "action": "wbsearchentities",
            "search": query,
            "language": lang,
            "uselang": lang,
            "type": "item",
            "limit": limit,
            "format": "json",
        }
        r = polite_get(self.session, WIKIDATA_API, params=params)
        data = r.json()
        results = []
        for item in data.get("search", []):
            results.append({
                "qid": item.get("id"),
                "label": item.get("label"),
                "description": item.get("description"),
                "aliases": item.get("aliases", []),
                "url": item.get("concepturi"),
            })
        return results

    def resolve_labels(
        self,
        qids: list[str],
        langs: tuple[str, ...] = ("zh-tw", "zh-hant", "zh", "zh-hk", "zh-hans", "en"),
    ) -> dict[str, dict[str, str]]:
        """Batch-resolve QIDs → labels. Wikidata accepts up to 50 IDs per request."""
        result: dict[str, dict[str, str]] = {}
        unique = list(dict.fromkeys(qids))
        for start in range(0, len(unique), 50):
            batch = unique[start : start + 50]
            params = {
                "action": "wbgetentities",
                "ids": "|".join(batch),
                "props": "labels",
                "languages": "|".join(langs),
                "format": "json",
            }
            r = polite_get(self.session, WIKIDATA_API, params=params)
            data = r.json()
            for qid, ent in data.get("entities", {}).items():
                labels = {
                    lang: ent["labels"][lang]["value"]
                    for lang in langs
                    if lang in ent.get("labels", {})
                }
                result[qid] = labels
        return result
