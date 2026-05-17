from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


USER_AGENT = (
    "DesignHistoryScraper/0.1 "
    "(https://design-history.pages.dev/; contact via project README) "
    "python-requests"
)


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT})
    return s


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
)
def polite_get(session: requests.Session, url: str, **kwargs) -> requests.Response:
    kwargs.setdefault("timeout", 30)
    r = session.get(url, **kwargs)
    r.raise_for_status()
    return r


class BaseSource(ABC):
    name: str = "base"

    def __init__(self) -> None:
        self.session = make_session()

    @abstractmethod
    def fetch(self, identifier: str, lang: Optional[str] = None) -> dict[str, Any]:
        ...
