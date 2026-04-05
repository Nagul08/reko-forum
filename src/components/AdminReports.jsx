import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const STATUS_OPTIONS = ['open', 'reviewed', 'resolved']

function toMapById(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.id] = item
    return accumulator
  }, {})
}

export default function AdminReports({ onOpenPost }) {
  const [reports, setReports] = useState([])
  const [postsById, setPostsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [statusSupported, setStatusSupported] = useState(true)

  const mergedReports = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      linkedPost: postsById[report.post_id] || null,
    }))
  }, [postsById, reports])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (reportsError) {
      setError(reportsError.message)
      setLoading(false)
      return
    }

    const reportList = reportsData || []
    setReports(reportList)

    const postIds = [...new Set(reportList.map((report) => report.post_id).filter(Boolean))]

    if (postIds.length === 0) {
      setPostsById({})
      setLoading(false)
      return
    }

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, body, tag, created_at, user_id')
      .in('id', postIds)

    if (postsError) {
      setError(postsError.message)
      setLoading(false)
      return
    }

    setPostsById(toMapById(postsData || []))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function handleDeleteReport(reportId) {
    setBusyId(reportId)
    setError('')

    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      setBusyId(null)
      setError(deleteError.message)
      return
    }

    await fetchReports()
    setBusyId(null)
  }

  async function handleDeletePost(reportId, postId) {
    const shouldDelete = window.confirm('Delete this reported post? This action cannot be undone.')
    if (!shouldDelete) return

    setBusyId(reportId)
    setError('')

    const { error: deletePostError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (deletePostError) {
      setBusyId(null)
      setError(deletePostError.message)
      return
    }

    await fetchReports()
    setBusyId(null)
  }

  async function handleStatusChange(reportId, nextStatus) {
    setBusyId(reportId)
    setError('')

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: nextStatus })
      .eq('id', reportId)

    if (updateError) {
      const loweredMessage = (updateError.message || '').toLowerCase()
      if (loweredMessage.includes('status') || loweredMessage.includes('column')) {
        setStatusSupported(false)
        setError('Status updates are unavailable because reports.status does not exist yet.')
      } else {
        setError(updateError.message)
      }

      setBusyId(null)
      return
    }

    await fetchReports()
    setBusyId(null)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading reports...</p>
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Reports Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {mergedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports right now.</p>
          ) : (
            <div className="grid gap-3">
              {mergedReports.map((report) => {
                const post = report.linkedPost
                const status = typeof report.status === 'string' ? report.status : 'open'

                return (
                  <Card key={report.id} className="border-border/70">
                    <CardContent className="grid gap-3 pt-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Report #{report.id}</Badge>
                        <Badge variant="secondary" className="capitalize">{status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {report.created_at ? new Date(report.created_at).toLocaleString() : 'No timestamp'}
                        </span>
                      </div>

                      {report.reason && (
                        <p className="text-sm text-foreground/90">Reason: {report.reason}</p>
                      )}

                      {post ? (
                        <div className="rounded-md border border-border/70 bg-muted/25 p-3">
                          <p className="mb-1 text-xs text-muted-foreground">Reported post</p>
                          <h3 className="text-sm font-semibold">{post.title}</h3>
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">{post.body}</p>
                          {post.tag && <p className="mt-1 text-xs text-muted-foreground">Tag: #{post.tag}</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Post was removed or is inaccessible.</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {statusSupported && (
                          <Select
                            value={status}
                            onValueChange={(value) => handleStatusChange(report.id, value)}
                            disabled={busyId === report.id}
                          >
                            <SelectTrigger className="w-[170px]">
                              <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((value) => (
                                <SelectItem key={value} value={value}>{value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {post && (
                          <Button variant="ghost" size="sm" onClick={() => onOpenPost(post)}>
                            Open post
                          </Button>
                        )}

                        {post && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busyId === report.id}
                            onClick={() => handleDeletePost(report.id, post.id)}
                          >
                            Delete post
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === report.id}
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          Dismiss report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}