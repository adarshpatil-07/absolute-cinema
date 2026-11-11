import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getRecommended,
  getTopTen,
  getTrending,
  getWatchlist,
  searchMovies,
} from './api'
import { useAuth } from './auth/useAuth'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import LoginPreview from './components/LoginPreview'
import MovieDetailModal from './components/MovieDetailModal'
import RecommendationSection from './components/RecommendationSection'
import TopTenSection from './components/TopTenSection'
import TrendingSection from './components/TrendingSection'
import WatchlistSection from './components/WatchlistSection'
import type { Movie } from './types'
import type { WatchlistMovie } from './types'

type MovieRows = {
  trending: Movie[]
  topTen: Movie[]
  recommended: Movie[]
}

async function fetchMovieRows(): Promise<MovieRows> {
  const [trending, topTen, recommended] = await Promise.all([
    getTrending(),
    getTopTen(),
    getRecommended(),
  ])
  return { trending, topTen, recommended }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while loading movies.'
}

function App() {
  const { user } = useAuth()
  const [movieRows, setMovieRows] = useState<MovieRows>({
    trending: [],
    topTen: [],
    recommended: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchRequestId = useRef(0)
  const [watchlistData, setWatchlistData] = useState<{
    userId: number | null
    movies: WatchlistMovie[]
  }>({ userId: null, movies: [] })
  const [watchlistErrorData, setWatchlistErrorData] = useState<{
    userId: number | null
    message: string | null
  }>({ userId: null, message: null })
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  async function loadMovies() {
    setLoading(true)
    setLoadError(null)
    try {
      setMovieRows(await fetchMovieRows())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    void fetchMovieRows()
      .then((rows) => {
        if (active) {
          setMovieRows(rows)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const loadWatchlist = useCallback(async () => {
    if (!user) return
    const userId = user.id
    setWatchlistErrorData({ userId, message: null })
    try {
      const response = await getWatchlist()
      setWatchlistData({ userId, movies: response.movies })
    } catch (error) {
      setWatchlistErrorData({ userId, message: getErrorMessage(error) })
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true
    void getWatchlist()
      .then((response) => {
        if (active) {
          setWatchlistData({ userId: user.id, movies: response.movies })
          setWatchlistErrorData({ userId: user.id, message: null })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setWatchlistErrorData({
            userId: user.id,
            message: getErrorMessage(error),
          })
        }
      })
    return () => {
      active = false
    }
  }, [user])

  async function handleSearch(query: string) {
    const requestId = ++searchRequestId.current
    setSearchQuery(query)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const results = await searchMovies(query)
      if (requestId === searchRequestId.current) {
        setSearchResults(results)
      }
    } catch (error) {
      if (requestId === searchRequestId.current) {
        setSearchError(getErrorMessage(error))
        setSearchResults([])
      }
    } finally {
      if (requestId === searchRequestId.current) {
        setSearchLoading(false)
      }
    }
  }

  function clearSearch() {
    searchRequestId.current += 1
    setSearchQuery(null)
    setSearchResults([])
    setSearchError(null)
    setSearchLoading(false)
  }

  const updateWatchlist = useCallback((movie: Movie, added: boolean) => {
    if (!user) return
    const userId = user.id
    setWatchlistData((currentData) => {
      const current = currentData.userId === userId ? currentData.movies : []
      if (!added) {
        return {
          userId,
          movies: current.filter((item) => item.id !== movie.id),
        }
      }
      if (current.some((item) => item.id === movie.id)) {
        return currentData
      }
      return { userId, movies: [...current, movie] }
    })
  }, [user])

  const openMovie = useCallback((movie: Movie) => {
    setSelectedMovie(movie)
  }, [])

  const closeMovie = useCallback(() => {
    setSelectedMovie(null)
  }, [])

  const allMovies = Array.from(
    new Map(
      [
        ...movieRows.trending,
        ...movieRows.topTen,
        ...movieRows.recommended,
      ].map((movie) => [movie.id, movie]),
    ).values(),
  )

  const showingSearch = searchQuery !== null
  const watchlist = user && watchlistData.userId === user.id
    ? watchlistData.movies
    : []
  const watchlistError = user && watchlistErrorData.userId === user.id
    ? watchlistErrorData.message
    : null

  return (
    <>
      <Header onSearch={handleSearch} onClearSearch={clearSearch} />
      <main>
        <Hero />
        <TrendingSection
          movies={showingSearch ? searchResults : movieRows.trending}
          loading={showingSearch ? searchLoading : loading}
          error={showingSearch ? searchError : loadError}
          searchTitle={showingSearch ? `Results for "${searchQuery}"` : null}
          searchEmpty={showingSearch && !searchLoading && !searchError && searchResults.length === 0}
          onRetry={showingSearch ? () => void handleSearch(searchQuery) : () => void loadMovies()}
          onMovieOpen={openMovie}
        />
        <TopTenSection
          movies={movieRows.topTen}
          loading={loading}
          error={loadError}
          onRetry={() => void loadMovies()}
          onMovieOpen={openMovie}
        />
        <RecommendationSection
          movies={allMovies}
          loading={loading}
          error={loadError}
          onRetry={() => void loadMovies()}
          onMovieOpen={openMovie}
        />
        <LoginPreview />
        {user && (
          <WatchlistSection
            movies={watchlist}
            onMovieOpen={openMovie}
            error={watchlistError}
            onRetry={() => void loadWatchlist()}
          />
        )}
      </main>
      <Footer />
      {selectedMovie && (
        <MovieDetailModal
          key={`${selectedMovie.id}:${user?.id ?? 'guest'}`}
          movie={selectedMovie}
          onClose={closeMovie}
          onWatchlistChange={updateWatchlist}
        />
      )}
    </>
  )
}

export default App
