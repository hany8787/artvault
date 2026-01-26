import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import MuseumAutocomplete from '../components/MuseumAutocomplete'

const ANALYSIS_STEPS = [
  'Scanning artwork...',
  'Identifying composition...',
  'Recognizing artist...',
  'Fetching metadata...',
  'Generating curatorial notes...'
]

export default function Scan() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // States
  const [step, setStep] = useState('capture') // capture, analyzing, form, saving
  const [imageData, setImageData] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [error, setError] = useState('')
  const [flashEnabled, setFlashEnabled] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    artist_dates: '',
    year: '',
    period: '',
    style: '',
    medium: '',
    dimensions: '',
    museum: '',
    museum_id: null,
    museum_city: '',
    museum_country: '',
    description: '',
    curatorial_note: ''
  })

  // Auto-start camera on mount
  useEffect(() => {
    if (step === 'capture' && !imageData) {
      startCamera()
    }
    return () => stopCamera()
  }, [])

  // Camera functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera or use gallery import.')
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setImageData(dataUrl)

    // Convert to file for upload
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setImageFile(file)
    }, 'image/jpeg', 0.9)

    stopCamera()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    stopCamera()
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageData(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function resetCapture() {
    setImageData(null)
    setImageFile(null)
    setStep('capture')
    setFormData({
      title: '',
      artist: '',
      artist_dates: '',
      year: '',
      period: '',
      style: '',
      medium: '',
      dimensions: '',
      museum: '',
      museum_id: null,
      museum_city: '',
      museum_country: '',
      description: '',
      curatorial_note: ''
    })
    setError('')
    startCamera()
  }

  // AI Analysis via Supabase Edge Function
  async function analyzeImage() {
    setStep('analyzing')
    setAnalysisStep(0)
    setError('')

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev))
      }, 1000)

      // Remove data URL prefix to get pure base64
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')

      // Call Supabase Edge Function for AI analysis
      const { data, error: fnError } = await supabase.functions.invoke('enrich-artwork', {
        body: { imageBase64: base64Data }
      })

      clearInterval(progressInterval)
      setAnalysisStep(ANALYSIS_STEPS.length - 1)

      if (fnError) throw fnError

      // API returns data in data.data (double nesting from Supabase)
      const result = data.data || data

      // Use the real values from the API response
      const analysis = {
        title: result.title || '',
        artist: result.artist || '',
        artist_dates: result.artist_dates || '',
        year: result.year || '',
        period: result.period || '',
        style: result.style || '',
        medium: result.medium || '',
        dimensions: result.dimensions || '',
        museum: result.museum || '',
        museum_city: result.museum_city || '',
        museum_country: result.museum_country || '',
        description: result.description || '',
        curatorial_note: result.curatorial_note || ''
      }

      setFormData(analysis)
      setStep('form')
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Analysis failed. Please try again.')
      setStep('capture')
    }
  }

  // Skip AI and go directly to form
  function skipToForm() {
    setStep('form')
  }

  // Save artwork
  async function saveArtwork() {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setStep('saving')
    setError('')

    try {
      let imageUrl = null
      let museumId = formData.museum_id

      // Upload image to Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('artworks')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Find or create museum if name provided but no ID
      if (formData.museum.trim() && !museumId) {
        const { data: foundMuseumId, error: museumError } = await supabase
          .rpc('find_or_create_museum', {
            p_name: formData.museum.trim(),
            p_city: formData.museum_city.trim() || null,
            p_country: formData.museum_country.trim() || null
          })

        if (!museumError && foundMuseumId) {
          museumId = foundMuseumId
        }
      }

      // Save to database
      const { data, error: insertError } = await supabase
        .from('artworks')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          title: formData.title.trim(),
          artist: formData.artist.trim() || null,
          artist_dates: formData.artist_dates.trim() || null,
          year: formData.year.trim() || null,
          period: formData.period.trim() || null,
          style: formData.style.trim() || null,
          medium: formData.medium.trim() || null,
          dimensions: formData.dimensions.trim() || null,
          museum: formData.museum.trim() || null,
          museum_id: museumId,
          museum_city: formData.museum_city.trim() || null,
          museum_country: formData.museum_country.trim() || null,
          description: formData.description.trim() || null,
          curatorial_note: formData.curatorial_note.trim() || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Navigate to the new artwork
      navigate(`/artwork/${data.id}`)
    } catch (err) {
      console.error('Save error:', err)
      setError('Save failed. Please try again.')
      setStep('form')
    }
  }

  // Update form field
  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle museum selection from autocomplete
  function handleMuseumSelect(museum) {
    setFormData(prev => ({
      ...prev,
      museum: museum.name,
      museum_id: museum.id,
      museum_city: museum.city || prev.museum_city,
      museum_country: museum.country || prev.museum_country
    }))
  }

  // CAPTURE VIEW - Full screen camera with Artiscan Elite style
  if (step === 'capture') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Camera / Image View */}
        <div className="flex-1 relative overflow-hidden">
          {imageData ? (
            <img src={imageData} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Top Gradient Overlay */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />

          {/* Header */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
            <Link
              to="/collection"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </Link>

            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                ArtScan
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {imageData ? 'Ready to analyze' : 'Frame your artwork'}
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          {/* Viewfinder Frame with Corner Brackets */}
          {!imageData && cameraActive && (
            <div className="absolute inset-12 md:inset-24 pointer-events-none">
              {/* Top Left Corner */}
              <div className="absolute -top-1 -left-1">
                <div className="w-12 h-[3px] bg-primary rounded-full" />
                <div className="w-[3px] h-12 bg-primary rounded-full" />
              </div>
              {/* Top Right Corner */}
              <div className="absolute -top-1 -right-1">
                <div className="w-12 h-[3px] bg-primary rounded-full ml-auto" />
                <div className="w-[3px] h-12 bg-primary rounded-full ml-auto" />
              </div>
              {/* Bottom Left Corner */}
              <div className="absolute -bottom-1 -left-1">
                <div className="w-[3px] h-12 bg-primary rounded-full" />
                <div className="w-12 h-[3px] bg-primary rounded-full" />
              </div>
              {/* Bottom Right Corner */}
              <div className="absolute -bottom-1 -right-1">
                <div className="w-[3px] h-12 bg-primary rounded-full ml-auto" />
                <div className="w-12 h-[3px] bg-primary rounded-full ml-auto" />
              </div>

              {/* Animated Scan Line */}
              <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                <div className="scan-line absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute top-20 inset-x-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          {/* Image Preview Reset Button */}
          {imageData && (
            <button
              onClick={resetCapture}
              className="absolute top-20 right-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Retake
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 inset-x-0 pb-8 pt-4">
          {imageData ? (
            /* After capture - Analysis options */
            <div className="px-6 space-y-3">
              <button
                onClick={analyzeImage}
                className="w-full bg-primary text-bg-dark font-semibold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-primary-hover transition-all glow-gold"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Analyze with AI
              </button>
              <button
                onClick={skipToForm}
                className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined">edit</span>
                Enter manually
              </button>
            </div>
          ) : (
            /* Camera controls */
            <div className="flex items-center justify-around px-8">
              {/* Gallery Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">photo_library</span>
              </button>

              {/* Capture Button - Big round with glow */}
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="relative group"
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-glow scale-110" />
                {/* Main button */}
                <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform group-disabled:opacity-50">
                  <div className="w-16 h-16 rounded-full border-4 border-bg-dark/30" />
                </div>
              </button>

              {/* Flash Button */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className={`w-14 h-14 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                  flashEnabled
                    ? 'bg-primary/30 text-primary'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {flashEnabled ? 'flash_on' : 'flash_off'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ANALYZING VIEW
  if (step === 'analyzing') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Background image with blur */}
        <div className="absolute inset-0">
          <img src={imageData} alt="Analyzing" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-8">
          {/* Artwork preview */}
          <div className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl mb-8 relative">
            <img src={imageData} alt="Artwork" className="w-full h-full object-cover" />
            {/* Scan animation overlay */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="scan-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>

          {/* Analysis status */}
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl italic text-white mb-2">
              {ANALYSIS_STEPS[analysisStep]}
            </h2>
            <p className="text-white/40 text-sm">
              Step {analysisStep + 1} of {ANALYSIS_STEPS.length}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {ANALYSIS_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= analysisStep
                    ? 'bg-primary scale-100'
                    : 'bg-white/20 scale-75'
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // SAVING VIEW
  if (step === 'saving') {
    return (
      <div className="fixed inset-0 bg-bg-light dark:bg-bg-dark z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="font-display text-2xl italic mb-2">Saving artwork...</h2>
          <p className="text-black/40 dark:text-white/40 text-sm">Please wait</p>
        </div>
      </div>
    )
  }

  // FORM VIEW - Editorial style
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Fixed Header */}
      <header className="sticky top-0 z-40 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={resetCapture}
            className="flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Retake</span>
          </button>

          <h1 className="font-display text-lg italic text-primary">New Artwork</h1>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Image Preview */}
        {imageData && (
          <div className="mb-8">
            <div className="aspect-[4/3] max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
              <img src={imageData} alt="Artwork" className="w-full h-full object-contain bg-black/5 dark:bg-white/5" />
            </div>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Essential Information */}
          <section className="card-gold bg-white dark:bg-black/20 rounded-xl p-6">
            <h3 className="font-display text-xl italic text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">info</span>
              Essential Information
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="input-field"
                  placeholder="Artwork title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => updateField('artist', e.target.value)}
                    className="input-field"
                    placeholder="Artist name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Artist Dates
                  </label>
                  <input
                    type="text"
                    value={formData.artist_dates}
                    onChange={(e) => updateField('artist_dates', e.target.value)}
                    className="input-field"
                    placeholder="1853-1890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => updateField('year', e.target.value)}
                    className="input-field"
                    placeholder="1889"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Period
                  </label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => updateField('period', e.target.value)}
                    className="input-field"
                    placeholder="Post-Impressionism"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Style
                  </label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) => updateField('style', e.target.value)}
                    className="input-field"
                    placeholder="Expressionism"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Technical Details */}
          <section className="card-gold bg-white dark:bg-black/20 rounded-xl p-6">
            <h3 className="font-display text-xl italic text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">straighten</span>
              Technical Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Medium / Technique
                </label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={(e) => updateField('medium', e.target.value)}
                  className="input-field"
                  placeholder="Oil on canvas"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => updateField('dimensions', e.target.value)}
                  className="input-field"
                  placeholder="73.7 × 92.1 cm"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="card-gold bg-white dark:bg-black/20 rounded-xl p-6">
            <h3 className="font-display text-xl italic text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">museum</span>
              Location
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Museum / Collection
                </label>
                <MuseumAutocomplete
                  value={formData.museum}
                  onChange={(value) => updateField('museum', value)}
                  onMuseumSelect={handleMuseumSelect}
                  placeholder="Museum of Modern Art"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.museum_city}
                    onChange={(e) => updateField('museum_city', e.target.value)}
                    className="input-field"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.museum_country}
                    onChange={(e) => updateField('museum_country', e.target.value)}
                    className="input-field"
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Description & Notes */}
          <section className="card-gold bg-white dark:bg-black/20 rounded-xl p-6">
            <h3 className="font-display text-xl italic text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">description</span>
              Description & Notes
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Describe the artwork..."
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">
                  Curatorial Note
                </label>
                <textarea
                  value={formData.curatorial_note}
                  onChange={(e) => updateField('curatorial_note', e.target.value)}
                  rows={3}
                  className="input-field resize-none font-display italic"
                  placeholder="Your personal reflection on this artwork..."
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-4 pb-24">
            <button
              onClick={resetCapture}
              className="btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Start Over
            </button>
            <button
              onClick={saveArtwork}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              Save Artwork
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
