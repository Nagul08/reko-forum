export default function Navbar({ user, onSignIn, onSignOut }) {
  return (
    <header className="navbar">
      <div>
        <p className="brand-eyebrow">reko-forum</p>
        <h1>Whisper. Post. Vent.</h1>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="user-pill">{user.email}</span>
            <button className="ghost" onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <button className="ghost" onClick={onSignIn}>Sign in</button>
        )}
      </div>
    </header>
  )
}
