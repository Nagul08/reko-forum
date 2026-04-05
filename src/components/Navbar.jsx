import { useEffect, useRef, useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ user, isAdmin, theme, searchQuery, onSearchChange, onThemeToggle, onSignIn, onSignOut }) {
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
      <div className="navbar-top">
        <div className="brand-block">
          <p className="brand-eyebrow">reko-forum</p>
          <p className="brand-credit">
            Made by
            <img src="/retr0.svg" alt="retr0" className="brand-credit-logo" />
          </p>
        </div>

        <div className="nav-actions-primary">
          <ThemeToggle isDark={theme === 'dark'} onChange={onThemeToggle} />

          {user ? (
            <button className="ghost" onClick={onSignOut}>Sign out</button>
          ) : (
            <button className="ghost" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      </div>

      <div className="navbar-bottom">
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

        {user && (
          <div className="user-meta-row">
            {isAdmin && <span className="admin-pill">Admin</span>}
            <span className="user-pill">@{username}</span>
          </div>
        )}
      </div>
    </header>
  )
}
