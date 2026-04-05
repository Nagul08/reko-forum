import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PostPage({ post, user, onClose }) {
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReplies()
  }, [post.id])

  async function fetchReplies() {
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
  }

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

  return (
    <div className="overlay" onClick={onClose}>
      <section className="post-page" onClick={(event) => event.stopPropagation()}>
        <button className="ghost close-button" onClick={onClose} aria-label="Close post modal">
          x
        </button>

        <span className="tag">#{post.tag}</span>
        <h2>{post.title}</h2>
        <p>{post.body}</p>

        <hr />

        <h3>Replies</h3>
        {loading ? (
          <p className="loading-text">Loading replies...</p>
        ) : replies.length === 0 ? (
          <p className="loading-text">No replies yet.</p>
        ) : (
          <ul className="reply-list">
            {replies.map((reply) => (
              <li key={reply.id}>
                <p>{reply.body}</p>
                <small>{new Date(reply.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}

        <div className="reply-box">
          {!user && <p className="loading-text">Sign in to reply to this post.</p>}
          <textarea
            rows={3}
            value={replyText}
            placeholder="Write a reply..."
            onChange={(event) => setReplyText(event.target.value)}
            disabled={!user}
          />
          <button onClick={handleReply} disabled={!user || posting || !replyText.trim()}>
            {posting ? 'Posting...' : 'Reply'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </section>
    </div>
  )
}
