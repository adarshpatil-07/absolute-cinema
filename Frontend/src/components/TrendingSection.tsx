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
  const posterClasses = [
    'poster-one',
    'poster-two',
    'poster-three',
    'poster-four',
    'poster-five',
    'poster-six',
  ]

  return (
    <section className="content-section continue-section" id="trending">
      <div className="section-heading">
        <div>
          <p className="section-kicker">PICK UP WHERE YOU LEFT OFF</p>
          <h2>{searchTitle ?? <>Trending <span>now</span></>}</h2>
        </div>
        <a className="text-link" href="#movies">Explore all <span>↗</span></a>
      </div>

      {loading || error ? (
        <SectionFeedback
          className="poster-row"
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      ) : searchEmpty ? (
        <p className="movie-empty-state">No movies found.</p>
      ) : (
        <div className="poster-row">
          {movies.map((movie, index) => (
            <MovieTile
              key={movie.id}
              movie={movie}
              posterClass={posterClasses[index % posterClasses.length]}
              onOpen={onMovieOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default TrendingSection
