import ThemeToggle from './ThemeToggle'

export default function Navbar({ user, theme, onThemeToggle, onSignIn, onSignOut }) {
  const username = user?.user_metadata?.username || user?.email?.split('@')[0]

  return (
    <header className="navbar">
      <div>
        <p className="brand-eyebrow">reko-forum</p>
        <h1>Whisper. Post. Vent.</h1>
      </div>

      <div className="nav-actions">
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
