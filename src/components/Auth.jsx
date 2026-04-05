import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePasswordAuth() {
    if (!email.trim() || !password.trim()) {
      setMessage('Email and password are required.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setMessage(error ? error.message : isSignUp ? 'Check your email to confirm.' : 'Signed in successfully.')
    setLoading(false)

    if (!error && !isSignUp) onClose?.()
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setMessage('Email is required.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setMessage(error ? error.message : 'Magic link sent. Check your email.')
    setLoading(false)
  }

  return (
    <div className="overlay">
      <div className="auth-box">
        <button className="ghost close-button" onClick={onClose} aria-label="Close auth modal">
          x
        </button>

        <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {mode === 'password' && (
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}

        {mode === 'password' ? (
          <button onClick={handlePasswordAuth} disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        ) : (
          <button onClick={handleMagicLink} disabled={loading}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        )}

        <p className="auth-link" onClick={() => setMode((current) => (current === 'password' ? 'magic' : 'password'))}>
          {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
        </p>

        {mode === 'password' && (
          <p className="auth-link" onClick={() => setIsSignUp((current) => !current)}>
            {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
          </p>
        )}

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  )
}
