import type { CSSProperties } from 'react'
import type { MouseEvent } from 'react'
import type { Movie } from '../types'

type MovieTileProps = {
  movie: Movie
  posterClass: string
  onOpen: (movie: Movie, trigger: HTMLElement) => void
}

function MovieTile({ movie, posterClass, onOpen }: MovieTileProps) {
  const posterStyle: CSSProperties = movie.poster
    ? { backgroundImage: `url("${movie.poster}")` }
    : { backgroundImage: 'none', backgroundColor: '#242424' }
  const rating = movie.rating === null ? null : `★ ${movie.rating.toFixed(1)}`

  return (
    <article className="movie-tile">
      <a
        className={`poster ${posterClass}`}
        href={`#movie-${movie.id}`}
        aria-label={`${movie.title ?? 'Untitled'} poster`}
        style={posterStyle}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault()
          onOpen(movie, event.currentTarget)
        }}
      >
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
