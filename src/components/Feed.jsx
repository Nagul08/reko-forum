import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewPost from './NewPost'
import PostCard from './PostCard'

export default function Feed({ user, onOpenPost, searchQuery }) {
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('new')
  const [tag, setTag] = useState('all')
  const [scope, setScope] = useState('public')
  const [loading, setLoading] = useState(true)

  const filteredPosts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return posts

    return posts.filter((post) => {
      return [post.title, post.body, post.tag]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    })
  }, [posts, searchQuery])

  useEffect(() => {
    fetchPosts()
  }, [sort, tag, scope, user?.id])

  useEffect(() => {
    if (!user && scope === 'mine') {
      setScope('public')
    }
  }, [user, scope])

  async function fetchPosts() {
    setLoading(true)

    let query = supabase.from('posts').select('*')

    if (scope === 'mine' && user?.id) {
      query = query.eq('user_id', user.id)
    } else if (user?.id) {
      query = query.or(`is_anon.eq.true,user_id.eq.${user.id}`)
    } else {
      query = query.eq('is_anon', true)
    }

    if (tag !== 'all') query = query.eq('tag', tag)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (!error && data) {
      const postIds = data.map((post) => post.id)
      let repliesCountByPost = {}
      let votesCountByPost = {}

      if (postIds.length > 0) {
        const { data: repliesData, error: repliesError } = await supabase
          .from('replies')
          .select('post_id')
          .in('post_id', postIds)

        if (!repliesError && repliesData) {
          repliesCountByPost = repliesData.reduce((accumulator, reply) => {
            const key = reply.post_id
            accumulator[key] = (accumulator[key] || 0) + 1
            return accumulator
          }, {})
        }

        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('post_id')
          .in('post_id', postIds)

        if (!votesError && votesData) {
          votesCountByPost = votesData.reduce((accumulator, vote) => {
            const key = vote.post_id
            accumulator[key] = (accumulator[key] || 0) + 1
            return accumulator
          }, {})
        }
      }

      const mappedPosts = data.map((post) => ({
          ...post,
          replies_count: repliesCountByPost[post.id] || 0,
          votes_count: votesCountByPost[post.id] || 0,
      }))

      if (sort === 'top') {
        mappedPosts.sort((left, right) => {
          const votesDelta = (right.votes_count || 0) - (left.votes_count || 0)
          if (votesDelta !== 0) return votesDelta
          return new Date(right.created_at) - new Date(left.created_at)
        })
      }

      setPosts(mappedPosts)
    }

    setLoading(false)
  }
  return (
    <div className="feed">
      <NewPost user={user} onPost={fetchPosts} />

      <div className="feed-controls">
        {user && (
          <div className="tabs" role="tablist" aria-label="Post scope">
            {[['public', 'all posts'], ['mine', 'my posts']].map(([value, label]) => (
              <button
                key={value}
                className={scope === value ? 'tab active' : 'tab'}
                onClick={() => setScope(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

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
      ) : filteredPosts.length === 0 ? (
        <p className="loading-text">No posts found for &quot;{searchQuery.trim()}&quot;.</p>
      ) : (
        <div className="post-list">
          {filteredPosts.map((post) => (
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
