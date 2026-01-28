/**
 * Color Extractor utility
 * Uses ColorThief to extract dominant colors from artwork images
 */

import ColorThief from 'colorthief'

const colorThief = new ColorThief()

/**
 * Extract dominant color from image
 * @param {HTMLImageElement|string} source - Image element or URL
 * @returns {Promise<{hex: string, rgb: number[], name: string}>}
 */
export async function getDominantColor(source) {
  const img = await loadImage(source)

  try {
    const rgb = colorThief.getColor(img)
    const hex = rgbToHex(rgb)
    const name = getColorName(rgb)

    return { hex, rgb, name }
  } catch (error) {
    console.error('Error extracting color:', error)
    return { hex: '#888888', rgb: [136, 136, 136], name: 'Gris' }
  }
}

/**
 * Extract color palette from image
 * @param {HTMLImageElement|string} source - Image element or URL
 * @param {number} colorCount - Number of colors to extract (default: 5)
 * @returns {Promise<Array<{hex: string, rgb: number[], name: string}>>}
 */
export async function getColorPalette(source, colorCount = 5) {
  const img = await loadImage(source)

  try {
    const palette = colorThief.getPalette(img, colorCount)
    return palette.map(rgb => ({
      hex: rgbToHex(rgb),
      rgb,
      name: getColorName(rgb)
    }))
  } catch (error) {
    console.error('Error extracting palette:', error)
    return []
  }
}

/**
 * Load image from URL or return existing image element
 * @param {HTMLImageElement|string} source
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) {
      if (source.complete) {
        resolve(source)
      } else {
        source.onload = () => resolve(source)
        source.onerror = reject
      }
      return
    }

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = source
  })
}

/**
 * Convert RGB array to hex string
 * @param {number[]} rgb
 * @returns {string}
 */
function rgbToHex(rgb) {
  return '#' + rgb.map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Get color name from RGB values
 * @param {number[]} rgb
 * @returns {string}
 */
function getColorName(rgb) {
  const [r, g, b] = rgb

  // Calculate HSL for better color matching
  const hsl = rgbToHsl(r, g, b)
  const [h, s, l] = hsl

  // Check for grayscale first
  if (s < 15) {
    if (l < 20) return 'Noir'
    if (l < 40) return 'Gris foncé'
    if (l < 60) return 'Gris'
    if (l < 80) return 'Gris clair'
    return 'Blanc'
  }

  // Check for brown (low saturation orange/red)
  if (s < 40 && l < 50 && (h < 40 || h > 350)) {
    return 'Brun'
  }

  // Color based on hue
  if (h < 15 || h >= 345) return 'Rouge'
  if (h < 40) return l < 50 ? 'Brun' : 'Orange'
  if (h < 70) return 'Jaune'
  if (h < 150) return 'Vert'
  if (h < 200) return 'Cyan'
  if (h < 260) return 'Bleu'
  if (h < 290) return 'Violet'
  if (h < 345) return 'Rose'

  return 'Coloré'
}

/**
 * Convert RGB to HSL
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number[]} [h, s, l] where h is 0-360, s and l are 0-100
 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/**
 * Group colors by name for filtering
 */
export const COLOR_GROUPS = [
  { name: 'Rouge', colors: ['Rouge', 'Rose'] },
  { name: 'Orange', colors: ['Orange', 'Brun'] },
  { name: 'Jaune', colors: ['Jaune'] },
  { name: 'Vert', colors: ['Vert', 'Cyan'] },
  { name: 'Bleu', colors: ['Bleu', 'Cyan'] },
  { name: 'Violet', colors: ['Violet', 'Rose'] },
  { name: 'Neutre', colors: ['Noir', 'Gris', 'Gris foncé', 'Gris clair', 'Blanc', 'Brun'] }
]

/**
 * Get CSS gradient for a color palette
 * @param {Array<{hex: string}>} palette
 * @returns {string}
 */
export function getPaletteGradient(palette) {
  if (!palette || palette.length === 0) return 'linear-gradient(to right, #888, #888)'

  const colors = palette.map((c, i) => {
    const percent = (i / (palette.length - 1)) * 100
    return `${c.hex} ${percent}%`
  }).join(', ')

  return `linear-gradient(to right, ${colors})`
}

/**
 * Calculate color distance (for filtering)
 * @param {number[]} rgb1
 * @param {number[]} rgb2
 * @returns {number}
 */
export function colorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  )
}

export default {
  getDominantColor,
  getColorPalette,
  getColorName,
  COLOR_GROUPS,
  getPaletteGradient,
  colorDistance
}
