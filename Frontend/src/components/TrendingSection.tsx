import MovieTile from './MovieTile'
import SectionFeedback from './SectionFeedback'
import type { Movie } from '../types'

type TrendingSectionProps = {
  movies: Movie[]
  loading: boolean
  error: string | null
  searchTitle: string | null
  searchEmpty: boolean
  onRetry: () => void
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
}

function TrendingSection({
  movies,
  loading,
  error,
  searchTitle,
  searchEmpty,
  onRetry,
  onMovieOpen,
}: TrendingSectionProps) {
  return (
    <section className="content-section continue-section" id="trending">
      <div className="section-heading">
        <h2>{searchTitle ?? 'Up next'}</h2>
        {!searchTitle && <a className="text-link" href="#top-ten">Top 10</a>}
      </div>

      {loading || error ? (
        <SectionFeedback
          className="poster-row"
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      ) : searchEmpty ? (
        <p className="movie-empty-state">No films found for this search.</p>
      ) : (
        <div className="poster-row">
          {movies.map((movie) => (
            <MovieTile
              key={movie.id}
              movie={movie}
              onOpen={onMovieOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default TrendingSection
