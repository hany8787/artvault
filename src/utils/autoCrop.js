/**
 * Auto-crop utility for artwork detection
 * Improved algorithm to detect artwork frames (golden, black, wooden)
 * and exclude wall context
 */

/**
 * Detect artwork edges and return crop coordinates
 * Uses multiple detection strategies for better accuracy
 * @param {HTMLImageElement|HTMLCanvasElement} source - Image source
 * @returns {Promise<{x: number, y: number, width: number, height: number, confidence: number}>}
 */
export async function detectArtworkBounds(source) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const width = source.naturalWidth || source.width
    const height = source.naturalHeight || source.height
    canvas.width = width
    canvas.height = height

    ctx.drawImage(source, 0, 0)

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Try multiple detection strategies and pick the best one
    const strategies = [
      () => detectByFrameColor(data, width, height),
      () => detectByEdgeContrast(data, width, height),
      () => detectByRectangleHeuristic(data, width, height)
    ]

    let bestResult = { x: 0, y: 0, width, height, confidence: 0 }

    for (const strategy of strategies) {
      try {
        const result = strategy()
        if (result.confidence > bestResult.confidence) {
          bestResult = result
        }
      } catch (e) {
        console.log('Strategy failed:', e)
      }
    }

    // If no good detection, return a centered crop (10% margin)
    if (bestResult.confidence < 0.3) {
      const margin = Math.min(width, height) * 0.1
      bestResult = {
        x: margin,
        y: margin,
        width: width - margin * 2,
        height: height - margin * 2,
        confidence: 0.2
      }
    }

    resolve(bestResult)
  })
}

/**
 * Detect frame by looking for common frame colors (gold, black, dark wood)
 */
function detectByFrameColor(data, width, height) {
  // Frame color signatures (HSL ranges)
  const frameColors = [
    { name: 'gold', hRange: [30, 55], sRange: [40, 100], lRange: [30, 70] },
    { name: 'black', hRange: [0, 360], sRange: [0, 20], lRange: [0, 20] },
    { name: 'darkWood', hRange: [15, 45], sRange: [20, 60], lRange: [15, 40] },
    { name: 'white', hRange: [0, 360], sRange: [0, 15], lRange: [85, 100] }
  ]

  // Sample edges to find frame pixels
  const sampleSize = 50
  const edgePixels = []

  // Sample top and bottom edges
  for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
    edgePixels.push(getPixelHSL(data, x, 5, width))
    edgePixels.push(getPixelHSL(data, x, height - 5, width))
  }

  // Sample left and right edges
  for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
    edgePixels.push(getPixelHSL(data, 5, y, width))
    edgePixels.push(getPixelHSL(data, width - 5, y, width))
  }

  // Determine dominant frame color
  let frameType = null
  let maxMatches = 0

  for (const frameColor of frameColors) {
    const matches = edgePixels.filter(p =>
      p.h >= frameColor.hRange[0] && p.h <= frameColor.hRange[1] &&
      p.s >= frameColor.sRange[0] && p.s <= frameColor.sRange[1] &&
      p.l >= frameColor.lRange[0] && p.l <= frameColor.lRange[1]
    ).length

    if (matches > maxMatches) {
      maxMatches = matches
      frameType = frameColor.name
    }
  }

  // If we found a frame color, scan inward to find the inner edge
  if (frameType && maxMatches > edgePixels.length * 0.3) {
    return findInnerBounds(data, width, height, frameType)
  }

  return { x: 0, y: 0, width, height, confidence: 0 }
}

/**
 * Find inner bounds by scanning inward from edges
 */
function findInnerBounds(data, width, height, frameType) {
  const maxScan = Math.min(width, height) * 0.25 // Max 25% of image

  // Scan from each edge
  let left = scanFromEdge(data, width, height, 'left', maxScan)
  let right = scanFromEdge(data, width, height, 'right', maxScan)
  let top = scanFromEdge(data, width, height, 'top', maxScan)
  let bottom = scanFromEdge(data, width, height, 'bottom', maxScan)

  // Apply some margin inside the detected frame
  const frameMargin = 5
  left = Math.min(left + frameMargin, width * 0.3)
  right = Math.max(right - frameMargin, width * 0.7)
  top = Math.min(top + frameMargin, height * 0.3)
  bottom = Math.max(bottom - frameMargin, height * 0.7)

  const cropWidth = right - left
  const cropHeight = bottom - top

  // Calculate confidence based on how much we cropped
  const cropRatio = (cropWidth * cropHeight) / (width * height)
  const confidence = cropRatio > 0.3 && cropRatio < 0.95 ? 0.7 : 0.3

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    confidence
  }
}

/**
 * Scan from an edge to find where content starts (color change)
 */
function scanFromEdge(data, width, height, direction, maxScan) {
  const samples = 20 // Number of scan lines
  const threshold = 30 // Color difference threshold

  if (direction === 'left' || direction === 'right') {
    const startX = direction === 'left' ? 0 : width - 1
    const stepX = direction === 'left' ? 1 : -1
    const transitions = []

    for (let i = 0; i < samples; i++) {
      const y = Math.floor((height / (samples + 1)) * (i + 1))
      let prevColor = getPixelRGB(data, startX, y, width)

      for (let offset = 0; offset < maxScan; offset++) {
        const x = startX + (offset * stepX)
        if (x < 0 || x >= width) break

        const color = getPixelRGB(data, x, y, width)
        const diff = colorDifference(prevColor, color)

        if (diff > threshold) {
          transitions.push(x)
          break
        }
        prevColor = color
      }
    }

    // Return median transition point
    if (transitions.length > samples * 0.3) {
      transitions.sort((a, b) => a - b)
      return transitions[Math.floor(transitions.length / 2)]
    }
    return direction === 'left' ? 0 : width
  }

  if (direction === 'top' || direction === 'bottom') {
    const startY = direction === 'top' ? 0 : height - 1
    const stepY = direction === 'top' ? 1 : -1
    const transitions = []

    for (let i = 0; i < samples; i++) {
      const x = Math.floor((width / (samples + 1)) * (i + 1))
      let prevColor = getPixelRGB(data, x, startY, width)

      for (let offset = 0; offset < maxScan; offset++) {
        const y = startY + (offset * stepY)
        if (y < 0 || y >= height) break

        const color = getPixelRGB(data, x, y, width)
        const diff = colorDifference(prevColor, color)

        if (diff > threshold) {
          transitions.push(y)
          break
        }
        prevColor = color
      }
    }

    if (transitions.length > samples * 0.3) {
      transitions.sort((a, b) => a - b)
      return transitions[Math.floor(transitions.length / 2)]
    }
    return direction === 'top' ? 0 : height
  }

  return 0
}

/**
 * Detect by edge contrast (Sobel edge detection improved)
 */
function detectByEdgeContrast(data, width, height) {
  // Convert to grayscale
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  }

  // Sobel edge detection
  const edges = new Uint8Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)]

      const gy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)]

      edges[y * width + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy))
    }
  }

  // Find bounding box of strong edges
  const edgeThreshold = 80
  let minX = width, maxX = 0, minY = height, maxY = 0

  // Use histogram approach - find columns/rows with significant edge content
  const colEdges = new Array(width).fill(0)
  const rowEdges = new Array(height).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > edgeThreshold) {
        colEdges[x]++
        rowEdges[y]++
      }
    }
  }

  // Find bounds where edge density is significant
  const colThreshold = height * 0.05
  const rowThreshold = width * 0.05

  for (let x = 0; x < width; x++) {
    if (colEdges[x] > colThreshold) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
    }
  }

  for (let y = 0; y < height; y++) {
    if (rowEdges[y] > rowThreshold) {
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  // Add small margin
  const margin = Math.min(width, height) * 0.02
  minX = Math.max(0, minX - margin)
  maxX = Math.min(width, maxX + margin)
  minY = Math.max(0, minY - margin)
  maxY = Math.min(height, maxY + margin)

  const cropWidth = maxX - minX
  const cropHeight = maxY - minY
  const cropRatio = (cropWidth * cropHeight) / (width * height)

  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    confidence: cropRatio > 0.2 && cropRatio < 0.95 ? 0.6 : 0.2
  }
}

/**
 * Detect using rectangle heuristic - look for rectangular regions with different content
 */
function detectByRectangleHeuristic(data, width, height) {
  // Sample center vs edges to detect rectangular content
  const centerSample = sampleRegion(data, width, height,
    width * 0.3, height * 0.3, width * 0.4, height * 0.4)

  const edgeSamples = [
    sampleRegion(data, width, height, 0, 0, width * 0.15, height * 0.15), // top-left
    sampleRegion(data, width, height, width * 0.85, 0, width * 0.15, height * 0.15), // top-right
    sampleRegion(data, width, height, 0, height * 0.85, width * 0.15, height * 0.15), // bottom-left
    sampleRegion(data, width, height, width * 0.85, height * 0.85, width * 0.15, height * 0.15) // bottom-right
  ]

  // Calculate variance - artwork content usually has higher variance than frames/walls
  const centerVariance = calculateVariance(centerSample)
  const edgeVariance = edgeSamples.reduce((sum, s) => sum + calculateVariance(s), 0) / 4

  // If center has significantly higher variance, there's likely artwork there
  if (centerVariance > edgeVariance * 1.5) {
    // Estimate bounds based on variance difference
    const ratio = Math.min(0.9, 0.7 + (centerVariance - edgeVariance) / centerVariance * 0.2)
    const margin = (1 - ratio) / 2

    return {
      x: Math.round(width * margin),
      y: Math.round(height * margin),
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
      confidence: 0.5
    }
  }

  return { x: 0, y: 0, width, height, confidence: 0.1 }
}

// Helper functions

function getPixelRGB(data, x, y, width) {
  const idx = (y * width + x) * 4
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
}

function getPixelHSL(data, x, y, width) {
  const { r, g, b } = getPixelRGB(data, x, y, width)
  return rgbToHSL(r, g, b)
}

function rgbToHSL(r, g, b) {
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function colorDifference(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  )
}

function sampleRegion(data, imgWidth, imgHeight, x, y, w, h) {
  const samples = []
  const sampleCount = 20

  for (let i = 0; i < sampleCount; i++) {
    const sx = Math.floor(x + Math.random() * w)
    const sy = Math.floor(y + Math.random() * h)
    if (sx < imgWidth && sy < imgHeight) {
      samples.push(getPixelRGB(data, sx, sy, imgWidth))
    }
  }

  return samples
}

function calculateVariance(samples) {
  if (samples.length === 0) return 0

  const meanR = samples.reduce((s, p) => s + p.r, 0) / samples.length
  const meanG = samples.reduce((s, p) => s + p.g, 0) / samples.length
  const meanB = samples.reduce((s, p) => s + p.b, 0) / samples.length

  let variance = 0
  for (const p of samples) {
    variance += Math.pow(p.r - meanR, 2) + Math.pow(p.g - meanG, 2) + Math.pow(p.b - meanB, 2)
  }

  return variance / samples.length
}

/**
 * Apply crop to canvas and return data URL
 */
export function applyCrop(source, bounds) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = bounds.width
  canvas.height = bounds.height

  ctx.drawImage(
    source,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}

export default {
  detectArtworkBounds,
  applyCrop
}
