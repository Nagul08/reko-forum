import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

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

function isDuplicateVoteError(error) {
  const rawMessage = (error?.message || '').toLowerCase()
  const constraint = error?.constraint || ''

  return (
    constraint === 'votes_post_id_user_id_key' ||
    rawMessage.includes('votes_post_id_user_id_key') ||
    rawMessage.includes('duplicate key value')
  )
}

export default function PostCard({ post, user, isAdmin, onOpen, onChange }) {
  const [votes, setVotes] = useState(post.votes_count ?? post.votes ?? 0)
  const [hasVoted, setHasVoted] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const timestamp = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at])

  useEffect(() => {
    setVotes(post.votes_count ?? post.votes ?? 0)
  }, [post.votes_count, post.votes])

  useEffect(() => {
    let active = true

    async function checkVoteState() {
      if (!user?.id) {
        setHasVoted(false)
        return
      }

      const { data, error: existingVoteError } = await supabase
        .from('votes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return
      if (!existingVoteError && data) {
        setHasVoted(true)
      } else {
        setHasVoted(false)
      }
    }

    checkVoteState()

    return () => {
      active = false
    }
  }, [post.id, user?.id])

  async function handleVote() {
    if (busy) return

    if (!user) {
      setError('Please sign in to upvote posts.')
      return
    }

    setBusy(true)
    setError('')

    if (hasVoted) {
      const { error: removeError } = await supabase
        .from('votes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)

      if (removeError) {
        setBusy(false)
        setError('Could not remove your upvote. Please try again.')
        return
      }

      setVotes((current) => Math.max(0, current - 1))
      setHasVoted(false)
      setBusy(false)
      onChange?.()
      return
    }

    setVotes((current) => current + 1)

    const { error: voteError } = await supabase.from('votes').insert({
      post_id: post.id,
      user_id: user.id,
      anon_token: null,
    })

    if (voteError) {
      if (isDuplicateVoteError(voteError)) {
        // Keep UI in sync if the user already had a vote on this post.
        setHasVoted(true)
        setBusy(false)
        return
      }

      setVotes((current) => current - 1)
      setBusy(false)
      setError(getFriendlyVoteError(voteError))
      return
    }

    setHasVoted(true)
    setJustVoted(true)
    setTimeout(() => setJustVoted(false), 320)
    setBusy(false)
    onChange?.()
  }

  async function handleReport() {
    if (!user) {
      setError('Please sign in to report posts.')
      return
    }

    const { error: reportError } = await supabase.from('reports').insert({ post_id: post.id })
    if (reportError) {
      setError(reportError.message)
      return
    }

    alert('Reported. Thanks.')
  }

  async function handleDeletePost() {
    const shouldDelete = window.confirm('Delete this post? This action cannot be undone.')
    if (!shouldDelete) return

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    onChange?.()
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
        {isAdmin && <button className="danger" onClick={handleDeletePost}>Delete</button>}
        <button
          onClick={handleVote}
          disabled={busy}
          className={`vote-button ${hasVoted ? 'is-on' : 'is-off'} ${justVoted ? 'pulse' : ''}`}
        >
          Upvote ({votes})
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </article>
  )
}
