import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Textarea } from './ui/textarea'

const TAGS = ['confession', 'topic', 'rant', 'question']

export default function NewPost({ user, onPost }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('confession')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!user) {
      setError('Please sign in to create a post.')
      return
    }

    if (!title.trim() || !body.trim()) return

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('posts').insert({
      title: title.trim(),
      body: body.trim(),
      tag,
      user_id: user.id,
      is_anon: false,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setTitle('')
    setBody('')
    setOpen(false)
    setLoading(false)
    onPost?.()
  }

  if (!open) {
    return (
      <Button variant="outline" className="h-11 w-full justify-start" onClick={() => setOpen(true)}>
        {user ? 'Create a post...' : 'Sign in to create a post'}
      </Button>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Posting is available only after login.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="grid gap-3 pt-6">
        <div>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue placeholder="Select tag" />
            </SelectTrigger>
            <SelectContent>
              {TAGS.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={150}
        />

        <Textarea
          placeholder="What's on your mind?"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim() || !body.trim()}>
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
