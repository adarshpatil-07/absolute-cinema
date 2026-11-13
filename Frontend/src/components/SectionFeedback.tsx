type SectionFeedbackProps = {
  loading: boolean
  error: string | null
  onRetry: () => void
  className: string
  ranked?: boolean
}

function SectionFeedback({
  loading,
  error,
  onRetry,
  className,
  ranked = false,
}: SectionFeedbackProps) {
  if (loading) {
    return (
      <div className={`${className} loading-row`} role="status" aria-label="Loading movies">
        {[0, 1, 2, 3].map((item) => (
          ranked ? (
            <article className="ranked-movie" key={item} aria-hidden="true">
              <span className="rank-number">{String(item + 1).padStart(2, '0')}</span>
              <div className="rank-poster loading-poster"></div>
              <div className="loading-caption"><span></span><span></span></div>
            </article>
          ) : (
            <article className="movie-tile" key={item} aria-hidden="true">
              <div className="poster loading-poster"></div>
              <div className="loading-caption"><span></span><span></span></div>
            </article>
          )
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-error" role="alert">
        <p>{error}</p>
        <button className="button button-outline" type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  return null
}

export default SectionFeedback
