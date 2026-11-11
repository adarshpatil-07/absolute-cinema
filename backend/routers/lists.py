import asyncio

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import ListItem, MovieList, User
from routers.common import confirm_movie_exists, validate_imdb_id

router = APIRouter(prefix="/api/lists", tags=["lists"])
optional_bearer = HTTPBearer(auto_error=False)


class CreateListRequest(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_public: bool = True


class UpdateListRequest(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_public: bool | None = None


def _owned_list(list_id: int, user: User, session: Session) -> MovieList:
    movie_list = session.get(MovieList, list_id)
    if movie_list is None or movie_list.user_id != user.id:
        raise HTTPException(status_code=404, detail="List not found.")
    return movie_list


@router.post("", response_model=MovieList, status_code=status.HTTP_201_CREATED)
def create_list(
    request: CreateListRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    movie_list = MovieList(user_id=user.id, **request.model_dump())
    session.add(movie_list)
    session.commit()
    session.refresh(movie_list)
    return movie_list


@router.get("")
def get_my_lists(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return {
        "lists": session.exec(
            select(MovieList)
            .where(MovieList.user_id == user.id)
            .order_by(MovieList.created_at.desc())
        ).all()
    }


@router.get("/{list_id}")
async def get_list(
    list_id: int,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    session: Session = Depends(get_session),
):
    movie_list = session.get(MovieList, list_id)
    if movie_list is None:
        raise HTTPException(status_code=404, detail="List not found.")

    if credentials is not None:
        user = get_current_user(credentials, session)
    else:
        user = None

    if not movie_list.is_public and (
        user is None or user.id != movie_list.user_id
    ):
        raise HTTPException(status_code=404, detail="List not found.")

    items = session.exec(
        select(ListItem)
        .where(ListItem.list_id == list_id)
        .order_by(ListItem.added_at.desc())
    ).all()
    async with httpx.AsyncClient(timeout=15.0) as client:
        movies = await asyncio.gather(
            *(confirm_movie_exists(item.imdb_id, client) for item in items)
        )

    return {
        "id": movie_list.id,
        "user_id": movie_list.user_id,
        "name": movie_list.name,
        "description": movie_list.description,
        "is_public": movie_list.is_public,
        "created_at": movie_list.created_at,
        "movies": [
            {**movie, "added_at": item.added_at}
            for item, movie in zip(items, movies)
        ],
    }


@router.patch("/{list_id}", response_model=MovieList)
def update_list(
    list_id: int,
    request: UpdateListRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    movie_list = _owned_list(list_id, user, session)
    changes = request.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is None:
        raise HTTPException(status_code=422, detail="List name cannot be null.")
    for field, value in changes.items():
        setattr(movie_list, field, value)
    session.add(movie_list)
    session.commit()
    session.refresh(movie_list)
    return movie_list


@router.delete("/{list_id}")
def delete_list(
    list_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    movie_list = _owned_list(list_id, user, session)
    for item in session.exec(
        select(ListItem).where(ListItem.list_id == list_id)
    ).all():
        session.delete(item)
    session.delete(movie_list)
    session.commit()
    return {"id": list_id, "deleted": True}


@router.post("/{list_id}/movies/{imdb_id}", status_code=status.HTTP_201_CREATED)
async def add_movie_to_list(
    list_id: int,
    imdb_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    movie_list = _owned_list(list_id, user, session)
    validate_imdb_id(imdb_id)
    existing = session.exec(
        select(ListItem).where(
            ListItem.list_id == movie_list.id,
            ListItem.imdb_id == imdb_id,
        )
    ).first()
    if existing is not None:
        return {"imdb_id": imdb_id, "added": True}

    async with httpx.AsyncClient(timeout=15.0) as client:
        await confirm_movie_exists(imdb_id, client)

    session.add(ListItem(list_id=list_id, imdb_id=imdb_id))
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = session.exec(
            select(ListItem).where(
                ListItem.list_id == list_id,
                ListItem.imdb_id == imdb_id,
            )
        ).first()
        if existing is None:
            raise
    return {"imdb_id": imdb_id, "added": True}


@router.delete("/{list_id}/movies/{imdb_id}")
def remove_movie_from_list(
    list_id: int,
    imdb_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    movie_list = _owned_list(list_id, user, session)
    validate_imdb_id(imdb_id)
    item = session.exec(
        select(ListItem).where(
            ListItem.list_id == movie_list.id,
            ListItem.imdb_id == imdb_id,
        )
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Movie not found in list.")
    session.delete(item)
    session.commit()
    return {"imdb_id": imdb_id, "removed": True}
