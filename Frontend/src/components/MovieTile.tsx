import type { MouseEvent } from 'react'
import type { Movie } from '../types'

type MovieTileProps = {
  movie: Movie
  loading?: 'eager' | 'lazy'
  onOpen: (movie: Movie, trigger: HTMLElement) => void
}

function MovieTile({ movie, loading = 'eager', onOpen }: MovieTileProps) {
  const rating = movie.rating === null ? null : `IMDb ${movie.rating.toFixed(1)}`

  return (
    <article className="movie-tile">
      <a
        className="poster"
        href={`#movie-${movie.id}`}
        aria-label={`${movie.title ?? 'Untitled'} poster`}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault()
          onOpen(movie, event.currentTarget)
        }}
      >
        {movie.poster && (
          <img
            className="poster-image"
            src={movie.poster}
            alt=""
            width="500"
            height="713"
            loading={loading}
          />
        )}
        <span className="poster-overlay"></span>
        {rating !== null && <span className="poster-rating">{rating}</span>}
      </a>
      <div className="movie-caption">
        <h3>{movie.title ?? 'Untitled'}</h3>
        <p>{movie.year ?? 'Year unknown'}</p>
      </div>
    </article>
  )
}

export default MovieTile
