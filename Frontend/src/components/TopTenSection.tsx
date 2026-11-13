import type { Movie } from '../types'
import SectionFeedback from './SectionFeedback'

type TopTenSectionProps = {
  movies: Movie[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
}

function TopTenSection({
  movies,
  loading,
  error,
  onRetry,
  onMovieOpen,
}: TopTenSectionProps) {
  return (
    <section className="top-ten-section content-section" id="top-ten">
      <div className="top-ten-heading">
        <div>
          <h2>Top 10</h2>
          <p>Films in the current ranking.</p>
        </div>
        <a className="text-link" href="#movies">Browse films</a>
      </div>

      {loading || error ? (
        <SectionFeedback
          className="ranked-row"
          loading={loading}
          error={error}
          onRetry={onRetry}
          ranked
        />
      ) : (
        <div className="ranked-row">
          {movies.map((movie, index) => (
            <article className="ranked-movie" key={movie.id}>
              <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
              <a
                className="rank-poster"
                href={`#movie-${movie.id}`}
                aria-label={`${movie.title ?? 'Untitled'} poster`}
                onClick={(event) => {
                  event.preventDefault()
                  onMovieOpen(movie, event.currentTarget)
                }}
              >
                {movie.poster && (
                  <img
                    src={movie.poster}
                    alt=""
                    width="500"
                    height="688"
                    loading="lazy"
                  />
                )}
              </a>
              <h3>{movie.title ?? 'Untitled'}</h3>
              <p>
                <span>{movie.year ?? 'Year unknown'}</span>
                {movie.rating !== null && <span className="rating-inline">IMDb {movie.rating.toFixed(1)}</span>}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default TopTenSection
