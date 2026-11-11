from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, UniqueConstraint
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str = Field(repr=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WatchlistItem(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "imdb_id"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    imdb_id: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Review(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("user_id", "imdb_id"),
        CheckConstraint(
            "rating >= 0.5 AND rating <= 5.0 "
            "AND rating * 2 = CAST(rating * 2 AS INTEGER)"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    imdb_id: str = Field(index=True)
    rating: float = Field(ge=0.5, le=5.0)
    text: str | None = Field(default=None, max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MovieList(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_public: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListItem(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("list_id", "imdb_id"),)

    id: int | None = Field(default=None, primary_key=True)
    list_id: int = Field(foreign_key="movielist.id", index=True)
    imdb_id: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
