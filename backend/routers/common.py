import re

import httpx
from fastapi import HTTPException

from movie_data import fetch_movie_details

IMDB_ID_PATTERN = re.compile(r"^tt\d+$")


def validate_imdb_id(imdb_id: str) -> None:
    if not IMDB_ID_PATTERN.fullmatch(imdb_id):
        raise HTTPException(
            status_code=422,
            detail="Invalid IMDb ID. Expected an ID matching tt followed by digits.",
        )


async def confirm_movie_exists(imdb_id: str, client: httpx.AsyncClient) -> dict:
    validate_imdb_id(imdb_id)
    return await fetch_movie_details(imdb_id, client)
