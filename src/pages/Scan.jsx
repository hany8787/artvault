import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import MuseumAutocomplete from '../components/MuseumAutocomplete'
import Loader from '../components/ui/Loader'
import BatchScanMode from '../components/scan/BatchScanMode'
import CropPreview from '../components/scan/CropPreview'
import { detectArtworkBounds, applyCrop } from '../utils/autoCrop'
import { extractText, parseCartelText, detectCartelRegion } from '../utils/ocrCartel'
import { getDominantColor } from '../utils/colorExtractor'

const ANALYSIS_STEPS = [
  'Analyse de l\'image...',
  'Identification de l\'œuvre...',
  'Reconnaissance de l\'artiste...',
  'Récupération des métadonnées...',
  'Rédaction du contexte historique...'
]

const SCAN_MODES = {
  SINGLE: 'single',
  BATCH: 'batch'
}

export default function Scan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // States
  const [step, setStep] = useState('capture') // capture, crop, analyzing, form, saving
  const [scanMode, setScanMode] = useState(SCAN_MODES.SINGLE)
  const [imageData, setImageData] = useState(null)
  const [originalImageData, setOriginalImageData] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [error, setError] = useState('')

  // Auto-crop states
  const [cropBounds, setCropBounds] = useState(null)
  const [autoCropEnabled, setAutoCropEnabled] = useState(true)
  const [showCropPreview, setShowCropPreview] = useState(false)

  // OCR states
  const [ocrEnabled, setOcrEnabled] = useState(true)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrData, setOcrData] = useState(null)

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
    curatorial_note: '',
    dominant_color: null
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
      setError('Accès à la caméra refusé. Veuillez autoriser l\'accès ou importer une photo.')
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setOriginalImageData(dataUrl)
    setImageData(dataUrl)

    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setImageFile(file)
    }, 'image/jpeg', 0.9)

    stopCamera()

    // Auto-detect crop bounds if enabled
    if (autoCropEnabled) {
      try {
        const bounds = await detectArtworkBounds(canvas)
        if (bounds.confidence > 0.5) {
          setCropBounds(bounds)
          setShowCropPreview(true)
        }
      } catch (err) {
        console.log('Auto-crop detection failed:', err)
      }
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    stopCamera()

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setOriginalImageData(dataUrl)
      setImageData(dataUrl)

      // Auto-detect crop bounds if enabled
      if (autoCropEnabled) {
        try {
          const img = new Image()
          img.onload = async () => {
            const bounds = await detectArtworkBounds(img)
            if (bounds.confidence > 0.5) {
              setCropBounds(bounds)
              setShowCropPreview(true)
            }
          }
          img.src = dataUrl
        } catch (err) {
          console.log('Auto-crop detection failed:', err)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  function resetCapture() {
    setImageData(null)
    setOriginalImageData(null)
    setImageFile(null)
    setCropBounds(null)
    setShowCropPreview(false)
    setOcrData(null)
    setOcrProgress(0)
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
      curatorial_note: '',
      dominant_color: null
    })
    setError('')
    startCamera()
  }

  // Handle crop confirmation
  function handleCropConfirm(bounds) {
    if (originalImageData && bounds) {
      const img = new Image()
      img.onload = () => {
        const croppedDataUrl = applyCrop(img, bounds)
        setImageData(croppedDataUrl)

        // Create new file from cropped image
        fetch(croppedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setImageFile(file)
          })
      }
      img.src = originalImageData
    }
    setShowCropPreview(false)
  }

  function handleCropCancel() {
    setCropBounds(null)
    setShowCropPreview(false)
  }

  // AI Analysis with OCR and color extraction
  async function analyzeImage() {
    setStep('analyzing')
    setAnalysisStep(0)
    setError('')

    try {
      const progressInterval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev))
      }, 1000)

      // Run AI analysis, OCR, and color extraction in parallel
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')

      const [aiResult, colorResult, ocrResult] = await Promise.all([
        // AI enrichment
        supabase.functions.invoke('enrich-artwork', {
          body: { imageBase64: base64Data }
        }),
        // Color extraction
        getDominantColor(imageData).catch(() => ({ hex: null })),
        // OCR (if enabled)
        ocrEnabled ? runOcrAnalysis() : Promise.resolve(null)
      ])

      clearInterval(progressInterval)
      setAnalysisStep(ANALYSIS_STEPS.length - 1)

      if (aiResult.error) throw aiResult.error

      const result = aiResult.data?.data || aiResult.data || {}

      // Merge OCR data with AI result (OCR can fill gaps)
      const mergedData = {
        title: result.title || ocrResult?.title || '',
        artist: result.artist || ocrResult?.artist || '',
        artist_dates: result.artist_dates || '',
        year: result.year || ocrResult?.year || '',
        period: result.period || '',
        style: result.style || '',
        medium: result.medium || ocrResult?.medium || '',
        dimensions: result.dimensions || ocrResult?.dimensions || '',
        museum: result.museum || '',
        museum_city: result.museum_city || '',
        museum_country: result.museum_country || '',
        description: result.description || '',
        curatorial_note: result.curatorial_note || '',
        dominant_color: colorResult?.hex || null
      }

      setFormData(mergedData)
      setStep('form')
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Erreur d\'analyse. Veuillez réessayer.')
      setStep('capture')
    }
  }

  // Run OCR analysis on the image
  async function runOcrAnalysis() {
    try {
      // First, detect if there's a cartel region
      const img = new Image()
      img.src = imageData

      await new Promise((resolve) => {
        if (img.complete) resolve()
        else img.onload = resolve
      })

      const cartelDetection = await detectCartelRegion(img)

      if (cartelDetection.detected && cartelDetection.region) {
        // Extract text from cartel region
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const region = cartelDetection.region

        canvas.width = region.width
        canvas.height = region.height
        ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

        const cartelImage = canvas.toDataURL('image/jpeg', 0.95)
        const ocrResult = await extractText(cartelImage, setOcrProgress)

        if (ocrResult.confidence > 50) {
          const parsed = parseCartelText(ocrResult.text)
          setOcrData(parsed)
          return parsed
        }
      }

      return null
    } catch (err) {
      console.log('OCR failed:', err)
      return null
    }
  }

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

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('artworks')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      if (formData.museum.trim() && !museumId) {
        const { data: foundMuseumId } = await supabase
          .rpc('find_or_create_museum', {
            p_name: formData.museum.trim(),
            p_city: formData.museum_city.trim() || null,
            p_country: formData.museum_country.trim() || null
          })

        if (foundMuseumId) {
          museumId = foundMuseumId
        }
      }

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
          curatorial_note: formData.curatorial_note.trim() || null,
          dominant_color: formData.dominant_color || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      navigate(`/artwork/${data.id}`)
    } catch (err) {
      console.error('Save error:', err)
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setStep('form')
    }
  }

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleMuseumSelect(museum) {
    setFormData(prev => ({
      ...prev,
      museum: museum.name,
      museum_id: museum.id,
      museum_city: museum.city || prev.museum_city,
      museum_country: museum.country || prev.museum_country
    }))
  }

  // Show crop preview if auto-crop detected
  if (showCropPreview && originalImageData && cropBounds) {
    return (
      <CropPreview
        imageUrl={originalImageData}
        initialBounds={cropBounds}
        onCropChange={setCropBounds}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )
  }

  // Show batch mode if selected
  if (scanMode === SCAN_MODES.BATCH) {
    return <BatchScanMode onExit={() => setScanMode(SCAN_MODES.SINGLE)} />
  }

  // CAPTURE VIEW
  if (step === 'capture') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Camera / Image View */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {imageData ? (
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img
                src={imageData}
                alt="Captured"
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
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
              <p className="text-xs uppercase tracking-widest text-accent font-medium">
                Scanner
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {imageData ? 'Prêt à analyser' : 'Cadrez l\'œuvre'}
              </p>
            </div>

            {/* Batch mode toggle */}
            <button
              onClick={() => setScanMode(SCAN_MODES.BATCH)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
              title="Mode visite (batch)"
            >
              <span className="material-symbols-outlined">burst_mode</span>
            </button>
          </div>

          {/* Viewfinder */}
          {!imageData && cameraActive && (
            <div className="absolute inset-16 md:inset-24 pointer-events-none">
              <div className="viewfinder-corner top-left border-t-2 border-l-2 border-accent" />
              <div className="viewfinder-corner top-right border-t-2 border-r-2 border-accent" />
              <div className="viewfinder-corner bottom-left border-b-2 border-l-2 border-accent" />
              <div className="viewfinder-corner bottom-right border-b-2 border-r-2 border-accent" />
              <div className="scan-line" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute top-20 inset-x-4 bg-danger/20 backdrop-blur-sm border border-danger/50 text-white px-4 py-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          {/* Action buttons when image captured */}
          {imageData && (
            <div className="absolute top-20 right-4 flex flex-col gap-2">
              <button
                onClick={resetCapture}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reprendre
              </button>
              {originalImageData && (
                <button
                  onClick={() => {
                    // Re-detect bounds for manual adjustment
                    const img = new Image()
                    img.onload = async () => {
                      const bounds = await detectArtworkBounds(img)
                      setCropBounds(bounds)
                      setShowCropPreview(true)
                    }
                    img.src = originalImageData
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">crop</span>
                  Recadrer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 inset-x-0 pb-8 pt-4">
          {imageData ? (
            <div className="px-6 space-y-3">
              <button
                onClick={analyzeImage}
                className="btn btn-primary w-full py-4 rounded-full"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Analyser avec l'IA
              </button>

              {/* Options row */}
              <div className="flex items-center justify-center gap-4 text-white/60 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ocrEnabled}
                    onChange={(e) => setOcrEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  OCR Cartel
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCropEnabled}
                    onChange={(e) => setAutoCropEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  Auto-crop
                </label>
              </div>

              <button
                onClick={skipToForm}
                className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined">edit</span>
                Saisir manuellement
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around px-8">
              {/* Gallery */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">photo_library</span>
              </button>

              {/* Capture */}
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse-soft scale-125" />
                <div className="relative w-20 h-20 rounded-full bg-white border-4 border-accent flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform group-disabled:opacity-50">
                  <div className="w-14 h-14 rounded-full bg-accent" />
                </div>
              </button>

              {/* Placeholder for symmetry */}
              <div className="w-14 h-14" />
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
        <div className="absolute inset-0">
          <img src={imageData} alt="Analyzing" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl mb-8 relative">
            <img src={imageData} alt="Artwork" className="w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="scan-line" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl italic text-white mb-2">
              {ANALYSIS_STEPS[analysisStep]}
            </h2>
            <p className="text-white/40 text-sm">
              Étape {analysisStep + 1} sur {ANALYSIS_STEPS.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {ANALYSIS_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= analysisStep ? 'bg-accent' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="w-64 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Loader message="Enregistrement..." size="lg" />
      </div>
    )
  }

  // FORM VIEW
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-default">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={resetCapture}
            className="flex items-center gap-2 text-secondary hover:text-accent transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Reprendre</span>
          </button>

          <h1 className="font-display text-lg italic text-accent">Nouvelle œuvre</h1>

          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Image Preview */}
        {imageData && (
          <div className="mb-8">
            <div className="aspect-[4/3] max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
              <img src={imageData} alt="Artwork" className="w-full h-full object-contain bg-secondary" />
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Essential Info */}
          <section className="card p-6">
            <h3 className="font-display text-xl italic text-accent mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">info</span>
              Informations essentielles
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label text-secondary mb-2 block">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="input"
                  placeholder="Titre de l'œuvre"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-secondary mb-2 block">Artiste</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => updateField('artist', e.target.value)}
                    className="input"
                    placeholder="Nom de l'artiste"
                  />
                </div>
                <div>
                  <label className="label text-secondary mb-2 block">Dates de l'artiste</label>
                  <input
                    type="text"
                    value={formData.artist_dates}
                    onChange={(e) => updateField('artist_dates', e.target.value)}
                    className="input"
                    placeholder="1853-1890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label text-secondary mb-2 block">Année</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => updateField('year', e.target.value)}
                    className="input"
                    placeholder="1889"
                  />
                </div>
                <div>
                  <label className="label text-secondary mb-2 block">Période</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => updateField('period', e.target.value)}
                    className="input"
                    placeholder="Post-impressionnisme"
                  />
                </div>
                <div>
                  <label className="label text-secondary mb-2 block">Style</label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) => updateField('style', e.target.value)}
                    className="input"
                    placeholder="Expressionnisme"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Technical Details */}
          <section className="card p-6">
            <h3 className="font-display text-xl italic text-accent mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">straighten</span>
              Détails techniques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-secondary mb-2 block">Technique / Medium</label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={(e) => updateField('medium', e.target.value)}
                  className="input"
                  placeholder="Huile sur toile"
                />
              </div>
              <div>
                <label className="label text-secondary mb-2 block">Dimensions</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => updateField('dimensions', e.target.value)}
                  className="input"
                  placeholder="73,7 × 92,1 cm"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="card p-6">
            <h3 className="font-display text-xl italic text-accent mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">museum</span>
              Localisation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label text-secondary mb-2 block">Musée / Collection</label>
                <MuseumAutocomplete
                  value={formData.museum}
                  onChange={(value) => updateField('museum', value)}
                  onMuseumSelect={handleMuseumSelect}
                  placeholder="Musée d'Orsay"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-secondary mb-2 block">Ville</label>
                  <input
                    type="text"
                    value={formData.museum_city}
                    onChange={(e) => updateField('museum_city', e.target.value)}
                    className="input"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="label text-secondary mb-2 block">Pays</label>
                  <input
                    type="text"
                    value={formData.museum_country}
                    onChange={(e) => updateField('museum_country', e.target.value)}
                    className="input"
                    placeholder="France"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="card p-6">
            <h3 className="font-display text-xl italic text-accent mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">description</span>
              Description
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label text-secondary mb-2 block">Description de l'œuvre</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="input textarea"
                  placeholder="Décrivez l'œuvre..."
                />
              </div>

              <div>
                <label className="label text-secondary mb-2 block">Contexte historique</label>
                <textarea
                  value={formData.curatorial_note}
                  onChange={(e) => updateField('curatorial_note', e.target.value)}
                  rows={3}
                  className="input textarea font-serif italic"
                  placeholder="Contexte historique et artistique de l'œuvre..."
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={resetCapture}
              className="btn btn-outline flex-1"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Reprendre
            </button>
            <button
              onClick={saveArtwork}
              className="btn btn-primary flex-1"
            >
              <span className="material-symbols-outlined">check</span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
