import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from curated import RECOMMENDED, TOP_TEN, TRENDING
from db import create_db_and_tables
from movie_data import cache, fetch_movie_details, format_movie, omdb_request
from routers.auth import router as auth_router
from routers.lists import router as lists_router
from routers.reviews import router as reviews_router
from routers.watchlist import router as watchlist_router

SEARCH_CACHE_TTL = 60 * 60


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Absolute Cinema API", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(watchlist_router)
app.include_router(reviews_router)
app.include_router(lists_router)


@app.exception_handler(RequestValidationError)
async def sanitize_validation_errors(
    request: Request,
    exc: RequestValidationError,
):
    errors = [
        {key: value for key, value in error.items() if key != "input"}
        for error in exc.errors()
    ]
    sanitized_error = RequestValidationError(errors)
    return await request_validation_exception_handler(request, sanitized_error)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def curated_movies(imdb_ids: list[str]) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        movies = await asyncio.gather(
            *(fetch_movie_details(imdb_id, client) for imdb_id in imdb_ids)
        )
    return {"movies": movies}


@app.get("/")
def home():
    return {"message": "Absolute Cinema API is running!"}


@app.get("/api/movies/trending")
async def trending_movies():
    return await curated_movies(TRENDING)


@app.get("/api/movies/top-ten")
async def top_ten_movies():
    return await curated_movies(TOP_TEN)


@app.get("/api/movies/recommended")
async def recommended_movies():
    return await curated_movies(RECOMMENDED)


@app.get("/api/movies/search")
async def search_movies(query: str = ""):
    query = query.strip()
    if not query:
        return {"query": query, "movies": []}

    cache_key = f"search:{query.casefold()}"
    movies = cache.get(cache_key)
    if movies is None:
        async with httpx.AsyncClient(timeout=15.0) as client:
            data = await omdb_request(client, s=query)
        movies = [
            format_movie(movie, search_result=True)
            for movie in data.get("Search", [])
        ]
        cache.set(cache_key, movies, SEARCH_CACHE_TTL)

    return {"query": query, "movies": movies}


@app.get("/api/movies/{imdb_id}")
async def movie_details(imdb_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        return await fetch_movie_details(imdb_id, client)
