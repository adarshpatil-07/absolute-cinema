import asyncio
import math
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import Review, User
from routers.common import confirm_movie_exists, validate_imdb_id

router = APIRouter(tags=["reviews"])


class ReviewRequest(BaseModel):
    rating: float = Field(ge=0.5, le=5.0)
    text: str | None = Field(default=None, max_length=2000)

    @field_validator("rating")
    @classmethod
    def rating_uses_half_steps(cls, value: float) -> float:
        if not math.isclose(value * 2, round(value * 2), abs_tol=1e-8):
            raise ValueError("Rating must use 0.5-point steps.")
        return value


@router.put("/api/movies/{imdb_id}/review")
async def upsert_review(
    imdb_id: str,
    request: ReviewRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    validate_imdb_id(imdb_id)
    review = session.exec(
        select(Review).where(
            Review.user_id == user.id,
            Review.imdb_id == imdb_id,
        )
    ).first()
    if review is None:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await confirm_movie_exists(imdb_id, client)
        review = Review(
            user_id=user.id,
            imdb_id=imdb_id,
            rating=request.rating,
            text=request.text,
        )
        session.add(review)
    else:
        review.rating = request.rating
        review.text = request.text
        review.updated_at = datetime.now(timezone.utc)

    try:
        session.commit()
        session.refresh(review)
    except IntegrityError:
        session.rollback()
        review = session.exec(
            select(Review).where(
                Review.user_id == user.id,
                Review.imdb_id == imdb_id,
            )
        ).first()
        if review is None:
            raise
        review.rating = request.rating
        review.text = request.text
        review.updated_at = datetime.now(timezone.utc)
        session.add(review)
        session.commit()
        session.refresh(review)
    return review


@router.delete("/api/movies/{imdb_id}/review")
def delete_review(
    imdb_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    validate_imdb_id(imdb_id)
    review = session.exec(
        select(Review).where(
            Review.user_id == user.id,
            Review.imdb_id == imdb_id,
        )
    ).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    session.delete(review)
    session.commit()
    return {"imdb_id": imdb_id, "deleted": True}


@router.get("/api/movies/{imdb_id}/reviews")
def get_movie_reviews(
    imdb_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    validate_imdb_id(imdb_id)
    rows = session.exec(
        select(Review, User.username)
        .join(User, User.id == Review.user_id)
        .where(Review.imdb_id == imdb_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    average_rating, count = session.exec(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.imdb_id == imdb_id
        )
    ).one()
    return {
        "reviews": [
            {
                "username": username,
                "rating": review.rating,
                "text": review.text,
                "date": review.created_at,
            }
            for review, username in rows
        ],
        "average_rating": float(average_rating) if average_rating is not None else None,
        "count": count,
    }


@router.get("/api/me/reviews")
async def get_my_reviews(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    reviews = session.exec(
        select(Review)
        .where(Review.user_id == user.id)
        .order_by(Review.created_at.desc())
    ).all()
    async with httpx.AsyncClient(timeout=15.0) as client:
        movies = await asyncio.gather(
            *(confirm_movie_exists(review.imdb_id, client) for review in reviews)
        )
    return {
        "reviews": [
            {
                "imdb_id": review.imdb_id,
                "rating": review.rating,
                "text": review.text,
                "date": review.created_at,
                "updated_at": review.updated_at,
                "movie": movie,
            }
            for review, movie in zip(reviews, movies)
        ]
    }
