import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  addToWatchlist,
  deleteReview,
  getMovieDetails,
  getMovieReviews,
  getMyReviews,
  getWatchlist,
  removeFromWatchlist,
  saveReview,
} from '../api'
import { useAuth } from '../auth/useAuth'
import type { Movie, MovieReviews, Review } from '../types'

const REVIEW_PAGE_SIZE = 10

type MovieDetailModalProps = {
  movie: Movie
  onClose: () => void
  onWatchlistChange: (movie: Movie, added: boolean) => void
}

function dateLabel(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange?: (rating: number) => void
  label: string
}) {
  if (!onChange) {
    return (
      <span className="feature-stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {'★'.repeat(Math.floor(value))}
        {value % 1 !== 0 && <span className="feature-star-half">★</span>}
        {'☆'.repeat(5 - Math.ceil(value))}
      </span>
    )
  }

  return (
    <div className="star-input" role="group" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1
        const halfRating = star - 0.5
        const state = value >= star ? 'full' : value >= halfRating ? 'half' : ''
        return (
          <span className={`star-cell ${state}`} key={star}>
            <button
              className="star-step half"
              type="button"
              aria-label={`${halfRating} stars`}
              aria-pressed={value === halfRating}
              onClick={() => onChange(halfRating)}
            >★</button>
            <button
              className="star-step full"
              type="button"
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
              aria-pressed={value === star}
              onClick={() => onChange(star)}
            >★</button>
          </span>
        )
      })}
      <span className="star-value">{value.toFixed(1)}</span>
    </div>
  )
}

function MovieDetailModal({
  movie,
  onClose,
  onWatchlistChange,
}: MovieDetailModalProps) {
  const { user } = useAuth()
  const [details, setDetails] = useState<Movie | null>(null)
  const [movieReviews, setMovieReviews] = useState<MovieReviews | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewOffset, setReviewOffset] = useState(0)
  const [watchlisted, setWatchlisted] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [myText, setMyText] = useState('')
  const [hasReview, setHasReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    closeButton.current?.focus()
    return () => {
      returnFocus.current?.focus()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
      if (event.key === 'Tab' && contentRef.current) {
        const focusable = Array.from(
          contentRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]',
          ),
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    let active = true
    const publicRequests = Promise.all([
      getMovieDetails(movie.id),
      getMovieReviews(movie.id, REVIEW_PAGE_SIZE, 0),
    ])
    void publicRequests
      .then(([movieDetails, movieReviewResponse]) => {
        if (!active) return
        setDetails(movieDetails)
        setMovieReviews(movieReviewResponse)
        setReviews(movieReviewResponse.reviews)
        setReviewOffset(movieReviewResponse.reviews.length)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load this movie.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [movie.id])

  useEffect(() => {
    let active = true
    if (user) {
      void Promise.allSettled([getWatchlist(), getMyReviews()]).then((results) => {
        if (!active) return
        const [watchlistResult, myReviewsResult] = results
        if (watchlistResult.status === 'fulfilled') {
          setWatchlisted(
            watchlistResult.value.movies.some((item) => item.id === movie.id),
          )
        } else {
          setActionError(watchlistResult.reason instanceof Error
            ? watchlistResult.reason.message
            : 'Unable to load your watchlist.')
        }
        if (myReviewsResult.status === 'fulfilled') {
          const ownReview = myReviewsResult.value.reviews.find(
            (item) => item.imdb_id === movie.id,
          )
          if (ownReview) {
            setHasReview(true)
            setMyRating(ownReview.rating)
            setMyText(ownReview.text ?? '')
          }
        } else {
          setActionError(myReviewsResult.reason instanceof Error
            ? myReviewsResult.reason.message
            : 'Unable to load your review.')
        }
      })
    }

    return () => {
      active = false
    }
  }, [movie.id, user])

  async function toggleWatchlist() {
    setActionError(null)
    try {
      if (watchlisted) {
        await removeFromWatchlist(movie.id)
        setWatchlisted(false)
        onWatchlistChange(details ?? movie, false)
      } else {
        await addToWatchlist(movie.id)
        setWatchlisted(true)
        onWatchlistChange(details ?? movie, true)
      }
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to update your watchlist.')
    }
  }

  async function handleSaveReview() {
    if (myRating < 0.5) {
      setActionError('Choose a rating before saving your review.')
      return
    }
    setSaving(true)
    setActionError(null)
    try {
      await saveReview(movie.id, myRating, myText)
      setHasReview(true)
      const updatedReviews = await getMovieReviews(movie.id, REVIEW_PAGE_SIZE, 0)
      setMovieReviews(updatedReviews)
      setReviews(updatedReviews.reviews)
      setReviewOffset(updatedReviews.reviews.length)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to save your review.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReview() {
    setSaving(true)
    setActionError(null)
    try {
      await deleteReview(movie.id)
      setHasReview(false)
      setMyRating(0)
      setMyText('')
      const updatedReviews = await getMovieReviews(movie.id, REVIEW_PAGE_SIZE, 0)
      setMovieReviews(updatedReviews)
      setReviews(updatedReviews.reviews)
      setReviewOffset(updatedReviews.reviews.length)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to delete your review.')
    } finally {
      setSaving(false)
    }
  }

  async function loadMoreReviews() {
    setSaving(true)
    setActionError(null)
    try {
      const next = await getMovieReviews(movie.id, REVIEW_PAGE_SIZE, reviewOffset)
      setReviews((current) => [...current, ...next.reviews])
      setReviewOffset((current) => current + next.reviews.length)
      setMovieReviews(next)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to load more reviews.')
    } finally {
      setSaving(false)
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function goToLogin() {
    onClose()
    window.setTimeout(() => {
      document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })
      document.querySelector<HTMLInputElement>('#login-form input')?.focus()
    }, 0)
  }

  const otherReviews = reviews.filter((review) => review.username !== user?.username)
  const canLoadMore = movieReviews !== null && reviewOffset < movieReviews.count
  const shownMovie = details ?? movie

  return (
    <div className="feature-modal-backdrop" onMouseDown={handleBackdropClick}>
      <section
        className="feature-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        ref={contentRef}
      >
        <button
          className="feature-modal-close"
          type="button"
          aria-label="Close movie details"
          onClick={onClose}
          ref={closeButton}
        >
          ×
        </button>

        {loading ? (
          <p className="feature-loading" role="status">Loading movie details…</p>
        ) : error ? (
          <p className="feature-error" role="alert">{error}</p>
        ) : (
          <>
            <div className="feature-detail">
              <div className="feature-detail-poster">
                {shownMovie.poster
                  ? <img src={shownMovie.poster} alt={`${shownMovie.title ?? 'Movie'} poster`} />
                  : <div className="feature-poster-fallback" aria-label="Poster unavailable"></div>}
              </div>
              <div className="feature-detail-copy">
                <p className="section-kicker">MOVIE DETAILS</p>
                <h2 id="movie-detail-title">{shownMovie.title ?? 'Untitled'}</h2>
                <p className="feature-meta">
                  {[shownMovie.year, shownMovie.runtime, shownMovie.genres.join(' · ')].filter(Boolean).join(' · ')}
                </p>
                {shownMovie.director && <p><strong>Director</strong> {shownMovie.director}</p>}
                {shownMovie.actors && <p><strong>Cast</strong> {shownMovie.actors}</p>}
                <p className="feature-plot">{shownMovie.overview ?? 'No plot summary available.'}</p>
                <div className="feature-average-rating">
                  <StarRating
                    value={movieReviews?.average_rating ?? 0}
                    label="Average rating"
                  />
                  <span>
                    {movieReviews?.average_rating === null || movieReviews?.average_rating === undefined
                      ? 'No ratings yet'
                      : `${movieReviews.average_rating.toFixed(1)} average`}
                    {' · '}{movieReviews?.count ?? 0} reviews
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              <>
                <div className="feature-account-actions">
                  <button className="button button-outline" type="button" onClick={() => void toggleWatchlist()}>
                    {watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                  </button>
                </div>
                <div className="feature-review-form">
                  <h3>Your rating &amp; review</h3>
                  <StarRating value={myRating} onChange={setMyRating} label="Your rating" />
                  <label className="feature-review-label" htmlFor="movie-review-text">Review (optional)</label>
                  <textarea
                    id="movie-review-text"
                    value={myText}
                    maxLength={2000}
                    onChange={(event) => setMyText(event.target.value)}
                    rows={3}
                  />
                  <div className="feature-review-actions">
                    <span>{myText.length}/2000</span>
                    <button className="button button-red" type="button" onClick={() => void handleSaveReview()} disabled={saving}>
                      {saving ? 'Saving…' : 'Save review'}
                    </button>
                    {hasReview && (
                      <button className="button button-outline" type="button" onClick={() => void handleDeleteReview()} disabled={saving}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="feature-signin-prompt">
                <p>Sign in to rate or save this movie.</p>
                <button className="button button-red" type="button" onClick={goToLogin}>Sign in to rate or save</button>
              </div>
            )}

            {actionError && <p className="feature-error" role="alert">{actionError}</p>}

            <div className="feature-reviews">
              <h3>Community reviews</h3>
              {otherReviews.length === 0 ? (
                <p className="movie-empty-state">No other reviews yet.</p>
              ) : (
                <div className="feature-review-list">
                  {otherReviews.map((review, index) => (
                    <article className="feature-review-card" key={`${review.username}-${review.date}-${index}`}>
                      <div className="feature-review-heading">
                        <strong>{review.username}</strong>
                        <StarRating value={review.rating} label={`${review.username}'s rating`} />
                        <time dateTime={review.date}>{dateLabel(review.date)}</time>
                      </div>
                      {review.text && <p>{review.text}</p>}
                    </article>
                  ))}
                </div>
              )}
              {canLoadMore && (
                <button
                  className="button button-outline feature-load-more"
                  type="button"
                  onClick={() => void loadMoreReviews()}
                  disabled={saving}
                >
                  Load more
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default MovieDetailModal
