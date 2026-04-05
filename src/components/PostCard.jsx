import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function getAnonToken() {
  const existing = localStorage.getItem('reko_anon_token')
  if (existing) return existing
  const generated = crypto.randomUUID()
  localStorage.setItem('reko_anon_token', generated)
  return generated
}

export default function PostCard({ post, user, onOpen, onChange }) {
  const [votes, setVotes] = useState(post.votes || 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const timestamp = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at])

  async function handleVote() {
    if (busy) return
    setBusy(true)
    setError('')

    setVotes((current) => current + 1)

    const { error: voteError } = await supabase.from('votes').insert({
      post_id: post.id,
      user_id: user?.id ?? null,
      anon_token: user ? null : getAnonToken(),
    })

    if (voteError) {
      setVotes((current) => current - 1)
      setBusy(false)
      setError(voteError.message)
      return
    }

    const { error: incrementError } = await supabase.rpc('increment_votes', { post_id: post.id })
    if (incrementError) {
      setVotes((current) => current - 1)
      setError(incrementError.message)
    }

    setBusy(false)
    onChange?.()
  }

  async function handleReport() {
    const { error: reportError } = await supabase.from('reports').insert({ post_id: post.id })
    if (reportError) {
      setError(reportError.message)
      return
    }

    alert('Reported. Thanks.')
  }

  return (
    <article className="post-card">
      <div className="post-header">
        <span className="tag">#{post.tag}</span>
        <span className="meta">{timestamp}</span>
      </div>

      <h3>{post.title}</h3>
      <p>{post.body}</p>

      <div className="post-actions">
        <button className="ghost" onClick={onOpen}>Reply</button>
        <button className="ghost" onClick={handleReport}>Report</button>
        <button onClick={handleVote} disabled={busy}>Upvote ({votes})</button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </article>
  )
}
