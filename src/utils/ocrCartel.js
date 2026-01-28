/**
 * OCR Cartel - Extract text from museum labels
 * Uses Tesseract.js for text recognition
 */

import Tesseract from 'tesseract.js'

let worker = null

/**
 * Initialize Tesseract worker
 */
async function getWorker() {
  if (!worker) {
    worker = await Tesseract.createWorker('fra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
  }
  return worker
}

/**
 * Extract text from an image
 * @param {string} imageSource - Image URL or base64 data
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractText(imageSource, onProgress) {
  try {
    const tesseractWorker = await getWorker()

    const result = await tesseractWorker.recognize(imageSource, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100))
        }
      }
    })

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words
    }
  } catch (error) {
    console.error('OCR Error:', error)
    return { text: '', confidence: 0, words: [] }
  }
}

/**
 * Parse museum label text to extract artwork information
 * @param {string} text - Raw OCR text
 * @returns {{title: string, artist: string, year: string, medium: string, dimensions: string}}
 */
export function parseCartelText(text) {
  const result = {
    title: '',
    artist: '',
    year: '',
    medium: '',
    dimensions: ''
  }

  if (!text) return result

  // Clean and split text into lines
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2)

  // Common patterns for artwork information
  const yearPattern = /\b(1[0-9]{3}|20[0-2][0-9])\b/
  const dimensionsPattern = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(cm|mm|m|in)?/i
  const datesPattern = /\(?\s*(1[0-9]{3})\s*[-–—]\s*(1[0-9]{3}|20[0-2][0-9])\s*\)?/
  const mediumPatterns = [
    /huile\s+sur\s+toile/i,
    /oil\s+on\s+canvas/i,
    /acrylique/i,
    /acrylic/i,
    /bronze/i,
    /marbre/i,
    /marble/i,
    /aquarelle/i,
    /watercolor/i,
    /pastel/i,
    /encre/i,
    /ink/i,
    /crayon/i,
    /pencil/i,
    /gravure/i,
    /lithographie/i,
    /photographie/i,
    /photography/i
  ]

  // Process each line
  lines.forEach((line, index) => {
    // Check for artist name with dates
    const datesMatch = line.match(datesPattern)
    if (datesMatch) {
      // This line likely contains artist name
      const artistName = line.replace(datesPattern, '').trim()
      if (artistName && !result.artist) {
        result.artist = cleanName(artistName)
      }
    }

    // Check for year
    const yearMatch = line.match(yearPattern)
    if (yearMatch && !result.year) {
      // Make sure it's not part of a date range (artist dates)
      if (!datesPattern.test(line)) {
        result.year = yearMatch[0]
      }
    }

    // Check for dimensions
    const dimMatch = line.match(dimensionsPattern)
    if (dimMatch && !result.dimensions) {
      result.dimensions = `${dimMatch[1]} × ${dimMatch[2]}${dimMatch[3] ? ' ' + dimMatch[3] : ' cm'}`
    }

    // Check for medium
    for (const pattern of mediumPatterns) {
      if (pattern.test(line) && !result.medium) {
        const match = line.match(pattern)
        if (match) {
          result.medium = capitalizeFirst(match[0])
        }
        break
      }
    }

    // First non-date, non-dimension line is likely the title
    if (index === 0 && !yearPattern.test(line) && !dimensionsPattern.test(line)) {
      result.title = cleanTitle(line)
    }

    // Second line might be artist if first was title
    if (index === 1 && !result.artist && !dimensionsPattern.test(line)) {
      // Check if it looks like a name (capitalized words)
      const words = line.split(/\s+/)
      const isName = words.every(w => /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/.test(w) || w.length < 3)
      if (isName || datesPattern.test(line)) {
        result.artist = cleanName(line.replace(datesPattern, '').trim())
      }
    }
  })

  return result
}

/**
 * Clean and format a title string
 */
function cleanTitle(text) {
  return text
    .replace(/[«»""]/g, '"')
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean and format a name string
 */
function cleanName(text) {
  return text
    .replace(/[,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Detect if a region of the image likely contains a cartel (museum label)
 * @param {HTMLImageElement} image
 * @returns {Promise<{detected: boolean, region: {x, y, width, height}|null}>}
 */
export async function detectCartelRegion(image) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height

    canvas.width = width
    canvas.height = height
    ctx.drawImage(image, 0, 0)

    // Cartels are usually:
    // - In the bottom third of the image
    // - Light colored (white/beige background)
    // - Rectangular

    // Check bottom third of image for light regions
    const bottomThird = ctx.getImageData(0, Math.floor(height * 0.6), width, Math.floor(height * 0.4))
    const data = bottomThird.data

    let lightPixels = 0
    const totalPixels = (bottomThird.width * bottomThird.height)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      // Check if pixel is light (likely paper/label)
      if (r > 200 && g > 200 && b > 200) {
        lightPixels++
      }
    }

    const lightRatio = lightPixels / totalPixels

    // If more than 5% of bottom third is light, there might be a cartel
    if (lightRatio > 0.05) {
      // Try to find the actual region
      // For now, return the bottom portion
      resolve({
        detected: true,
        region: {
          x: 0,
          y: Math.floor(height * 0.7),
          width: width,
          height: Math.floor(height * 0.3)
        },
        confidence: lightRatio
      })
    } else {
      resolve({ detected: false, region: null, confidence: 0 })
    }
  })
}

/**
 * Terminate the Tesseract worker
 */
export async function terminateWorker() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

export default {
  extractText,
  parseCartelText,
  detectCartelRegion,
  terminateWorker
}
