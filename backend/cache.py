import time
from typing import Any


class TTLCache:
    def __init__(self) -> None:
        self._entries: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None:
            return None

        expires_at, value = entry
        if time.monotonic() >= expires_at:
            del self._entries[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._entries[key] = (time.monotonic() + ttl_seconds, value)
