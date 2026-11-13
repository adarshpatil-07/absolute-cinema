# 🎬 Absolute Cinema

**Every film has a story. So does your watchlist.**

Absolute Cinema is a full-stack movie discovery and tracking platform inspired by Letterboxd. Browse curated movie rows, search any film, rate and review what you've watched, and keep a personal watchlist.

🔗 **Live : https://absolute-cinema-coral.vercel.app

<img width="1356" height="651" alt="image" src="https://github.com/user-attachments/assets/dfb031bc-f8fd-4c92-a5b4-3b31db59c995" />


## ✨ Features

- **Discover:** Trending, Top 10 and Recommended rows with posters, years and ratings
- **Search:** Find any movie by title
- **Genre filters:** Filter the Recommended row with genre chips
- **Movie details:** Poster, plot, runtime, genres, director and cast in a modal view
- **Accounts:** Register and log in securely with JWT authentication and hashed passwords
- **Watchlist:** Save and remove movies, synced to your account
- **Ratings and reviews:** Half-star ratings (0.5 to 5) with optional written reviews, plus the site's average rating and other users' reviews
- **Custom lists:** Create, edit and share movie lists (backend API complete, UI coming soon)
- **Fast by design:** Responses are cached and served from a CDN, and the frontend ships as a static build

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, custom CSS |
| Backend | Python, FastAPI, SQLModel, httpx |
| Auth | JWT (PyJWT), Argon2 password hashing |
| Database | PostgreSQL (Neon) in production, SQLite locally |
| Movie data | [OMDb API](https://www.omdbapi.com/) |
| Hosting | Cloudflare Pages (frontend), Vercel (backend, Singapore region), Neon (database, Singapore region) |

## 🏗️ Architecture

```
Browser ──► Cloudflare Pages (React + TypeScript static build)
               │
               ▼
        Vercel (FastAPI, serverless) ──► OMDb API (movie data)
               │
               ▼
        Neon PostgreSQL (users, watchlists, reviews, lists)
```

- OMDb has no "trending" endpoint, so the home page rows come from hand-picked IMDb ID lists.
- The database stores only IMDb IDs and user data, never copies of movie data or images.
- Movie endpoints send `Cache-Control` headers so the CDN caches them, which keeps the app fast and well within OMDb's free request limit. User-specific endpoints are never cached.

## 📡 API Overview

| Area | Endpoints |
| --- | --- |
| Movies | `GET /api/movies/trending`, `/top-ten`, `/recommended`, `/search?query=`, `/{imdb_id}` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Watchlist | `GET /api/watchlist`, `POST` and `DELETE /api/watchlist/{imdb_id}` |
| Reviews | `PUT` and `DELETE /api/movies/{imdb_id}/review`, `GET /api/movies/{imdb_id}/reviews`, `GET /api/me/reviews` |
| Lists | `POST /api/lists`, `GET /api/lists`, `GET`, `PATCH` and `DELETE /api/lists/{id}`, `POST` and `DELETE /api/lists/{id}/movies/{imdb_id}` |
| Health | `GET /health` |

Interactive docs are available at `/docs` when the backend is running.

## 🚀 Run Locally

**Prerequisites:** Python 3.11+, Node.js 20+, and a free [OMDb API key](https://www.omdbapi.com/apikey.aspx).

### 1. Clone

```bash
git clone https://github.com/adarshpatil-07/absolute-cinema.git
cd absolute-cinema
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```
OMDB_API_KEY=your_omdb_key
SECRET_KEY=a_long_random_string
DATABASE_URL=sqlite:///./app.db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a secret key with `python -c "import secrets; print(secrets.token_hex(32))"`, then start the server:

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Tables are created automatically for SQLite.

### 3. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```
VITE_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open `http://localhost:5173`.

## 📁 Project Structure

```
absolute-cinema/
├── backend/
│   ├── main.py            # App setup, CORS, movie endpoints
│   ├── config.py          # Environment configuration
│   ├── models.py          # SQLModel tables
│   ├── auth.py            # Password hashing and JWT
│   ├── cache.py           # In-memory TTL cache
│   ├── curated.py         # Curated IMDb ID lists for the home rows
│   ├── create_tables.py   # One-time table creation for Postgres
│   └── routers/           # Auth, watchlist, reviews, lists
└── Frontend/
    └── src/
        ├── components/    # Header, Hero, movie rows, modal, login, footer
        ├── auth/          # Auth context
        ├── api.ts         # Typed API client
        └── styles/        # Stylesheets
```

## 🔮 Roadmap

- [ ] Custom lists UI
- [ ] Movie recommendations with a content-based ML model (scikit-learn, TF-IDF similarity)
- [ ] User profile pages
- [ ] Custom domain

## 🙏 Acknowledgements

Movie data provided by the [OMDb API](https://www.omdbapi.com/). This project is not affiliated with or endorsed by Letterboxd or IMDb.

## 👤 Author

**Adarsh Patil**
[GitHub](https://github.com/adarshpatil-07) · [LinkedIn](https://linkedin.com/in/adarshpatil07)
