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
      <div className={className} aria-label="Loading movies">
        {[0, 1, 2, 3].map((item) => (
          ranked ? (
            <article className="ranked-movie" key={item} aria-hidden="true">
              <span className="rank-number">{String(item + 1).padStart(2, '0')}</span>
              <div className="rank-poster" style={{ backgroundColor: '#242424' }}></div>
              <h3>Loading…</h3>
              <p> </p>
            </article>
          ) : (
            <article className="movie-tile" key={item} aria-hidden="true">
              <div className="poster"></div>
              <div className="movie-caption">
                <h3>Loading…</h3>
                <p> </p>
              </div>
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
