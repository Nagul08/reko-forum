import { useState } from 'react'
import { supabase } from '../lib/supabase'

const USERNAME_EMAIL_DOMAIN = 'reko.local'

function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

function toSyntheticEmail(username) {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`
}

export default function Auth({ onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePasswordAuth() {
    const cleanUsername = normalizeUsername(username)
    if (!cleanUsername || !password.trim()) {
      setMessage('Username and password are required.')
      return
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setMessage('Username must be 3-20 chars using a-z, 0-9, or _.')
      return
    }

    setLoading(true)
    setMessage('')

    const email = toSyntheticEmail(cleanUsername)

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password })

    setMessage(error ? error.message : isSignUp ? 'Account created. You can sign in now.' : 'Signed in successfully.')
    setLoading(false)

    if (!error && !isSignUp) onClose?.()
  }

  return (
    <div className="overlay">
      <div className="auth-box">
        <button className="ghost close-button" onClick={onClose} aria-label="Close auth modal">
          x
        </button>

        <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>

        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button onClick={handlePasswordAuth} disabled={loading}>
          {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>

        <p className="auth-link" onClick={() => setIsSignUp((current) => !current)}>
          {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
        </p>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  )
}
