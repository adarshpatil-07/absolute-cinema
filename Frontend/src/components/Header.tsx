import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useAuth } from '../auth/useAuth'

type HeaderProps = {
  onSearch: (query: string) => void
  onClearSearch: () => void
}

function Header({ onSearch, onClearSearch }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { user, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus()
    }
  }, [searchOpen])

  function clearSearch() {
    setQuery('')
    setSearchOpen(false)
    onClearSearch()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      onSearch(trimmedQuery)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      clearSearch()
    }
  }

  return (
    <header className="site-header">
      <a className="logo" href="#home" aria-label="Absolute Cinema home">
        <span className="logo-mark">R</span>Absolute<span>Cinema</span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <a className="nav-link active" href="#home">Home</a>
        <a className="nav-link" href="#trending">Movies</a>
        <a className="nav-link" href="#series">TV Shows</a>
        <a className="nav-link" href="#top-ten">Top 10</a>
        {user && <a className="nav-link" href="#watchlist">Watchlist</a>}
      </nav>

      <div className={`header-actions${searchOpen ? ' search-mode' : ''}`}>
        <form className="header-search-form" onSubmit={handleSubmit} role="search">
          <button
            className="search-icon"
            type={searchOpen ? 'submit' : 'button'}
            aria-label={searchOpen ? 'Submit search' : 'Search'}
            onClick={() => {
              if (!searchOpen) {
                setSearchOpen(true)
              }
            }}
          ></button>
          {searchOpen && (
            <>
              <input
                ref={inputRef}
                className="header-search-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search movies"
                aria-label="Search movies"
              />
              <button
                className="search-clear"
                type="button"
                aria-label="Clear search and show trending"
                onClick={clearSearch}
              >
                ×
              </button>
            </>
          )}
        </form>
        {!authLoading && (user ? (
          <div className="account-actions">
            <span className="account-username">{user.username}</span>
            <button className="login-button account-logout" type="button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <a className="login-button" href="#login">Log in</a>
        ))}
      </div>
    </header>
  )
}

export default Header
