import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewPost from './NewPost'
import PostCard from './PostCard'

export default function Feed({ user, onOpenPost }) {
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('new')
  const [tag, setTag] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [sort, tag])

  async function fetchPosts() {
    setLoading(true)

    let query = supabase.from('posts').select('*')

    if (tag !== 'all') query = query.eq('tag', tag)
    if (sort === 'new') query = query.order('created_at', { ascending: false })
    if (sort === 'top') query = query.order('votes', { ascending: false })

    const { data, error } = await query

    if (!error) {
      setPosts(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="feed">
      <NewPost user={user} onPost={fetchPosts} />

      <div className="feed-controls">
        <div className="tabs" role="tablist" aria-label="Sort posts">
          {['new', 'top'].map((value) => (
            <button
              key={value}
              className={sort === value ? 'tab active' : 'tab'}
              onClick={() => setSort(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="tabs" role="tablist" aria-label="Filter tags">
          {['all', 'confession', 'topic', 'rant', 'question'].map((value) => (
            <button
              key={value}
              className={tag === value ? 'tab active' : 'tab'}
              onClick={() => setTag(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="loading-text">No posts yet. Be the first.</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              onOpen={() => onOpenPost(post)}
              onChange={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
