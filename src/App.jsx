import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import Feed from './components/Feed'
import Navbar from './components/Navbar'
import PostPage from './components/PostPage'
import { supabase } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activePost, setActivePost] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('reko-theme') || 'dark')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('reko-theme', theme)
  }, [theme])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        theme={theme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
      />

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}

      <main className="main-content">
        <Feed user={user} onOpenPost={setActivePost} searchQuery={searchQuery} />
      </main>

      {activePost && (
        <PostPage
          post={activePost}
          user={user}
          onClose={() => setActivePost(null)}
        />
      )}
    </div>
  )
}
