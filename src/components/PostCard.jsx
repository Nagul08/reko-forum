import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function getAnonToken() {
  const existing = localStorage.getItem('reko_anon_token')
  if (existing) return existing
  const generated = crypto.randomUUID()
  localStorage.setItem('reko_anon_token', generated)
  return generated
}

function getFriendlyVoteError(error) {
  const rawMessage = error?.message || ''
  const constraint = error?.constraint || ''

  if (
    constraint === 'votes_post_id_user_id_key' ||
    rawMessage.includes('votes_post_id_user_id_key') ||
    rawMessage.toLowerCase().includes('duplicate key value')
  ) {
    return 'You already upvoted this post.'
  }

  return rawMessage || 'Could not register your vote. Please try again.'
}

export default function PostCard({ post, user, onOpen, onChange }) {
  const [votes, setVotes] = useState(post.votes_count ?? post.votes ?? 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const timestamp = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at])

  useEffect(() => {
    setVotes(post.votes_count ?? post.votes ?? 0)
  }, [post.votes_count, post.votes])

  async function handleVote() {
    if (busy) return
    setBusy(true)
    setError('')

    const anonToken = user ? null : getAnonToken()

    if (!user && anonToken) {
      const { data: existingVote, error: existingVoteError } = await supabase
        .from('votes')
        .select('id')
        .eq('post_id', post.id)
        .eq('anon_token', anonToken)
        .maybeSingle()

      if (!existingVoteError && existingVote) {
        setBusy(false)
        setError('You already upvoted this post.')
        return
      }
    }

    setVotes((current) => current + 1)

    const { error: voteError } = await supabase.from('votes').insert({
      post_id: post.id,
      user_id: user?.id ?? null,
      anon_token: anonToken,
    })

    if (voteError) {
      setVotes((current) => current - 1)
      setBusy(false)
      setError(getFriendlyVoteError(voteError))
      return
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
        <span className="meta replies-count">Replies: {post.replies_count || 0}</span>
        <button className="ghost" onClick={onOpen}>Reply</button>
        <button className="ghost" onClick={handleReport}>Report</button>
        <button onClick={handleVote} disabled={busy}>Upvote ({votes})</button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </article>
  )
}
