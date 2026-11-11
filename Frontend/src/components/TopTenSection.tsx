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
  const posterClasses = ['rank-one', 'rank-two', 'rank-three', 'rank-four', 'rank-five']

  return (
    <section className="top-ten-section content-section" id="top-ten">
      <div className="top-ten-heading">
        <h2><span className="outline-number">TOP 10</span></h2>

        <div className="top-ten-copy">
          <p className="section-kicker">THE CROWD HAS SPOKEN</p>
          <h3>Most watched<br />this week</h3>
        </div>

        <a className="text-link top-ten-link" href="#movies">View ranking <span>↗</span></a>
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
                className={`rank-poster ${posterClasses[index % posterClasses.length]}`}
                href={`#movie-${movie.id}`}
                aria-label={`${movie.title ?? 'Untitled'} poster`}
                style={movie.poster
                  ? { backgroundImage: `url("${movie.poster}")` }
                  : { backgroundImage: 'none', backgroundColor: '#242424' }}
                onClick={(event) => {
                  event.preventDefault()
                  onMovieOpen(movie, event.currentTarget)
                }}
              >
                <span>{movie.title ?? 'Untitled'}</span>
              </a>
              <h3>{movie.title ?? 'Untitled'}</h3>
              <p>
                {movie.year ?? 'Year unknown'}
                {movie.rating !== null && ` · ★ ${movie.rating.toFixed(1)}`}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default TopTenSection
