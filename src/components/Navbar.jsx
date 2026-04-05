import { useEffect, useRef, useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ user, theme, searchQuery, onSearchChange, onThemeToggle, onSignIn, onSignOut }) {
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
    <header className="navbar">
      <div>
        <p className="brand-eyebrow">reko-forum</p>
        <h1>Whisper. Post. Vent.</h1>
      </div>

      <div className="nav-actions">
        <div className="search-shell nav-search">
          <button
            type="button"
            className="search-toggle"
            onClick={handleSearchToggle}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            title={searchOpen ? 'Close search' : 'Open search'}
          >
            <img src="/mag.svg" alt="" aria-hidden="true" className="search-icon" />
          </button>

          <div className={searchOpen ? 'search-row is-open' : 'search-row'}>
            <input
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
            />
          </div>
        </div>

        <ThemeToggle isDark={theme === 'dark'} onChange={onThemeToggle} />

        {user ? (
          <>
            <span className="user-pill">@{username}</span>
            <button className="ghost" onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <button className="ghost" onClick={onSignIn}>Sign in</button>
        )}
      </div>
    </header>
  )
}
