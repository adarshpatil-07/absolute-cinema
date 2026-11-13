import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type FocusEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import type { Movie } from '../types'

type HeaderProps = {
  onSearch: (query: string) => void
  onSearchSuggestions: (query: string) => Promise<Movie[]>
  onClearSearch: () => void
}

function Header({ onSearch, onSearchSuggestions, onClearSearch }: HeaderProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsSuppressed, setSuggestionsSuppressed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const requestId = useRef(0)
  const { user, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    const trimmedQuery = query.trim()
    const id = ++requestId.current
    if (suggestionsSuppressed || trimmedQuery.length < 2) return

    const timeout = window.setTimeout(() => {
      setSuggestionsLoading(true)
      setSuggestionError(null)
      void onSearchSuggestions(trimmedQuery)
        .then((movies) => {
          if (requestId.current === id) setSuggestions(movies.slice(0, 5))
        })
        .catch((error: unknown) => {
          if (requestId.current === id) {
            setSuggestions([])
            setSuggestionError(
              error instanceof Error ? error.message : 'Unable to load film suggestions.',
            )
          }
        })
        .finally(() => {
          if (requestId.current === id) setSuggestionsLoading(false)
        })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [onSearchSuggestions, query, suggestionsSuppressed])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      setSuggestionsSuppressed(true)
      setSuggestions([])
      setSuggestionError(null)
      setSuggestionsLoading(false)
      onSearch(trimmedQuery)
    }
  }

  function selectSuggestion(movie: Movie) {
    const title = movie.title ?? query.trim()
    setSuggestionsSuppressed(true)
    setQuery(title)
    setSuggestions([])
    setSuggestionError(null)
    setSuggestionsLoading(false)
    onSearch(title)
  }

  function clearSearch() {
    requestId.current += 1
    setSuggestionsSuppressed(true)
    setQuery('')
    setSuggestions([])
    setSuggestionError(null)
    setSuggestionsLoading(false)
    onClearSearch()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      clearSearch()
    }
  }

  function closeSearchIfOutside(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setSuggestions([])
    }
  }

  return (
    <header className="site-header">
      <div className="header-top">
        <a className="logo" href="#home" aria-label="Absolute Cinema home">
          <span className="logo-mark">A</span>
          <span>Absolute Cinema</span>
        </a>
        <div className="header-search-wrap" onBlur={closeSearchIfOutside}>
          <form className="header-search-form" onSubmit={handleSubmit} role="search">
            <span className="search-symbol" aria-hidden="true"></span>
            <input
              className="header-search-input"
              type="search"
              value={query}
              onChange={(event) => {
                setSuggestionsSuppressed(false)
                setSuggestions([])
                setSuggestionError(null)
                setSuggestionsLoading(false)
                setQuery(event.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search by film title"
              aria-label="Search by film title"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0 || suggestionsLoading || Boolean(suggestionError)}
              aria-controls="film-suggestions"
            />
            {query && (
              <button
                className="search-clear"
                type="button"
                aria-label="Clear search and show trending"
                onClick={clearSearch}
              >
                Clear
              </button>
            )}
          </form>
          {(suggestions.length > 0 || suggestionsLoading || suggestionError) && (
            <div className="search-suggestions" id="film-suggestions">
              <p className="suggestion-heading">Film suggestions</p>
              {suggestionsLoading && <p className="suggestion-status" role="status">Searching…</p>}
              {suggestionError && <p className="suggestion-status" role="alert">{suggestionError}</p>}
              {suggestions.length > 0 && (
                <ul role="listbox">
                  {suggestions.map((movie) => (
                    <li key={movie.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(movie)}
                      >
                        {movie.poster && <img src={movie.poster} alt="" width="40" height="56" />}
                        <span>{movie.title ?? 'Untitled'}</span>
                        {movie.year && <span className="suggestion-year">{movie.year}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="header-account">
          {!authLoading && (user ? (
            <div className="account-actions">
              <span className="account-username">{user.username}</span>
              <button className="account-link" type="button" onClick={logout}>Log out</button>
            </div>
          ) : (
            <a className="account-link" href="#login">Sign in</a>
          ))}
        </div>
        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span></span><span></span>
        </button>
      </div>
      <nav className={`main-nav${menuOpen ? ' menu-open' : ''}`} id="main-navigation" aria-label="Main navigation">
        <a className="nav-link" href="#trending" onClick={() => setMenuOpen(false)}>Movies</a>
        <a className="nav-link" href="#top-ten" onClick={() => setMenuOpen(false)}>Top 10</a>
        <a className="nav-link" href={user ? '#watchlist' : '#login'} onClick={() => setMenuOpen(false)}>Watchlist</a>
        {!authLoading && !user && <a className="nav-link mobile-account-link" href="#login" onClick={() => setMenuOpen(false)}>Sign in or join</a>}
      </nav>
    </header>
  )
}

export default Header
