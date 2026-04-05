import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewPost from './NewPost'
import PostCard from './PostCard'

export default function Feed({ user, onOpenPost, searchQuery }) {
  const [posts, setPosts] = useState([])
  const [tag, setTag] = useState('all')
  const [scope, setScope] = useState('public')
  const [showFilter, setShowFilter] = useState(false)
  const [viewMode, setViewMode] = useState('home')
  const [loading, setLoading] = useState(true)
  const filterRef = useRef(null)

  const filteredPosts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return posts

    return posts.filter((post) => {
      return [post.title, post.body, post.tag]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    })
  }, [posts, searchQuery])

  const newPosts = useMemo(() => {
    return [...filteredPosts].sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
  }, [filteredPosts])

  const topPosts = useMemo(() => {
    return [...filteredPosts].sort((left, right) => {
      const votesDelta = (right.votes_count || 0) - (left.votes_count || 0)
      if (votesDelta !== 0) return votesDelta
      return new Date(right.created_at) - new Date(left.created_at)
    })
  }, [filteredPosts])

  const previewNewPosts = newPosts.slice(0, 3)
  const previewTopPosts = topPosts.slice(0, 3)
  const viewingAll = viewMode === 'new-all' || viewMode === 'top-all'
  const allItems = viewMode === 'top-all' ? topPosts : newPosts

  useEffect(() => {
    fetchPosts()
  }, [tag, scope, user?.id])

  useEffect(() => {
    if (!user && scope === 'mine') {
      setScope('public')
    }
  }, [user, scope])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false)
      }
    }

    if (showFilter) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showFilter])

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

      setPosts(
        data.map((post) => ({
          ...post,
          replies_count: repliesCountByPost[post.id] || 0,
          votes_count: votesCountByPost[post.id] || 0,
        })),
      )
    }

    setLoading(false)
  }

  function renderPostList(items) {
    if (items.length === 0) {
      return <p className="loading-text">No posts found for current filters.</p>
    }

    return (
      <div className="post-list">
        {items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onOpen={() => onOpenPost(post)}
            onChange={fetchPosts}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="feed">
      <NewPost user={user} onPost={fetchPosts} />

      <div className="feed-controls">
        <div className="filter-wrap" ref={filterRef}>
          <button className="ghost" onClick={() => setShowFilter((current) => !current)}>
            Filter
          </button>

          {showFilter && (
            <div className="filter-popover">
              {user && (
                <div className="filter-group">
                  <p className="filter-title">Posts</p>
                  <div className="tabs">
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
                </div>
              )}

              <div className="filter-group">
                <p className="filter-title">Tags</p>
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
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="loading-text">No posts yet. Be the first.</p>
      ) : filteredPosts.length === 0 ? (
        <p className="loading-text">No posts found for &quot;{searchQuery.trim()}&quot;.</p>
      ) : viewingAll ? (
        <section className="section-block">
          <div className="section-head">
            <h3>{viewMode === 'top-all' ? 'Top posts' : 'New posts'}</h3>
            <button className="ghost" onClick={() => setViewMode('home')}>Back</button>
          </div>
          {renderPostList(allItems)}
        </section>
      ) : (
        <div className="section-grid">
          <section className="section-block">
            <div className="section-head">
              <h3>New</h3>
              <button className="ghost" onClick={() => setViewMode('new-all')}>View all</button>
            </div>
            {renderPostList(previewNewPosts)}
          </section>

          <section className="section-block">
            <div className="section-head">
              <h3>Top</h3>
              <button className="ghost" onClick={() => setViewMode('top-all')}>View all</button>
            </div>
            {renderPostList(previewTopPosts)}
          </section>
        </div>
      )}
    </div>
  )
}
