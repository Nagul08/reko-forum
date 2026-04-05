import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'

export default function Navbar({
  user,
  isAdmin,
  theme,
  searchQuery,
  onSearchChange,
  onThemeToggle,
  onSignIn,
  onSignOut,
  activeView,
  onViewChange,
}) {
  const username = user?.user_metadata?.username || user?.email?.split('@')[0]
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  function handleSearchToggle() {
    if (searchOpen) {
      onSearchChange('')
      setSearchOpen(false)
      return
    }

    setSearchOpen(true)
  }

  return (
    <Card className="border-border/80 bg-card/95 p-4 backdrop-blur">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold uppercase tracking-[0.2em] text-foreground">reko-forum</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Made by
              <img src="/retr0.svg" alt="retr0" className="h-4 w-auto" />
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle isDark={theme === 'dark'} onChange={onThemeToggle} />

            {user ? (
              <Button variant="outline" onClick={onSignOut}>Sign out</Button>
            ) : (
              <Button variant="outline" onClick={onSignIn}>Sign in</Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-h-10 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleSearchToggle}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              title={searchOpen ? 'Close search' : 'Open search'}
            >
              <Search className="h-4 w-4" />
            </Button>

            <div className={searchOpen ? 'w-[min(320px,calc(100vw-220px))]' : 'w-0 overflow-hidden'}>
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onSearchChange('')
                    setSearchOpen(false)
                  }
                }}
                aria-label="Search posts"
                className="transition-all"
              />
            </div>

            {isAdmin && (
              <div className="ml-1 hidden items-center gap-2 sm:inline-flex">
                <Button
                  variant={activeView === 'feed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewChange?.('feed')}
                >
                  Feed
                </Button>
                <Button
                  variant={activeView === 'reports' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewChange?.('reports')}
                >
                  Reports
                </Button>
              </div>
            )}
          </div>

          {user && (
            <div className="inline-flex items-center gap-2">
              {isAdmin && <Badge variant="secondary">Admin</Badge>}
              <Badge variant="outline">@{username}</Badge>
            </div>
          )}
        </div>
      </header>
    </Card>
  )
}
