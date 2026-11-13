import type { Movie, WatchlistMovie } from '../types'
import MovieTile from './MovieTile'

type WatchlistSectionProps = {
  movies: WatchlistMovie[]
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
  error: string | null
  onRetry: () => void
}

const posterClasses = [
  'poster-one',
  'poster-two',
  'poster-three',
  'poster-four',
  'poster-five',
  'poster-six',
]

function WatchlistSection({
  movies,
  onMovieOpen,
  error,
  onRetry,
}: WatchlistSectionProps) {
  return (
    <section className="content-section watchlist-section" id="watchlist">
      <div className="section-heading">
        <div>
          <p className="section-kicker">SAVED FOR YOUR NEXT SESSION</p>
          <h2>Your <span>watchlist</span></h2>
        </div>
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
          {movies.map((movie, index) => (
            <MovieTile
              key={movie.id}
              movie={movie}
              posterClass={posterClasses[index % posterClasses.length]}
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
