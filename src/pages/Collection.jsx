import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const TABS = [
  { id: 'all', label: 'ALL WORKS' },
  { id: 'painting', label: 'PAINTINGS' },
  { id: 'sculpture', label: 'SCULPTURES' },
  { id: 'photography', label: 'PHOTOGRAPHY' }
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'artist', label: 'Artist A-Z' }
]

export default function Collection() {
  const { user, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    fetchArtworks()
  }, [user])

  async function fetchArtworks() {
    if (!user) return

    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setArtworks(data || [])
    }
    setLoading(false)
  }

  // Filter and sort artworks
  const filteredArtworks = useMemo(() => {
    let result = artworks.filter(artwork => {
      // Search query
      const matchesSearch = !searchQuery ||
        artwork.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.artist?.toLowerCase().includes(searchQuery.toLowerCase())

      // Tab filter (by medium type)
      let matchesTab = true
      if (activeTab === 'painting') {
        matchesTab = artwork.medium?.toLowerCase().includes('oil') ||
          artwork.medium?.toLowerCase().includes('paint') ||
          artwork.medium?.toLowerCase().includes('canvas') ||
          artwork.medium?.toLowerCase().includes('huile')
      } else if (activeTab === 'sculpture') {
        matchesTab = artwork.medium?.toLowerCase().includes('sculpt') ||
          artwork.medium?.toLowerCase().includes('bronze') ||
          artwork.medium?.toLowerCase().includes('marble')
      } else if (activeTab === 'photography') {
        matchesTab = artwork.medium?.toLowerCase().includes('photo') ||
          artwork.medium?.toLowerCase().includes('print')
      }

      return matchesSearch && matchesTab
    })

    // Sort
    switch (sortBy) {
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'title':
        result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'artist':
        result = [...result].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
        break
    }

    return result
  }, [artworks, searchQuery, activeTab, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-display italic text-xl">Loading collection...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="font-display text-2xl font-bold italic text-primary">
              ArtVault
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              {/* Profile */}
              <Link
                to="/profile"
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold"
              >
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </Link>
            </div>
          </div>

          {/* Search bar (collapsible) */}
          {showSearch && (
            <div className="mt-4 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or artist..."
                className="input-field pl-12"
                autoFocus
              />
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
          Private Collection
        </p>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold italic mb-4">
          The Private Collection
        </h1>
        <p className="text-lg text-black/60 dark:text-white/60 max-w-2xl mx-auto font-body">
          A curated selection of {artworks.length} masterpieces, spanning centuries of artistic expression
          and human creativity.
        </p>
      </section>

      {/* Tabs & Controls */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black/10 dark:border-white/10">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40">
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium cursor-pointer focus:outline-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Artworks Grid */}
      <section className="max-w-7xl mx-auto px-4">
        {filteredArtworks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-black/40 dark:text-white/40 text-lg mb-6">
              {searchQuery ? 'No artworks match your search' : 'Your collection is empty'}
            </p>
            <Link
              to="/scan"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add your first artwork
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredArtworks.map((artwork) => (
              <Link
                key={artwork.id}
                to={`/artwork/${artwork.id}`}
                className="group"
              >
                {/* Card with gold border */}
                <div className="card-gold bg-white dark:bg-black/20 overflow-hidden">
                  {/* Image */}
                  <div className="aspect-[4/5] bg-black/5 dark:bg-white/5 relative overflow-hidden">
                    {artwork.image_url ? (
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-black/20 dark:text-white/20">
                          image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-display italic text-lg group-hover:text-primary transition-colors">
                      {artwork.artist || 'Unknown Artist'}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50 mt-1">
                      {artwork.title}
                      {artwork.year && <span>, {artwork.year}</span>}
                    </p>
                    {artwork.medium && (
                      <p className="text-sm italic text-black/40 dark:text-white/40 mt-2">
                        {artwork.medium}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Floating Add Button */}
      <Link
        to="/scan"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-primary-hover transition-all glow-gold z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  )
}
