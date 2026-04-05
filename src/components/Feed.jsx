import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewPost from './NewPost'
import PostCard from './PostCard'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function Feed({ user, isAdmin, onOpenPost, searchQuery }) {
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

  const fetchPosts = useCallback(async (options = {}) => {
    const { silent = false } = options
    if (!silent) {
      setLoading(true)
    }

    let query = supabase.from('posts').select('*')

    if (scope === 'mine' && user?.id) {
      query = query.eq('user_id', user.id)
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

    if (!silent) {
      setLoading(false)
    }
  }, [scope, tag, user?.id])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

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

  function renderPostList(items) {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">No posts found for current filters.</p>
    }

    return (
      <div className="grid gap-3">
        {items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            isAdmin={isAdmin}
            onOpen={() => onOpenPost(post)}
            onChange={() => fetchPosts({ silent: true })}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <NewPost user={user} onPost={fetchPosts} />

      <div className="relative" ref={filterRef}>
        <Button variant="outline" onClick={() => setShowFilter((current) => !current)}>
            Filter
          </Button>

          {showFilter && (
            <Card className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-[min(560px,96vw)]">
              <CardContent className="grid gap-4 pt-6">
              {user && (
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Posts</p>
                  <div className="flex flex-wrap gap-2">
                    {[['public', 'all posts'], ['mine', 'my posts']].map(([value, label]) => (
                      <Button
                        key={value}
                        variant={scope === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScope(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter tags">
                  {['all', 'confession', 'topic', 'rant', 'question'].map((value) => (
                    <Button
                      key={value}
                      variant={tag === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTag(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              </CardContent>
            </Card>
          )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet. Be the first.</p>
      ) : filteredPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts found for &quot;{searchQuery.trim()}&quot;.</p>
      ) : viewingAll ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{viewMode === 'top-all' ? 'Top posts' : 'New posts'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('home')}>Back</Button>
          </CardHeader>
          <CardContent>{renderPostList(allItems)}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>New</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('new-all')}>View all</Button>
            </CardHeader>
            <CardContent>{renderPostList(previewNewPosts)}</CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Top</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('top-all')}>View all</Button>
            </CardHeader>
            <CardContent>{renderPostList(previewTopPosts)}</CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
