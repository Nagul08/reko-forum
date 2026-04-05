import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'

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
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create account' : 'Sign in'}</DialogTitle>
          <DialogDescription>
            Use your forum username and password.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            type="text"
            placeholder="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <Input
            type="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {message && <p className="text-sm text-destructive">{message}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button onClick={handlePasswordAuth} disabled={loading} className="w-full">
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsSignUp((current) => !current)}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
