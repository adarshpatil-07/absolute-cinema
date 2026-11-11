import asyncio

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import User, WatchlistItem
from routers.common import confirm_movie_exists, validate_imdb_id

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("")
async def get_watchlist(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    items = session.exec(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.added_at.desc())
    ).all()
    async with httpx.AsyncClient(timeout=15.0) as client:
        movies = await asyncio.gather(
            *(confirm_movie_exists(item.imdb_id, client) for item in items)
        )
    return {
        "movies": [
            {**movie, "added_at": item.added_at}
            for item, movie in zip(items, movies)
        ]
    }


@router.post("/{imdb_id}", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    imdb_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    validate_imdb_id(imdb_id)
    existing = session.exec(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user.id,
            WatchlistItem.imdb_id == imdb_id,
        )
    ).first()
    if existing is not None:
        return {"imdb_id": imdb_id, "added": True}

    async with httpx.AsyncClient(timeout=15.0) as client:
        await confirm_movie_exists(imdb_id, client)

    item = WatchlistItem(user_id=user.id, imdb_id=imdb_id)
    session.add(item)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = session.exec(
            select(WatchlistItem).where(
                WatchlistItem.user_id == user.id,
                WatchlistItem.imdb_id == imdb_id,
            )
        ).first()
        if existing is None:
            raise
    return {"imdb_id": imdb_id, "added": True}


@router.delete("/{imdb_id}")
def remove_from_watchlist(
    imdb_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    validate_imdb_id(imdb_id)
    item = session.exec(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user.id,
            WatchlistItem.imdb_id == imdb_id,
        )
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Watchlist item not found.")
    session.delete(item)
    session.commit()
    return {"imdb_id": imdb_id, "removed": True}
