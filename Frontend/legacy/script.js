
"use strict";

const API_URL = "http://127.0.0.1:8000";

// Existing page elements
const movieSections = {
    trending: document.querySelector("#trending .poster-row"),
    topTen: document.querySelector("#top-ten .ranked-row"),
    recommended: document.querySelector("#movies .compact-row")
};

const genreButtons = document.querySelectorAll(".genre-chip");
const searchButton = document.querySelector(".search-icon");

let allMovies = [];
let selectedGenre = "All";

// Connect to the FastAPI backend
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Movie API connection failed:", error);
        return null;
    }
}

// Display movies returned by the backend.
// TMDB integration will supply actual movie data later.
function renderMovies(container, movies) {
    if (!container) return;

    container.replaceChildren();

    if (!movies || movies.length === 0) {
        const message = document.createElement("p");
        message.className = "api-message";
        message.textContent =
            "Movie data will appear here when the movie API is connected.";
        container.appendChild(message);
        return;
    }

    movies.forEach((movie) => {
        const article = document.createElement("article");
        article.className = "movie-tile";

        const poster = document.createElement("div");
        poster.className = "poster";

        if (movie.poster_path) {
            poster.style.backgroundImage =
                `url("https://image.tmdb.org/t/p/w500${movie.poster_path}")`;
            poster.style.backgroundSize = "cover";
            poster.style.backgroundPosition = "center";
        }

        const title = document.createElement("h3");
        title.textContent = movie.title || "Untitled";

        const details = document.createElement("p");
        details.textContent = [
            movie.release_date?.slice(0, 4) || "Year unknown",
            movie.vote_average
                ? `★ ${movie.vote_average.toFixed(1)}`
                : ""
        ].filter(Boolean).join(" · ");

        article.append(poster, title, details);
        container.appendChild(article);
    });
}

// Load trending movies
async function loadTrending() {
    const data = await fetchMovies("/api/movies/trending");

    if (data && Array.isArray(data.movies)) {
        allMovies = data.movies;
        renderMovies(movieSections.trending, allMovies);
        renderMovies(movieSections.recommended, allMovies);
    }
}

// Search movies using the backend
async function searchMovies(query) {
    if (!query.trim()) {
        loadTrending();
        return;
    }

    const data = await fetchMovies(
        `/api/movies/search?query=${encodeURIComponent(query)}`
    );

    if (data && Array.isArray(data.movies)) {
        renderMovies(movieSections.trending, data.movies);
    }
}

// Genre filter UI
genreButtons.forEach((button) => {
    button.addEventListener("click", () => {
        genreButtons.forEach((item) => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedGenre = button.textContent.trim();

        if (selectedGenre === "All") {
            renderMovies(movieSections.recommended, allMovies);
        } else {
            const filtered = allMovies.filter((movie) =>
                (movie.genre_names || []).some(
                    (genre) =>
                        genre.toLowerCase() === selectedGenre.toLowerCase()
                )
            );

            renderMovies(movieSections.recommended, filtered);
        }
    });
});

// Temporary search interaction
if (searchButton) {
    searchButton.addEventListener("click", () => {
        const query = prompt("Which movie are you looking for?");

        if (query !== null) {
            searchMovies(query);
        }
    });
}

// Start the page
async function init() {
    const data = await fetchMovies("/");

    if (data) {
        console.log(data.message);
    }

    await loadTrending();
}

init();
