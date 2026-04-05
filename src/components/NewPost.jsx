import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TAGS = ['confession', 'topic', 'rant', 'question']

export default function NewPost({ user, onPost }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('confession')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!user) {
      setError('Please sign in to create a post.')
      return
    }

    if (!title.trim() || !body.trim()) return

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('posts').insert({
      title: title.trim(),
      body: body.trim(),
      tag,
      user_id: user.id,
      is_anon: false,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setTitle('')
    setBody('')
    setOpen(false)
    setLoading(false)
    onPost?.()
  }

  if (!open) {
    return (
      <button className="new-post-trigger" onClick={() => setOpen(true)}>
        {user ? 'Create a post...' : 'Sign in to create a post'}
      </button>
    )
  }

  if (!user) {
    return (
      <div className="new-post-form">
        <p className="loading-text">Posting is available only after login.</p>
      </div>
    )
  }

  return (
    <div className="new-post-form">
      <div className="row">
        <select value={tag} onChange={(event) => setTag(event.target.value)}>
          {TAGS.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <input
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={150}
      />

      <textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
      />

      {error && <p className="error-text">{error}</p>}

      <div className="form-actions">
        <button className="ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading || !title.trim() || !body.trim()}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
