/**
 * Batch Scan Mode Component
 * Allows scanning multiple artworks during a museum visit
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getDominantColor } from '../../utils/colorExtractor'
import Loader from '../ui/Loader'

const BATCH_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  READY: 'ready',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error'
}

export default function BatchScanMode({ onExit }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [captures, setCaptures] = useState([]) // Array of captured images
  const [processingQueue, setProcessingQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [showQueue, setShowQueue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // Process queue in background
  useEffect(() => {
    const pendingItem = captures.find(c => c.status === BATCH_STATUS.PENDING)
    if (pendingItem && !captures.some(c => c.status === BATCH_STATUS.ANALYZING)) {
      processCapture(pendingItem.id)
    }
  }, [captures])

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
      setError('Accès à la caméra refusé')
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
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

    canvas.toBlob((blob) => {
      const file = new File([blob], `batch-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const newCapture = {
        id: Date.now(),
        imageData: dataUrl,
        file,
        status: BATCH_STATUS.PENDING,
        data: null,
        error: null
      }

      setCaptures(prev => [...prev, newCapture])
    }, 'image/jpeg', 0.9)
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newCapture = {
          id: Date.now() + Math.random(),
          imageData: e.target.result,
          file,
          status: BATCH_STATUS.PENDING,
          data: null,
          error: null
        }
        setCaptures(prev => [...prev, newCapture])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  async function processCapture(captureId) {
    setCaptures(prev => prev.map(c =>
      c.id === captureId ? { ...c, status: BATCH_STATUS.ANALYZING } : c
    ))

    try {
      const capture = captures.find(c => c.id === captureId)
      if (!capture) return

      const base64Data = capture.imageData.replace(/^data:image\/\w+;base64,/, '')

      // Call AI enrichment
      const { data, error: fnError } = await supabase.functions.invoke('enrich-artwork', {
        body: { imageBase64: base64Data }
      })

      if (fnError) throw fnError

      const result = data.data || data

      // Extract dominant color
      let dominantColor = null
      try {
        const colorResult = await getDominantColor(capture.imageData)
        dominantColor = colorResult.hex
      } catch (e) {
        console.log('Color extraction failed:', e)
      }

      setCaptures(prev => prev.map(c =>
        c.id === captureId ? {
          ...c,
          status: BATCH_STATUS.READY,
          data: { ...result, dominant_color: dominantColor }
        } : c
      ))
    } catch (err) {
      console.error('Processing error:', err)
      setCaptures(prev => prev.map(c =>
        c.id === captureId ? {
          ...c,
          status: BATCH_STATUS.ERROR,
          error: err.message
        } : c
      ))
    }
  }

  function removeCapture(captureId) {
    setCaptures(prev => prev.filter(c => c.id !== captureId))
  }

  function retryCapture(captureId) {
    setCaptures(prev => prev.map(c =>
      c.id === captureId ? { ...c, status: BATCH_STATUS.PENDING, error: null } : c
    ))
  }

  async function saveAllArtworks() {
    const readyCaptures = captures.filter(c => c.status === BATCH_STATUS.READY)
    if (readyCaptures.length === 0) return

    setSaving(true)
    setError('')

    let savedCount = 0

    for (const capture of readyCaptures) {
      try {
        setCaptures(prev => prev.map(c =>
          c.id === capture.id ? { ...c, status: BATCH_STATUS.SAVING } : c
        ))

        // Upload image
        let imageUrl = null
        if (capture.file) {
          const fileExt = capture.file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('artworks')
            .upload(fileName, capture.file)

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('artworks')
              .getPublicUrl(fileName)
            imageUrl = publicUrl
          }
        }

        // Insert artwork
        const { error: insertError } = await supabase
          .from('artworks')
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            title: capture.data.title || 'Sans titre',
            artist: capture.data.artist || null,
            artist_dates: capture.data.artist_dates || null,
            year: capture.data.year || null,
            period: capture.data.period || null,
            style: capture.data.style || null,
            medium: capture.data.medium || null,
            dimensions: capture.data.dimensions || null,
            museum: capture.data.museum || null,
            museum_city: capture.data.museum_city || null,
            museum_country: capture.data.museum_country || null,
            description: capture.data.description || null,
            curatorial_note: capture.data.curatorial_note || null,
            dominant_color: capture.data.dominant_color || null
          })

        if (insertError) throw insertError

        setCaptures(prev => prev.map(c =>
          c.id === capture.id ? { ...c, status: BATCH_STATUS.SAVED } : c
        ))
        savedCount++
      } catch (err) {
        console.error('Save error:', err)
        setCaptures(prev => prev.map(c =>
          c.id === capture.id ? { ...c, status: BATCH_STATUS.ERROR, error: err.message } : c
        ))
      }
    }

    setSaving(false)

    if (savedCount > 0) {
      // Wait a bit then navigate
      setTimeout(() => {
        navigate('/collection')
      }, 1500)
    }
  }

  const pendingCount = captures.filter(c => c.status === BATCH_STATUS.PENDING).length
  const analyzingCount = captures.filter(c => c.status === BATCH_STATUS.ANALYZING).length
  const readyCount = captures.filter(c => c.status === BATCH_STATUS.READY).length
  const savedCount = captures.filter(c => c.status === BATCH_STATUS.SAVED).length
  const errorCount = captures.filter(c => c.status === BATCH_STATUS.ERROR).length

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />

        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-accent font-medium">
              Mode Visite
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              {captures.length} capture{captures.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Queue toggle */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white relative"
          >
            <span className="material-symbols-outlined">queue</span>
            {captures.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-xs font-bold text-black rounded-full flex items-center justify-center">
                {captures.length}
              </span>
            )}
          </button>
        </div>

        {/* Viewfinder */}
        {cameraActive && (
          <div className="absolute inset-16 md:inset-24 pointer-events-none">
            <div className="viewfinder-corner top-left border-t-2 border-l-2 border-accent" />
            <div className="viewfinder-corner top-right border-t-2 border-r-2 border-accent" />
            <div className="viewfinder-corner bottom-left border-b-2 border-l-2 border-accent" />
            <div className="viewfinder-corner bottom-right border-b-2 border-r-2 border-accent" />
          </div>
        )}

        {/* Processing indicator */}
        {(pendingCount > 0 || analyzingCount > 0) && (
          <div className="absolute top-20 inset-x-4 bg-accent/20 backdrop-blur-sm border border-accent/50 text-white px-4 py-3 rounded-xl text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Analyse en cours... {analyzingCount + pendingCount} restante{(analyzingCount + pendingCount) > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-20 inset-x-4 bg-danger/20 backdrop-blur-sm border border-danger/50 text-white px-4 py-3 rounded-xl text-center text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 pb-8 pt-4">
        <div className="flex items-center justify-around px-8">
          {/* Gallery */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
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
            <div className="relative w-20 h-20 rounded-full bg-white border-4 border-accent flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-full bg-accent" />
            </div>
          </button>

          {/* Save all */}
          <button
            onClick={saveAllArtworks}
            disabled={readyCount === 0 || saving}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              readyCount > 0 ? 'bg-accent text-black' : 'bg-white/10 text-white/50'
            }`}
          >
            {saving ? (
              <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-2xl">save</span>
            )}
          </button>
        </div>

        {/* Status bar */}
        {captures.length > 0 && (
          <div className="mt-4 px-8 flex items-center justify-center gap-4 text-xs text-white/60">
            {readyCount > 0 && <span className="text-green-400">{readyCount} prêt{readyCount > 1 ? 's' : ''}</span>}
            {(pendingCount + analyzingCount) > 0 && <span className="text-accent">{pendingCount + analyzingCount} en cours</span>}
            {errorCount > 0 && <span className="text-red-400">{errorCount} erreur{errorCount > 1 ? 's' : ''}</span>}
            {savedCount > 0 && <span className="text-blue-400">{savedCount} sauvegardé{savedCount > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="absolute inset-0 bg-black/90 z-20 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-display text-xl italic text-white">File d'attente</h2>
            <button
              onClick={() => setShowQueue(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {captures.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <span className="material-symbols-outlined text-4xl mb-2">photo_camera</span>
                <p>Aucune capture</p>
                <p className="text-sm mt-1">Prenez des photos pour les ajouter à la file</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {captures.map((capture) => (
                  <div
                    key={capture.id}
                    className="relative rounded-xl overflow-hidden bg-white/5"
                  >
                    <img
                      src={capture.imageData}
                      alt="Capture"
                      className="w-full aspect-square object-cover"
                    />

                    {/* Status overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      capture.status === BATCH_STATUS.SAVED ? 'bg-green-500/50' :
                      capture.status === BATCH_STATUS.ERROR ? 'bg-red-500/50' :
                      capture.status === BATCH_STATUS.ANALYZING ? 'bg-accent/30' :
                      'bg-black/30'
                    }`}>
                      {capture.status === BATCH_STATUS.PENDING && (
                        <span className="material-symbols-outlined text-white text-2xl">hourglass_empty</span>
                      )}
                      {capture.status === BATCH_STATUS.ANALYZING && (
                        <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
                      )}
                      {capture.status === BATCH_STATUS.READY && (
                        <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
                      )}
                      {capture.status === BATCH_STATUS.SAVING && (
                        <div className="animate-spin w-8 h-8 border-3 border-accent border-t-transparent rounded-full" />
                      )}
                      {capture.status === BATCH_STATUS.SAVED && (
                        <span className="material-symbols-outlined text-white text-3xl">cloud_done</span>
                      )}
                      {capture.status === BATCH_STATUS.ERROR && (
                        <span className="material-symbols-outlined text-white text-3xl">error</span>
                      )}
                    </div>

                    {/* Title (if analyzed) */}
                    {capture.data?.title && (
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs truncate">{capture.data.title}</p>
                        {capture.data.artist && (
                          <p className="text-white/60 text-xs truncate">{capture.data.artist}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {capture.status === BATCH_STATUS.ERROR && (
                        <button
                          onClick={() => retryCapture(capture.id)}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                      )}
                      {capture.status !== BATCH_STATUS.SAVED && capture.status !== BATCH_STATUS.SAVING && (
                        <button
                          onClick={() => removeCapture(capture.id)}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save all button */}
          {readyCount > 0 && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={saveAllArtworks}
                disabled={saving}
                className="btn btn-primary w-full"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Enregistrer {readyCount} œuvre{readyCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
