function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-backdrop" role="img" aria-label="Featured movie backdrop"></div>
      <div className="hero-shade"></div>

      <div className="hero-content">
        <p className="eyebrow"><span className="eyebrow-line"></span> TONIGHT'S FEATURE</p>
        <p className="studio-label">ABSOLUTE CINEMA PRESENTS</p>

        <h1 id="hero-title">Find your<br /><em>next obsession.</em></h1>

        <div className="hero-meta">
          <span className="rating-badge">★ 8.4</span>
          <span>2024</span>
          <span className="meta-dot"></span>
          <span>Action</span>
          <span className="meta-dot"></span>
          <span>2h 08m</span>
        </div>

        <p className="hero-description">
          One great film can change your whole night. Explore standout stories,
          discover hidden gems, and let your next movie find you.
        </p>

        <div className="hero-actions">
          <a className="button button-red" href="#trending">
            <span className="play-triangle">▶</span> Explore movies
          </a>
          <a className="button button-outline" href="#watchlist">
            <span className="heart">♡</span> My watchlist
          </a>
        </div>

        <p className="hero-note">
          <span className="status-dot"></span> YOUR NEXT MOVIE NIGHT STARTS HERE
        </p>
      </div>

      <div className="hero-side-note">
        <span>01</span>
        <span className="side-rule"></span>
        <span>FEATURED</span>
      </div>

      <div className="hero-pagination">
        <span className="pagination-active"></span>
        <span></span><span></span><span></span>
      </div>
    </section>
  )
}

export default Hero
