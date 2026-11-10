import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import (
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMAGE_BASE_URL,
)

app = FastAPI(title="Absolute Cinema API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def tmdb_request(endpoint: str, params: dict | None = None):
    if not TMDB_API_KEY or TMDB_API_KEY == "your_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="TMDB API key is not configured yet.",
        )

    headers = {
        "Authorization": f"Bearer {TMDB_API_KEY}",
        "accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(
                f"{TMDB_BASE_URL}{endpoint}",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"TMDB returned HTTP {exc.response.status_code}.",
            ) from exc

        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail="Could not connect to TMDB. Check your internet connection.",
            ) from exc


def format_movie(movie: dict) -> dict:
    return {
        "id": movie.get("id"),
        "title": movie.get("title"),
        "overview": movie.get("overview"),
        "release_date": movie.get("release_date"),
        "rating": movie.get("vote_average"),
        "poster_path": (
            f"{TMDB_IMAGE_BASE_URL}{movie['poster_path']}"
            if movie.get("poster_path")
            else None
        ),
        "backdrop_path": (
            f"https://image.tmdb.org/t/p/w1280{movie['backdrop_path']}"
            if movie.get("backdrop_path")
            else None
        ),
        "genre_ids": movie.get("genre_ids", []),
    }


@app.get("/")
def home():
    return {"message": "Absolute Cinema API is running!"}


@app.get("/api/movies/trending")
async def trending_movies():
    data = await tmdb_request("/trending/movie/week")

    return {
        "movies": [format_movie(movie) for movie in data.get("results", [])]
    }


@app.get("/api/movies/search")
async def search_movies(query: str = ""):
    query = query.strip()

    if not query:
        return {"query": query, "movies": []}

    data = await tmdb_request(
        "/search/movie",
        params={"query": query, "include_adult": "false"},
    )

    return {
        "query": query,
        "movies": [format_movie(movie) for movie in data.get("results", [])],
    }


@app.get("/api/movies/genres")
async def movie_genres():
    data = await tmdb_request("/genre/movie/list")

    return {"genres": data.get("genres", [])}


@app.get("/api/movies/{movie_id}")
async def movie_details(movie_id: int):
    movie = await tmdb_request(f"/movie/{movie_id}")

    return {
        **format_movie(movie),
        "genres": movie.get("genres", []),
        "runtime": movie.get("runtime"),
        "tagline": movie.get("tagline"),
        "status": movie.get("status"),
    }
