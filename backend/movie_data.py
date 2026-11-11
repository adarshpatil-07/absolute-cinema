import httpx
from fastapi import HTTPException

from cache import TTLCache
from config import OMDB_API_KEY

OMDB_URL = "https://www.omdbapi.com/"
DETAILS_CACHE_TTL = 24 * 60 * 60
cache = TTLCache()


async def omdb_request(client: httpx.AsyncClient, **params: str) -> dict:
    if not OMDB_API_KEY or OMDB_API_KEY == "your_omdb_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="OMDb API key is not configured. Set OMDB_API_KEY in .env.",
        )

    try:
        response = await client.get(
            OMDB_URL,
            params={"apikey": OMDB_API_KEY, **params},
        )
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OMDb returned HTTP {exc.response.status_code}.",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to OMDb.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="OMDb returned an invalid response.",
        ) from exc

    if data.get("Response") == "False":
        error = data.get("Error", "Unknown OMDb error.")
        lowered_error = error.lower()
        if "invalid api key" in lowered_error:
            raise HTTPException(
                status_code=503,
                detail="OMDb rejected the API key. Check OMDB_API_KEY in .env.",
            )
        if "limit" in lowered_error and ("daily" in lowered_error or "reached" in lowered_error):
            raise HTTPException(
                status_code=429,
                detail="OMDb daily request limit reached. Try again tomorrow.",
            )
        if "not found" in lowered_error:
            raise HTTPException(status_code=404, detail="Movie not found.")
        raise HTTPException(status_code=502, detail=f"OMDb error: {error}")

    return data


def _value(value: str | None) -> str | None:
    return None if not value or value == "N/A" else value


def format_movie(movie: dict, *, search_result: bool = False) -> dict:
    rating_value = _value(movie.get("imdbRating"))
    try:
        rating = float(rating_value) if rating_value is not None else None
    except ValueError:
        rating = None

    genres = [] if search_result else [
        genre.strip()
        for genre in (movie.get("Genre") or "").split(",")
        if genre.strip() and genre.strip() != "N/A"
    ]

    return {
        "id": movie.get("imdbID"),
        "title": _value(movie.get("Title")),
        "year": _value(movie.get("Year")),
        "overview": None if search_result else _value(movie.get("Plot")),
        "poster": _value(movie.get("Poster")),
        "rating": rating,
        "genres": genres,
        "runtime": None if search_result else _value(movie.get("Runtime")),
        "director": None if search_result else _value(movie.get("Director")),
        "actors": None if search_result else _value(movie.get("Actors")),
    }


async def fetch_movie_details(imdb_id: str, client: httpx.AsyncClient) -> dict:
    cache_key = f"details:{imdb_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    movie = await omdb_request(client, i=imdb_id)
    result = format_movie(movie)
    cache.set(cache_key, result, DETAILS_CACHE_TTL)
    return result
