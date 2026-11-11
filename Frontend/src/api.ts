import type {
  AccessToken,
  Movie,
  MovieReviews,
  User,
  UserReview,
  WatchlistMovie,
} from './types'

type MovieResponse = {
  movies: Movie[]
}

const API_URL = import.meta.env.VITE_API_URL

function apiUrl(path: string): string {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured.')
  }
  return `${API_URL.replace(/\/$/, '')}${path}`
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (authenticated) {
    const token = localStorage.getItem('absolute-cinema-token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), { ...options, headers })
  } catch {
    throw new Error('Could not connect to the server. Check that the backend is running.')
  }

  if (authenticated && response.status === 401) {
    window.dispatchEvent(new Event('absolute-cinema:unauthorized'))
  }

  if (!response.ok) {
    let message = `The server returned an error (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') {
        message = body.detail
      }
    } catch {
      // Keep the readable status message when the response has no JSON body.
    }
    throw new Error(message)
  }

  let body: T
  try {
    body = (await response.json()) as T
  } catch {
    throw new Error('The server returned an unreadable response.')
  }
  return body
}

async function getMovies(path: string): Promise<Movie[]> {
  const body = await request<MovieResponse>(path)
  if (!body || !Array.isArray(body.movies)) {
    throw new Error('Movie service returned an invalid response.')
  }
  return body.movies
}

export function getTrending(): Promise<Movie[]> {
  return getMovies('/api/movies/trending')
}

export function getTopTen(): Promise<Movie[]> {
  return getMovies('/api/movies/top-ten')
}

export function getRecommended(): Promise<Movie[]> {
  return getMovies('/api/movies/recommended')
}

export function searchMovies(query: string): Promise<Movie[]> {
  return getMovies(`/api/movies/search?query=${encodeURIComponent(query)}`)
}

export function register(
  email: string,
  username: string,
  password: string,
): Promise<User> {
  return request<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  })
}

export function login(email: string, password: string): Promise<AccessToken> {
  return request<AccessToken>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe(): Promise<User> {
  return request<User>('/api/auth/me', {}, true)
}

export function getMovieDetails(imdbId: string): Promise<Movie> {
  return request<Movie>(`/api/movies/${encodeURIComponent(imdbId)}`)
}

export function getMovieReviews(
  imdbId: string,
  limit = 10,
  offset = 0,
): Promise<MovieReviews> {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return request<MovieReviews>(
    `/api/movies/${encodeURIComponent(imdbId)}/reviews?${query}`,
  )
}

export function getMyReviews(): Promise<{ reviews: UserReview[] }> {
  return request<{ reviews: UserReview[] }>('/api/me/reviews', {}, true)
}

export function getWatchlist(): Promise<{ movies: WatchlistMovie[] }> {
  return request<{ movies: WatchlistMovie[] }>('/api/watchlist', {}, true)
}

export function addToWatchlist(imdbId: string): Promise<{ imdb_id: string; added: boolean }> {
  return request(
    `/api/watchlist/${encodeURIComponent(imdbId)}`,
    { method: 'POST' },
    true,
  )
}

export function removeFromWatchlist(
  imdbId: string,
): Promise<{ imdb_id: string; removed: boolean }> {
  return request(
    `/api/watchlist/${encodeURIComponent(imdbId)}`,
    { method: 'DELETE' },
    true,
  )
}

export function saveReview(
  imdbId: string,
  rating: number,
  text: string,
): Promise<void> {
  return request(
    `/api/movies/${encodeURIComponent(imdbId)}/review`,
    { method: 'PUT', body: JSON.stringify({ rating, text: text || null }) },
    true,
  )
}

export function deleteReview(imdbId: string): Promise<void> {
  return request(
    `/api/movies/${encodeURIComponent(imdbId)}/review`,
    { method: 'DELETE' },
    true,
  )
}
