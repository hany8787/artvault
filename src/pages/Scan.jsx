import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import MuseumAutocomplete from '../components/MuseumAutocomplete'

const ANALYSIS_STEPS = [
  'Analyse de l\'image...',
  'Identification de l\'œuvre...',
  'Recherche de l\'artiste...',
  'Récupération des métadonnées...',
  'Génération de la note curatoriale...'
]

export default function Scan() {
  const { user } = useAuth()
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

  // Camera functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès ou utiliser l\'import photo.')
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
      console.log('Sending imageBase64, length:', base64Data.length)

      // Call Supabase Edge Function for AI analysis
      const { data, error: fnError } = await supabase.functions.invoke('enrich-artwork', {
        body: { imageBase64: base64Data }
      })

      clearInterval(progressInterval)
      setAnalysisStep(ANALYSIS_STEPS.length - 1)

      console.log('Edge Function response:', { data, error: fnError })

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
      setError('Erreur lors de l\'analyse. Veuillez réessayer.')
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
      setError('Le titre est requis')
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
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
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

  // Render based on step
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 md:p-8">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Scanner</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          {step === 'capture' && 'Capturer une œuvre'}
          {step === 'analyzing' && 'Analyse en cours'}
          {step === 'form' && 'Détails de l\'œuvre'}
          {step === 'saving' && 'Enregistrement...'}
        </h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step: Capture */}
      {step === 'capture' && (
        <div className="px-4">
          {/* Image preview or camera */}
          <div className="aspect-[3/4] max-w-md mx-auto relative rounded-xl overflow-hidden bg-surface-dark">
            {imageData ? (
              <>
                <img src={imageData} alt="Capture" className="w-full h-full object-cover" />
                <button
                  onClick={resetCapture}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </>
            ) : cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Focus brackets */}
                <div className="absolute inset-8 pointer-events-none">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-6xl text-white/20 mb-4">photo_camera</span>
                <p className="text-white/60 mb-2">Capturez une œuvre d'art</p>
                <p className="text-white/40 text-sm">
                  Utilisez l'appareil photo ou importez depuis votre galerie
                </p>
              </div>
            )}
          </div>

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

          {/* Buttons */}
          <div className="max-w-md mx-auto mt-6 space-y-3">
            {imageData ? (
              <>
                <button
                  onClick={analyzeImage}
                  className="w-full bg-primary text-bg-dark font-semibold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Analyser avec l'IA
                </button>
                <button
                  onClick={skipToForm}
                  className="w-full border border-white/20 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:border-white/40 transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Remplir manuellement
                </button>
              </>
            ) : cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="w-full bg-primary text-bg-dark font-semibold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                  Prendre la photo
                </button>
                <button
                  onClick={stopCamera}
                  className="w-full border border-white/20 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:border-white/40 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                  Annuler
                </button>
              </>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={startCamera}
                  className="flex-1 bg-primary text-bg-dark font-semibold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                  Caméra
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border border-white/20 text-white py-4 rounded-lg flex items-center justify-center gap-2 hover:border-white/40 transition-colors"
                >
                  <span className="material-symbols-outlined">image</span>
                  Galerie
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="px-4">
          <div className="max-w-md mx-auto">
            {/* Image preview */}
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-dark mb-6">
              <img src={imageData} alt="Analyse" className="w-full h-full object-cover opacity-50" />
            </div>

            {/* Progress */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-white font-medium">{ANALYSIS_STEPS[analysisStep]}</p>
                  <p className="text-white/40 text-sm">Étape {analysisStep + 1}/{ANALYSIS_STEPS.length}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Form */}
      {step === 'form' && (
        <div className="px-4">
          <div className="max-w-2xl mx-auto">
            {/* Image preview */}
            {imageData && (
              <div className="aspect-video max-w-sm mx-auto rounded-xl overflow-hidden bg-surface-dark mb-6">
                <img src={imageData} alt="Œuvre" className="w-full h-full object-contain" />
              </div>
            )}

            {/* Form */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold italic text-primary mb-4">
                  Informations de base
                </h3>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                    placeholder="Titre de l'œuvre"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Artiste</label>
                    <input
                      type="text"
                      value={formData.artist}
                      onChange={(e) => updateField('artist', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="Nom de l'artiste"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Dates de l'artiste</label>
                    <input
                      type="text"
                      value={formData.artist_dates}
                      onChange={(e) => updateField('artist_dates', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="1853-1890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Année</label>
                    <input
                      type="text"
                      value={formData.year}
                      onChange={(e) => updateField('year', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="1889"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Période</label>
                    <input
                      type="text"
                      value={formData.period}
                      onChange={(e) => updateField('period', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="Post-impressionnisme"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Style</label>
                    <input
                      type="text"
                      value={formData.style}
                      onChange={(e) => updateField('style', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="Expressionnisme"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold italic text-primary mb-4">
                  Détails techniques
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Technique / Medium</label>
                    <input
                      type="text"
                      value={formData.medium}
                      onChange={(e) => updateField('medium', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="Huile sur toile"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Dimensions</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => updateField('dimensions', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="73,7 × 92,1 cm"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold italic text-primary mb-4">
                  Localisation
                </h3>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Musée / Collection</label>
                  <MuseumAutocomplete
                    value={formData.museum}
                    onChange={(value) => updateField('museum', value)}
                    onMuseumSelect={handleMuseumSelect}
                    placeholder="Musée d'Orsay"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Ville</label>
                    <input
                      type="text"
                      value={formData.museum_city}
                      onChange={(e) => updateField('museum_city', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Pays</label>
                    <input
                      type="text"
                      value={formData.museum_country}
                      onChange={(e) => updateField('museum_country', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold italic text-primary mb-4">
                  Description
                </h3>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Description de l'œuvre</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none"
                    placeholder="Décrivez l'œuvre..."
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Note curatoriale</label>
                  <textarea
                    value={formData.curatorial_note}
                    onChange={(e) => updateField('curatorial_note', e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none font-display italic"
                    placeholder="Votre réflexion personnelle sur cette œuvre..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pb-8">
                <button
                  onClick={resetCapture}
                  className="flex-1 border border-white/20 text-white py-4 rounded-lg flex items-center justify-center gap-2 hover:border-white/40 transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Retour
                </button>
                <button
                  onClick={saveArtwork}
                  className="flex-1 bg-primary text-bg-dark font-semibold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
                >
                  <span className="material-symbols-outlined">save</span>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Saving */}
      {step === 'saving' && (
        <div className="px-4 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white font-medium">Enregistrement en cours...</p>
            <p className="text-white/40 text-sm">Veuillez patienter</p>
          </div>
        </div>
      )}
    </div>
  )
}
