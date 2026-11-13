import type { Movie, WatchlistMovie } from '../types'
import MovieTile from './MovieTile'

type WatchlistSectionProps = {
  movies: WatchlistMovie[]
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
  error: string | null
  onRetry: () => void
}

function WatchlistSection({
  movies,
  onMovieOpen,
  error,
  onRetry,
}: WatchlistSectionProps) {
  return (
    <section className="content-section watchlist-section" id="watchlist">
      <div className="section-heading">
        <h2>Your watchlist</h2>
      </div>
      {error ? (
        <div className="section-error" role="alert">
          <p>{error}</p>
          <button className="button button-outline" type="button" onClick={onRetry}>Retry</button>
        </div>
      ) : movies.length === 0 ? (
        <p className="movie-empty-state">Your watchlist is empty. Add a movie to save it here.</p>
      ) : (
        <div className="poster-row">
          {movies.map((movie) => (
            <MovieTile
              key={movie.id}
              movie={movie}
              loading="lazy"
              onOpen={onMovieOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default WatchlistSection
