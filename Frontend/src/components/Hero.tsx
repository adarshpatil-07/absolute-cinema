import type { MouseEvent } from 'react'
import type { Movie } from '../types'

type HeroProps = {
  movie: Movie | null
  signedIn: boolean
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
}

function Hero({ movie, signedIn, onMovieOpen }: HeroProps) {
  const description = movie?.overview
    ?? 'Find a film, save it for later, and share your thoughts.'

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    if (movie) onMovieOpen(movie, event.currentTarget)
  }

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      {movie?.poster && (
        <div className="hero-visual" aria-hidden="true">
          <img
            className="hero-backdrop-image"
            src={movie.poster}
            alt=""
            width="700"
            height="900"
            fetchPriority="high"
          />
        </div>
      )}
      <div className="hero-content">
        <div className="hero-copy">
          <h1 id="hero-title">{movie?.title ?? 'Find your next film.'}</h1>
          <p className="hero-description">{description}</p>
          <div className="hero-meta" aria-label="Film details">
            {movie?.year && <span>{movie.year}</span>}
            {movie?.runtime && <span>{movie.runtime}</span>}
            {movie?.genres.length ? <span>{movie.genres.slice(0, 3).join(', ')}</span> : null}
            {movie?.rating !== null && movie?.rating !== undefined && (
              <span className="hero-rating">IMDb {movie.rating.toFixed(1)}/10</span>
            )}
          </div>
          <div className="hero-actions">
            {movie ? (
              <button className="button button-primary" type="button" onClick={handleOpen}>
                View film
              </button>
            ) : (
              <a className="button button-primary" href="#trending">Browse films</a>
            )}
            <a className="button button-outline" href={signedIn ? '#watchlist' : '#login'}>
              {signedIn ? 'My watchlist' : 'Join the community'}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
