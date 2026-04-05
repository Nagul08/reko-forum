import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Textarea } from './ui/textarea'

export default function PostPage({ post, user, isAdmin, onClose }) {
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const fetchReplies = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('replies')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setReplies(data || [])
    setLoading(false)
  }, [post.id])

  useEffect(() => {
    fetchReplies()
  }, [fetchReplies])

  async function handleReply() {
    if (!user) {
      setError('Please sign in to reply.')
      return
    }

    if (!replyText.trim()) return

    setPosting(true)
    setError('')

    const { error: insertError } = await supabase.from('replies').insert({
      post_id: post.id,
      body: replyText.trim(),
      user_id: user.id,
      is_anon: false,
    })

    if (insertError) {
      setError(insertError.message)
      setPosting(false)
      return
    }

    setReplyText('')
    setPosting(false)
    fetchReplies()
  }

  async function handleDeleteReply(replyId) {
    const shouldDelete = window.confirm('Delete this reply? This action cannot be undone.')
    if (!shouldDelete) return

    const { error: deleteError } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setReplies((current) => current.filter((reply) => reply.id !== replyId))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit capitalize">#{post.tag}</Badge>
          <DialogTitle>{post.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-sm text-foreground/90">
            {post.body}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-t pt-3">
          <h3 className="text-sm font-semibold">Replies</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading replies...</p>
          ) : replies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          ) : (
            <ul className="grid gap-2">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-md border border-border/70 bg-muted/30 p-3">
                  <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
                  <small className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</small>
                  {isAdmin && (
                    <div className="mt-2">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteReply(reply.id)}>
                        Delete reply
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-2">
          {!user && <p className="text-sm text-muted-foreground">Sign in to reply to this post.</p>}
          <Textarea
            rows={3}
            value={replyText}
            placeholder="Write a reply..."
            onChange={(event) => setReplyText(event.target.value)}
            disabled={!user}
          />
          <div className="flex justify-end">
            <Button onClick={handleReply} disabled={!user || posting || !replyText.trim()}>
              {posting ? 'Posting...' : 'Reply'}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
