/**
 * Artwork Analysis Service
 * Handles intelligent fusion of cartel OCR data + AI enrichment
 *
 * Data priority:
 * 1. Cartel OCR (factual, from museum label)
 * 2. AI enrichment (identified, contextual)
 * 3. Manual entry (user input)
 */

import { supabase } from '../lib/supabase'
import { extractText, parseCartelText } from '../utils/ocrCartel'
import { getDominantColor } from '../utils/colorExtractor'

/**
 * Analyze artwork with optional cartel and AI enrichment
 * @param {Object} options Analysis options
 * @param {string} options.artworkImageData Base64 data URL of artwork image
 * @param {string} [options.cartelImageData] Base64 data URL of cartel image (optional)
 * @param {boolean} [options.useAiEnrichment=true] Whether to use AI enrichment
 * @param {Function} [options.onProgress] Progress callback (step, total, message)
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeArtwork({
  artworkImageData,
  cartelImageData = null,
  useAiEnrichment = true,
  onProgress = () => {}
}) {
  const steps = []
  let currentStep = 0

  // Define steps based on options
  steps.push({ key: 'color', message: 'Extraction des couleurs...' })
  if (cartelImageData) {
    steps.push({ key: 'ocr', message: 'Lecture du cartel...' })
  }
  if (useAiEnrichment) {
    steps.push({ key: 'ai', message: 'Analyse IA...' })
  }
  steps.push({ key: 'merge', message: 'Fusion des données...' })

  const updateProgress = (message) => {
    currentStep++
    onProgress(currentStep, steps.length, message || steps[currentStep - 1]?.message)
  }

  try {
    // Prepare parallel tasks
    const tasks = []

    // 1. Color extraction (always run)
    tasks.push(
      getDominantColor(artworkImageData)
        .then(result => ({ type: 'color', data: result }))
        .catch(() => ({ type: 'color', data: { hex: null } }))
    )

    // 2. OCR on cartel (if provided)
    if (cartelImageData) {
      tasks.push(
        runCartelOcr(cartelImageData)
          .then(result => ({ type: 'ocr', data: result }))
          .catch(() => ({ type: 'ocr', data: null }))
      )
    }

    // 3. AI enrichment (if enabled)
    if (useAiEnrichment) {
      const base64Data = artworkImageData.replace(/^data:image\/\w+;base64,/, '')
      tasks.push(
        supabase.functions.invoke('enrich-artwork', {
          body: { imageBase64: base64Data }
        })
          .then(result => ({ type: 'ai', data: result.data?.data || result.data }))
          .catch(() => ({ type: 'ai', data: null }))
      )
    }

    // Run all tasks in parallel
    const results = await Promise.all(tasks)

    // Extract results by type
    const colorResult = results.find(r => r.type === 'color')?.data
    const ocrResult = results.find(r => r.type === 'ocr')?.data
    const aiResult = results.find(r => r.type === 'ai')?.data

    updateProgress('Fusion des données...')

    // Merge all data sources with intelligent priority
    const mergedData = mergeArtworkData({
      ocrData: ocrResult,
      aiData: aiResult,
      colorData: colorResult
    })

    return {
      success: true,
      data: mergedData,
      sources: {
        hasOcr: !!ocrResult,
        hasAi: !!aiResult,
        hasColor: !!colorResult?.hex
      }
    }
  } catch (error) {
    console.error('Artwork analysis failed:', error)
    return {
      success: false,
      error: error.message,
      data: getEmptyArtworkData()
    }
  }
}

/**
 * Run OCR on cartel image
 * @param {string} cartelImageData Base64 data URL
 * @returns {Promise<Object|null>}
 */
async function runCartelOcr(cartelImageData) {
  try {
    const ocrResult = await extractText(cartelImageData)

    if (ocrResult.confidence > 40) {
      const parsed = parseCartelText(ocrResult.text)
      return {
        ...parsed,
        rawText: ocrResult.text,
        confidence: ocrResult.confidence
      }
    }
    return null
  } catch (err) {
    console.log('OCR failed:', err)
    return null
  }
}

/**
 * Merge artwork data from multiple sources with intelligent priority
 * Priority: OCR (factual) > AI (enriched) > empty
 *
 * @param {Object} sources Data sources
 * @param {Object} [sources.ocrData] OCR-extracted data from cartel
 * @param {Object} [sources.aiData] AI-enriched data
 * @param {Object} [sources.colorData] Color extraction data
 * @returns {Object} Merged artwork data
 */
export function mergeArtworkData({ ocrData = {}, aiData = {}, colorData = {} }) {
  // OCR data is factual (from museum label) - highest priority for basic facts
  // AI data is identified/enriched - good for context and missing info

  return {
    // Basic identification - prefer OCR (museum's official info)
    title: ocrData?.title || aiData?.title || '',
    artist: ocrData?.artist || aiData?.artist || '',
    artist_dates: aiData?.artist_dates || '', // Usually not on cartel, AI better
    year: ocrData?.year || aiData?.year || '',

    // Style/period - AI is better at this
    period: aiData?.period || '',
    style: aiData?.style || '',

    // Technical details - prefer OCR (official specs)
    medium: ocrData?.medium || aiData?.medium || '',
    dimensions: ocrData?.dimensions || aiData?.dimensions || '',

    // Location - prefer OCR if museum visible in cartel
    museum: ocrData?.museum || aiData?.museum || '',
    museum_city: aiData?.museum_city || '',
    museum_country: aiData?.museum_country || '',

    // Description - merge both sources
    description: buildDescription(ocrData, aiData),

    // Curatorial note - 100% AI generated
    curatorial_note: aiData?.curatorial_note || '',

    // Color
    dominant_color: colorData?.hex || null,

    // Cartel data preservation
    cartel_raw_text: ocrData?.rawText || '',
    cartel_image_url: null // Set during save
  }
}

/**
 * Build description by intelligently combining OCR and AI content
 * @param {Object} ocrData OCR data
 * @param {Object} aiData AI data
 * @returns {string}
 */
function buildDescription(ocrData, aiData) {
  const parts = []

  // Add cartel-derived description first (factual, from museum)
  if (ocrData?.description) {
    parts.push(ocrData.description)
  }

  // Add AI description if different and valuable
  if (aiData?.description) {
    // Don't duplicate if similar
    if (!ocrData?.description || !isSimilarText(ocrData.description, aiData.description)) {
      parts.push(aiData.description)
    }
  }

  return parts.join('\n\n')
}

/**
 * Check if two texts are similar (simple comparison)
 * @param {string} text1
 * @param {string} text2
 * @returns {boolean}
 */
function isSimilarText(text1, text2) {
  if (!text1 || !text2) return false

  // Normalize texts
  const normalize = (t) => t.toLowerCase().replace(/\s+/g, ' ').trim()
  const n1 = normalize(text1)
  const n2 = normalize(text2)

  // Check if one contains the other (80% threshold)
  if (n1.includes(n2.substring(0, Math.floor(n2.length * 0.8)))) return true
  if (n2.includes(n1.substring(0, Math.floor(n1.length * 0.8)))) return true

  return false
}

/**
 * Get empty artwork data structure
 * @returns {Object}
 */
export function getEmptyArtworkData() {
  return {
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
  }
}

/**
 * Validate artwork data (check required fields)
 * @param {Object} data Artwork data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateArtworkData(data) {
  const errors = []

  if (!data.title?.trim()) {
    errors.push('Le titre est requis')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  analyzeArtwork,
  mergeArtworkData,
  getEmptyArtworkData,
  validateArtworkData
}
