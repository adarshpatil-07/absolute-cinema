import { useState } from 'react'
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

const genres = ['All', 'Thriller', 'Sci-Fi', 'Drama', 'Comedy', 'Mind-bending']
const posterClasses = [
  'poster-seven',
  'poster-eight',
  'poster-nine',
  'poster-ten',
  'poster-eleven',
  'poster-twelve',
]

function RecommendationSection({
  movies,
  loading,
  error,
  onRetry,
  onMovieOpen,
}: RecommendationSectionProps) {
  const [selectedGenre, setSelectedGenre] = useState('All')
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
        <div>
          <p className="section-kicker">HAND-PICKED FOR YOUR NEXT SESSION</p>
          <h2>Recommended <span>for you</span></h2>
        </div>

        <div className="section-controls">
          <button className="round-control" type="button" aria-label="Previous movies">←</button>
          <button className="round-control" type="button" aria-label="Next movies">→</button>
        </div>
      </div>

      <div className="genre-bar" aria-label="Movie genres">
        {genres.map((genre) => (
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
        <div className="poster-row compact-row">
          {visibleMovies.map((movie, index) => (
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

export default RecommendationSection
