import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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

function getFriendlyUnvoteError(error) {
  const rawMessage = (error?.message || '').toLowerCase()
  if (rawMessage.includes('row-level security') || rawMessage.includes('permission denied')) {
    return 'Un-upvote is blocked by database policy. Please run the votes RLS fix SQL.'
  }

  return 'Could not remove your upvote. Please try again.'
}

export default function PostCard({ post, user, isAdmin, onOpen, onChange }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const timestamp = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at])

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
        setError(getFriendlyUnvoteError(removeError))
        return
      }

      setHasVoted(false)
      setBusy(false)
      onChange?.()
      return
    }

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
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">#{post.tag}</Badge>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <CardTitle className="text-lg">{post.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{post.body}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Replies: {post.replies_count || 0}</Badge>
          <Button variant="ghost" size="sm" onClick={onOpen}>Reply</Button>
          <Button variant="ghost" size="sm" onClick={handleReport}>Report</Button>
          {isAdmin && <Button variant="destructive" size="sm" onClick={handleDeletePost}>Delete</Button>}
          <Button
            onClick={handleVote}
            disabled={busy}
            size="sm"
            variant={hasVoted ? 'default' : 'outline'}
            className={justVoted ? 'animate-pulse' : ''}
          >
            Upvote ({post.votes_count ?? post.votes ?? 0})
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
