import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import MuseumAutocomplete from '../components/MuseumAutocomplete'
import Loader from '../components/ui/Loader'
import BatchScanMode from '../components/scan/BatchScanMode'
import CropPreview from '../components/scan/CropPreview'
import { detectArtworkBounds, applyCrop } from '../utils/autoCrop'
import { extractText, parseCartelText } from '../utils/ocrCartel'
import { getDominantColor } from '../utils/colorExtractor'

/**
 * Scanner Workflow States:
 * 1. artwork - Capture/select artwork photo
 * 2. cartel-prompt - Ask if user wants to scan cartel
 * 3. cartel-capture - Capture cartel photo
 * 4. ai-prompt - Ask if user wants AI enrichment
 * 5. analyzing - Processing (OCR + AI)
 * 6. form - Final form for review/edit
 */

const WORKFLOW_STEPS = [
  { key: 'artwork', label: 'Œuvre', icon: 'image' },
  { key: 'cartel', label: 'Cartel', icon: 'badge' },
  { key: 'enrichment', label: 'Enrichir', icon: 'auto_awesome' },
  { key: 'save', label: 'Enregistrer', icon: 'check' }
]

const ANALYSIS_STEPS = [
  'Analyse de l\'image...',
  'Lecture du cartel...',
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
  const cartelFileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Workflow state
  const [step, setStep] = useState('artwork') // artwork, cartel-prompt, cartel-capture, ai-prompt, analyzing, form, saving
  const [scanMode, setScanMode] = useState(SCAN_MODES.SINGLE)

  // Artwork image states
  const [artworkImageData, setArtworkImageData] = useState(null)
  const [artworkOriginalData, setArtworkOriginalData] = useState(null)
  const [artworkFile, setArtworkFile] = useState(null)

  // Cartel image states
  const [cartelImageData, setCartelImageData] = useState(null)
  const [cartelFile, setCartelFile] = useState(null)
  const [cartelRawText, setCartelRawText] = useState('')

  // Camera states
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraTarget, setCameraTarget] = useState('artwork') // artwork or cartel

  // Crop states
  const [cropBounds, setCropBounds] = useState(null)
  const [showCropPreview, setShowCropPreview] = useState(false)
  const [autoCropEnabled, setAutoCropEnabled] = useState(true)

  // Analysis states
  const [analysisStep, setAnalysisStep] = useState(0)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [useAiEnrichment, setUseAiEnrichment] = useState(true)

  // UI states
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
    curatorial_note: '',
    dominant_color: null,
    cartel_raw_text: '',
    cartel_image_url: null
  })

  // Current workflow step index (for progress indicator)
  const currentStepIndex = (() => {
    switch (step) {
      case 'artwork': return 0
      case 'cartel-prompt':
      case 'cartel-capture': return 1
      case 'ai-prompt':
      case 'analyzing': return 2
      case 'form':
      case 'saving': return 3
      default: return 0
    }
  })()

  // Auto-start camera on mount
  useEffect(() => {
    if (step === 'artwork' && !artworkImageData) {
      startCamera('artwork')
    }
    return () => stopCamera()
  }, [])

  // ========== CAMERA FUNCTIONS ==========

  async function startCamera(target = 'artwork') {
    try {
      setCameraTarget(target)
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

    if (cameraTarget === 'artwork') {
      setArtworkOriginalData(dataUrl)
      setArtworkImageData(dataUrl)

      canvas.toBlob((blob) => {
        const file = new File([blob], `artwork-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setArtworkFile(file)
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
    } else if (cameraTarget === 'cartel') {
      setCartelImageData(dataUrl)

      canvas.toBlob((blob) => {
        const file = new File([blob], `cartel-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCartelFile(file)
      }, 'image/jpeg', 0.9)

      stopCamera()
    }
  }

  async function handleFileSelect(e, target = 'artwork') {
    const file = e.target.files?.[0]
    if (!file) return

    stopCamera()

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result

      if (target === 'artwork') {
        setArtworkOriginalData(dataUrl)
        setArtworkImageData(dataUrl)
        setArtworkFile(file)

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
      } else if (target === 'cartel') {
        setCartelImageData(dataUrl)
        setCartelFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  // ========== CROP FUNCTIONS ==========

  function handleCropConfirm(bounds) {
    if (artworkOriginalData && bounds) {
      const img = new Image()
      img.onload = () => {
        const croppedDataUrl = applyCrop(img, bounds)
        setArtworkImageData(croppedDataUrl)

        // Create new file from cropped image
        fetch(croppedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setArtworkFile(file)
          })
      }
      img.src = artworkOriginalData
    }
    setShowCropPreview(false)
  }

  function handleCropCancel() {
    setCropBounds(null)
    setShowCropPreview(false)
  }

  function openCropPreview() {
    if (artworkOriginalData) {
      const img = new Image()
      img.onload = async () => {
        const bounds = await detectArtworkBounds(img)
        setCropBounds(bounds)
        setShowCropPreview(true)
      }
      img.src = artworkOriginalData
    }
  }

  // ========== WORKFLOW NAVIGATION ==========

  function proceedToCartelPrompt() {
    setStep('cartel-prompt')
  }

  function handleCartelYes() {
    setStep('cartel-capture')
    startCamera('cartel')
  }

  function handleCartelNo() {
    setStep('ai-prompt')
  }

  function proceedToAiPrompt() {
    stopCamera()
    setStep('ai-prompt')
  }

  function handleAiYes() {
    setUseAiEnrichment(true)
    startAnalysis()
  }

  function handleAiNo() {
    setUseAiEnrichment(false)
    startAnalysis()
  }

  // ========== ANALYSIS ==========

  async function startAnalysis() {
    setStep('analyzing')
    setAnalysisStep(0)
    setError('')

    try {
      const progressInterval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev))
      }, 800)

      // Prepare parallel tasks
      const tasks = []

      // 1. Color extraction (always)
      tasks.push(
        getDominantColor(artworkImageData).catch(() => ({ hex: null }))
      )

      // 2. OCR on cartel (if we have cartel image)
      if (cartelImageData) {
        tasks.push(runCartelOcr())
      } else {
        tasks.push(Promise.resolve(null))
      }

      // 3. AI enrichment (if enabled)
      if (useAiEnrichment) {
        const base64Data = artworkImageData.replace(/^data:image\/\w+;base64,/, '')
        tasks.push(
          supabase.functions.invoke('enrich-artwork', {
            body: { imageBase64: base64Data }
          })
        )
      } else {
        tasks.push(Promise.resolve({ data: null }))
      }

      const [colorResult, ocrResult, aiResult] = await Promise.all(tasks)

      clearInterval(progressInterval)
      setAnalysisStep(ANALYSIS_STEPS.length - 1)

      // Process AI result
      let aiData = {}
      if (aiResult?.data?.data || aiResult?.data) {
        aiData = aiResult.data?.data || aiResult.data || {}
      }

      // Process OCR result
      let ocrData = {}
      if (ocrResult) {
        ocrData = ocrResult
        setCartelRawText(ocrResult.rawText || '')
      }

      // Merge all data sources
      // Priority: OCR (factual) > AI (enriched) > empty
      const mergedData = {
        title: ocrData.title || aiData.title || '',
        artist: ocrData.artist || aiData.artist || '',
        artist_dates: aiData.artist_dates || '',
        year: ocrData.year || aiData.year || '',
        period: aiData.period || '',
        style: aiData.style || '',
        medium: ocrData.medium || aiData.medium || '',
        dimensions: ocrData.dimensions || aiData.dimensions || '',
        museum: ocrData.museum || aiData.museum || '',
        museum_city: aiData.museum_city || '',
        museum_country: aiData.museum_country || '',
        description: buildDescription(ocrData, aiData),
        curatorial_note: aiData.curatorial_note || '',
        dominant_color: colorResult?.hex || null,
        cartel_raw_text: ocrResult?.rawText || '',
        cartel_image_url: null // Will be set on save if cartelFile exists
      }

      setFormData(mergedData)
      setStep('form')
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Erreur d\'analyse. Veuillez réessayer.')
      setStep('ai-prompt')
    }
  }

  // Build description from cartel + AI
  function buildDescription(ocrData, aiData) {
    const parts = []

    // Add OCR-derived description first (factual)
    if (ocrData.description) {
      parts.push(ocrData.description)
    }

    // Add AI description
    if (aiData.description && aiData.description !== ocrData.description) {
      parts.push(aiData.description)
    }

    return parts.join('\n\n')
  }

  async function runCartelOcr() {
    try {
      const ocrResult = await extractText(cartelImageData, setOcrProgress)

      if (ocrResult.confidence > 40) {
        const parsed = parseCartelText(ocrResult.text)
        return {
          ...parsed,
          rawText: ocrResult.text
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

  // ========== SAVE ==========

  async function saveArtwork() {
    if (!formData.title.trim()) {
      setError('Le titre est requis')
      return
    }

    setStep('saving')
    setError('')

    try {
      let imageUrl = null
      let cartelImageUrl = null
      let museumId = formData.museum_id

      // Upload artwork image
      if (artworkFile) {
        const fileExt = artworkFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, artworkFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('artworks')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Upload cartel image if exists
      if (cartelFile) {
        const fileExt = cartelFile.name.split('.').pop()
        const fileName = `${user.id}/cartel-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, cartelFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('artworks')
            .getPublicUrl(fileName)
          cartelImageUrl = publicUrl
        }
      }

      // Find or create museum
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
          dominant_color: formData.dominant_color || null,
          cartel_raw_text: formData.cartel_raw_text || null,
          cartel_image_url: cartelImageUrl
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

  // ========== RESET ==========

  function resetAll() {
    setArtworkImageData(null)
    setArtworkOriginalData(null)
    setArtworkFile(null)
    setCartelImageData(null)
    setCartelFile(null)
    setCartelRawText('')
    setCropBounds(null)
    setShowCropPreview(false)
    setOcrProgress(0)
    setStep('artwork')
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
      dominant_color: null,
      cartel_raw_text: '',
      cartel_image_url: null
    })
    setError('')
    startCamera('artwork')
  }

  function resetCartel() {
    setCartelImageData(null)
    setCartelFile(null)
    startCamera('cartel')
  }

  // ========== RENDER HELPERS ==========

  // Progress indicator component
  function ProgressIndicator() {
    return (
      <div className="flex items-center justify-center gap-1 py-3">
        {WORKFLOW_STEPS.map((ws, index) => (
          <div key={ws.key} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                index < currentStepIndex
                  ? 'bg-accent text-black'
                  : index === currentStepIndex
                    ? 'bg-accent/20 text-accent border-2 border-accent'
                    : 'bg-white/10 text-white/40'
              }`}
            >
              {index < currentStepIndex ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                <span className="material-symbols-outlined text-sm">{ws.icon}</span>
              )}
            </div>
            {index < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-all ${
                  index < currentStepIndex ? 'bg-accent' : 'bg-white/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // ========== CONDITIONAL RENDERS ==========

  // Show crop preview overlay
  if (showCropPreview && artworkOriginalData && cropBounds) {
    return (
      <CropPreview
        imageUrl={artworkOriginalData}
        initialBounds={cropBounds}
        onCropChange={setCropBounds}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )
  }

  // Show batch mode
  if (scanMode === SCAN_MODES.BATCH) {
    return <BatchScanMode onExit={() => setScanMode(SCAN_MODES.SINGLE)} />
  }

  // ========== STEP 1: ARTWORK CAPTURE ==========
  if (step === 'artwork') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, 'artwork')}
          className="hidden"
        />

        {/* Camera / Image View */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {artworkImageData ? (
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img
                src={artworkImageData}
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
          <div className="absolute top-0 inset-x-0 p-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <Link
                to="/collection"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </Link>

              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-accent font-medium">
                  Étape 1/4
                </p>
                <p className="text-white text-sm font-medium">
                  Photographier l'œuvre
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

            <ProgressIndicator />
          </div>

          {/* Viewfinder */}
          {!artworkImageData && cameraActive && (
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
            <div className="absolute top-32 inset-x-4 bg-danger/20 backdrop-blur-sm border border-danger/50 text-white px-4 py-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          {/* Action buttons when image captured */}
          {artworkImageData && (
            <div className="absolute top-32 right-4 flex flex-col gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reprendre
              </button>
              {artworkOriginalData && (
                <button
                  onClick={openCropPreview}
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
          {artworkImageData ? (
            <div className="px-6 space-y-3">
              <button
                onClick={proceedToCartelPrompt}
                className="btn btn-primary w-full py-4 rounded-full"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                Continuer
              </button>

              {/* Auto-crop toggle */}
              <div className="flex items-center justify-center gap-4 text-white/60 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCropEnabled}
                    onChange={(e) => setAutoCropEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  Auto-crop activé
                </label>
              </div>
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

  // ========== STEP 2A: CARTEL PROMPT ==========
  if (step === 'cartel-prompt') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={artworkImageData} alt="Background" className="w-full h-full object-cover opacity-20 blur-sm" />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setStep('artwork')}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">
                Étape 2/4
              </p>
              <p className="text-white text-sm font-medium">
                Scanner le cartel
              </p>
            </div>

            <div className="w-10" />
          </div>

          <ProgressIndicator />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-32 h-32 mb-8 rounded-2xl bg-accent/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-accent">badge</span>
          </div>

          <h2 className="font-display text-2xl italic text-white text-center mb-4">
            Souhaitez-vous scanner le cartel ?
          </h2>

          <p className="text-white/60 text-center text-sm mb-8 max-w-sm">
            Le cartel (étiquette à côté de l'œuvre) contient des informations précieuses : titre, artiste, date, technique...
          </p>

          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={handleCartelNo}
              className="btn btn-ghost flex-1 py-4"
            >
              <span className="material-symbols-outlined">close</span>
              Non, passer
            </button>
            <button
              onClick={handleCartelYes}
              className="btn btn-primary flex-1 py-4"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Oui, scanner
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== STEP 2B: CARTEL CAPTURE ==========
  if (step === 'cartel-capture') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={cartelFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, 'cartel')}
          className="hidden"
        />

        {/* Camera / Image View */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {cartelImageData ? (
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img
                src={cartelImageData}
                alt="Cartel"
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
          <div className="absolute top-0 inset-x-0 p-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => {
                  stopCamera()
                  setStep('cartel-prompt')
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>

              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-accent font-medium">
                  Étape 2/4
                </p>
                <p className="text-white text-sm font-medium">
                  Photographier le cartel
                </p>
              </div>

              <div className="w-10" />
            </div>

            <ProgressIndicator />
          </div>

          {/* Viewfinder for cartel - horizontal rectangle */}
          {!cartelImageData && cameraActive && (
            <div className="absolute inset-x-8 top-1/3 bottom-1/3 pointer-events-none">
              <div className="w-full h-full border-2 border-accent/50 rounded-lg">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-accent" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-accent" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-accent" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-accent" />
              </div>
              <p className="absolute -bottom-8 left-0 right-0 text-center text-white/60 text-xs">
                Cadrez le cartel dans le rectangle
              </p>
            </div>
          )}

          {/* Action buttons when cartel captured */}
          {cartelImageData && (
            <div className="absolute top-32 right-4 flex flex-col gap-2">
              <button
                onClick={resetCartel}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reprendre
              </button>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 inset-x-0 pb-8 pt-4">
          {cartelImageData ? (
            <div className="px-6 space-y-3">
              <button
                onClick={proceedToAiPrompt}
                className="btn btn-primary w-full py-4 rounded-full"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                Continuer
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around px-8">
              {/* Gallery */}
              <button
                onClick={() => cartelFileInputRef.current?.click()}
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

              {/* Skip button */}
              <button
                onClick={proceedToAiPrompt}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                title="Passer"
              >
                <span className="material-symbols-outlined text-2xl">skip_next</span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== STEP 3: AI ENRICHMENT PROMPT ==========
  if (step === 'ai-prompt') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={artworkImageData} alt="Background" className="w-full h-full object-cover opacity-20 blur-sm" />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setStep(cartelImageData ? 'cartel-capture' : 'cartel-prompt')}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">
                Étape 3/4
              </p>
              <p className="text-white text-sm font-medium">
                Enrichissement IA
              </p>
            </div>

            <div className="w-10" />
          </div>

          <ProgressIndicator />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-32 h-32 mb-8 rounded-2xl bg-accent/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-accent">auto_awesome</span>
          </div>

          <h2 className="font-display text-2xl italic text-white text-center mb-4">
            Enrichir avec l'IA ?
          </h2>

          <p className="text-white/60 text-center text-sm mb-4 max-w-sm">
            L'intelligence artificielle peut identifier l'œuvre, compléter les informations manquantes et rédiger un contexte historique.
          </p>

          {/* What we have so far */}
          <div className="bg-white/5 rounded-xl p-4 mb-8 w-full max-w-sm">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Données collectées</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-accent">
                <span className="material-symbols-outlined text-lg">image</span>
                <span>Photo œuvre</span>
              </div>
              {cartelImageData && (
                <div className="flex items-center gap-2 text-accent">
                  <span className="material-symbols-outlined text-lg">badge</span>
                  <span>Photo cartel</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={handleAiNo}
              className="btn btn-ghost flex-1 py-4"
            >
              <span className="material-symbols-outlined">edit</span>
              Saisie manuelle
            </button>
            <button
              onClick={handleAiYes}
              className="btn btn-primary flex-1 py-4"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              Analyser
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== ANALYZING VIEW ==========
  if (step === 'analyzing') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="absolute inset-0">
          <img src={artworkImageData} alt="Analyzing" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-4">
          <ProgressIndicator />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-8">
          {/* Image thumbnails */}
          <div className="flex gap-4 mb-8">
            <div className="w-32 h-40 rounded-xl overflow-hidden shadow-2xl relative">
              <img src={artworkImageData} alt="Artwork" className="w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden">
                <div className="scan-line" />
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">Œuvre</span>
              </div>
            </div>

            {cartelImageData && (
              <div className="w-32 h-40 rounded-xl overflow-hidden shadow-2xl relative">
                <img src={cartelImageData} alt="Cartel" className="w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden">
                  <div className="scan-line" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">Cartel</span>
                </div>
              </div>
            )}
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

  // ========== SAVING VIEW ==========
  if (step === 'saving') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Loader message="Enregistrement..." size="lg" />
      </div>
    )
  }

  // ========== FORM VIEW ==========
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-default">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setStep('ai-prompt')}
              className="flex items-center gap-2 text-secondary hover:text-accent transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Retour</span>
            </button>

            <h1 className="font-display text-lg italic text-accent">Confirmer l'œuvre</h1>

            <div className="w-20" />
          </div>

          <ProgressIndicator />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Images Preview */}
        <div className="mb-8 flex gap-4 justify-center">
          {artworkImageData && (
            <div className="flex-1 max-w-xs">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <img src={artworkImageData} alt="Artwork" className="w-full h-full object-contain bg-secondary" />
              </div>
              <p className="text-center text-secondary text-xs mt-2">Photo de l'œuvre</p>
            </div>
          )}

          {cartelImageData && (
            <div className="flex-1 max-w-xs">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <img src={cartelImageData} alt="Cartel" className="w-full h-full object-contain bg-secondary" />
              </div>
              <p className="text-center text-secondary text-xs mt-2">Photo du cartel</p>
            </div>
          )}
        </div>

        {/* Cartel raw text preview (if available) */}
        {formData.cartel_raw_text && (
          <div className="mb-6 card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-accent">badge</span>
              <span className="text-sm font-medium text-accent">Texte du cartel (OCR)</span>
            </div>
            <p className="text-secondary text-sm whitespace-pre-wrap font-mono bg-white/5 dark:bg-black/20 p-3 rounded-lg">
              {formData.cartel_raw_text}
            </p>
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
                <label className="label text-secondary mb-2 block">
                  Contexte historique
                  {useAiEnrichment && formData.curatorial_note && (
                    <span className="ml-2 text-xs text-accent">(Généré par IA)</span>
                  )}
                </label>
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
              onClick={resetAll}
              className="btn btn-outline flex-1"
            >
              <span className="material-symbols-outlined">refresh</span>
              Recommencer
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
