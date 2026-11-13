import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'

function LoginPreview() {
  const { user, login, register, logout } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (isRegistering && (username.length < 3 || username.length > 30)) {
      setError('Username must be between 3 and 30 characters.')
      return
    }

    setSubmitting(true)
    try {
      if (isRegistering) {
        await register(email, username, password)
      } else {
        await login(email, password)
      }
      setPassword('')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`login-preview${user ? ' login-preview-authenticated' : ''}`} id="login">
      {user ? (
        <>
          <div>
            <h2>Welcome back, {user.username}.</h2>
            <p>Your watchlist and reviews are ready whenever you are.</p>
          </div>
          <button className="button button-outline" type="button" onClick={logout}>
            Log out
          </button>
        </>
      ) : (
        <>
          <div className="login-preview-copy">
            <h2>{isRegistering ? 'Keep your next favourite close.' : 'Make room for another favourite.'}</h2>
            <p>
              {isRegistering
                ? 'Create an account to save films, build your watchlist, and share your reviews.'
                : 'Sign in to save films, build your watchlist, and keep track of what you want to see next.'}
            </p>
          </div>
          <div className="auth-panel">
            <div className="auth-tabs" role="tablist" aria-label="Account options">
              <button
                className={`genre-chip${!isRegistering ? ' selected' : ''}`}
                type="button"
                role="tab"
                aria-selected={!isRegistering}
                onClick={() => {
                  setIsRegistering(false)
                  setError(null)
                }}
              >
                Log in
              </button>
              <button
                className={`genre-chip${isRegistering ? ' selected' : ''}`}
                type="button"
                role="tab"
                aria-selected={isRegistering}
                onClick={() => {
                  setIsRegistering(true)
                  setError(null)
                }}
              >
                Sign up
              </button>
            </div>
            <form className="auth-form" id="login-form" onSubmit={handleSubmit}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {isRegistering && (
                <label>
                  <span>Username</span>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </label>
              )}
              <label>
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
              </label>
              {error && <p className="feature-error" role="alert">{error}</p>}
              <button
                className="button button-primary auth-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Log in'}
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  )
}

export default LoginPreview
