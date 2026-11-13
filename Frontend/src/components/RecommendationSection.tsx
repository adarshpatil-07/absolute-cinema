import { useRef, useState } from 'react'
import type { Movie } from '../types'
import MovieTile from './MovieTile'
import SectionFeedback from './SectionFeedback'

type RecommendationSectionProps = {
  movies: Movie[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onMovieOpen: (movie: Movie, trigger: HTMLElement) => void
}

function RecommendationSection({
  movies,
  loading,
  error,
  onRetry,
  onMovieOpen,
}: RecommendationSectionProps) {
  const [selectedGenre, setSelectedGenre] = useState('All')
  const rowRef = useRef<HTMLDivElement>(null)
  const genres = Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort()
  function scrollRow(direction: -1 | 1) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rowRef.current?.scrollBy({
      left: direction * 320,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }
  const visibleMovies = selectedGenre === 'All'
    ? movies
    : movies.filter((movie) =>
        movie.genres.some(
          (genre) => genre.toLowerCase() === selectedGenre.toLowerCase(),
        ),
      )

  return (
    <section className="content-section recommendation-section" id="movies">
      <div className="section-heading">
        <h2>Recommended films</h2>
        <div className="section-controls" aria-label="Browse recommended films">
          <button
            className="round-control"
            type="button"
            aria-label="Previous films"
            onClick={() => scrollRow(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            className="round-control"
            type="button"
            aria-label="Next films"
            onClick={() => scrollRow(1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="genre-bar" aria-label="Movie genres">
        {['All', ...genres].map((genre) => (
          <button
            className={`genre-chip${selectedGenre === genre ? ' selected' : ''}`}
            type="button"
            key={genre}
            onClick={() => setSelectedGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading || error ? (
        <SectionFeedback
          className="poster-row compact-row"
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      ) : visibleMovies.length === 0 ? (
        <p className="movie-empty-state">No movies match this genre.</p>
      ) : (
        <div className="poster-row compact-row" ref={rowRef}>
          {visibleMovies.map((movie) => (
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

export default RecommendationSection
