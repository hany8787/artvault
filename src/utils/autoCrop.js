/**
 * Auto-crop utility for artwork detection
 * Improved algorithm to detect artwork frames and exclude museum walls
 *
 * Strategies:
 * 1. Wall detection: Find uniform wall color, scan inward to frame
 * 2. Gradient peak detection: Find strongest edges forming a rectangle
 * 3. Frame color detection: Match gold/black/wood frame colors
 * 4. Variance heuristic: Center content vs edge uniformity
 */

/**
 * Detect artwork edges and return crop coordinates
 * @param {HTMLImageElement|HTMLCanvasElement} source
 * @returns {Promise<{x, y, width, height, confidence}>}
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

    // Try all strategies and pick the best
    const strategies = [
      () => detectByWallColor(data, width, height),
      () => detectByGradientPeaks(data, width, height),
      () => detectByFrameColor(data, width, height),
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

    // If no good detection, return a centered crop (8% margin)
    if (bestResult.confidence < 0.25) {
      const margin = Math.min(width, height) * 0.08
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
 * Strategy 1: Detect uniform wall color at edges, then find where it ends
 * Best for museum photos where painting is surrounded by wall
 */
function detectByWallColor(data, width, height) {
  // Sample many pixels along all 4 edges to find wall color
  const edgeSamples = 100
  const edgeColors = []

  // Sample border strip (outer 5% of each edge)
  const stripW = Math.max(10, Math.floor(width * 0.05))
  const stripH = Math.max(10, Math.floor(height * 0.05))

  for (let i = 0; i < edgeSamples; i++) {
    const x = Math.floor((width / edgeSamples) * i)
    const y = Math.floor((height / edgeSamples) * i)
    // Top strip
    edgeColors.push(getPixelRGB(data, Math.min(x, width - 1), Math.min(stripH, height - 1), width))
    // Bottom strip
    edgeColors.push(getPixelRGB(data, Math.min(x, width - 1), Math.max(0, height - stripH), width))
    // Left strip
    edgeColors.push(getPixelRGB(data, Math.min(stripW, width - 1), Math.min(y, height - 1), width))
    // Right strip
    edgeColors.push(getPixelRGB(data, Math.max(0, width - stripW), Math.min(y, height - 1), width))
  }

  // Find median wall color
  const wallColor = {
    r: median(edgeColors.map(c => c.r)),
    g: median(edgeColors.map(c => c.g)),
    b: median(edgeColors.map(c => c.b))
  }

  // Check if edges are actually uniform (wall-like)
  const wallMatchCount = edgeColors.filter(c => colorDifference(c, wallColor) < 40).length
  const wallUniformity = wallMatchCount / edgeColors.length

  if (wallUniformity < 0.4) {
    return { x: 0, y: 0, width, height, confidence: 0 }
  }

  // Scan inward from each edge to find where wall color stops
  const scanLines = 40
  const wallThreshold = 50 // Color distance from wall color

  const leftBounds = []
  const rightBounds = []
  const topBounds = []
  const bottomBounds = []

  // Scan horizontal lines from left and right
  for (let i = 0; i < scanLines; i++) {
    const y = Math.floor((height * 0.1) + (height * 0.8 / scanLines) * i)

    // Left to right
    for (let x = 0; x < width * 0.45; x++) {
      const pixel = getPixelRGB(data, x, y, width)
      if (colorDifference(pixel, wallColor) > wallThreshold) {
        leftBounds.push(x)
        break
      }
    }

    // Right to left
    for (let x = width - 1; x > width * 0.55; x--) {
      const pixel = getPixelRGB(data, x, y, width)
      if (colorDifference(pixel, wallColor) > wallThreshold) {
        rightBounds.push(x)
        break
      }
    }
  }

  // Scan vertical lines from top and bottom
  for (let i = 0; i < scanLines; i++) {
    const x = Math.floor((width * 0.1) + (width * 0.8 / scanLines) * i)

    // Top to bottom
    for (let y = 0; y < height * 0.45; y++) {
      const pixel = getPixelRGB(data, x, y, width)
      if (colorDifference(pixel, wallColor) > wallThreshold) {
        topBounds.push(y)
        break
      }
    }

    // Bottom to top
    for (let y = height - 1; y > height * 0.55; y--) {
      const pixel = getPixelRGB(data, x, y, width)
      if (colorDifference(pixel, wallColor) > wallThreshold) {
        bottomBounds.push(y)
        break
      }
    }
  }

  // Need enough scan lines to have found boundaries
  if (leftBounds.length < scanLines * 0.3 || rightBounds.length < scanLines * 0.3 ||
      topBounds.length < scanLines * 0.3 || bottomBounds.length < scanLines * 0.3) {
    return { x: 0, y: 0, width, height, confidence: 0.1 }
  }

  // Use robust median (reject outliers)
  const left = robustMedian(leftBounds)
  const right = robustMedian(rightBounds)
  const top = robustMedian(topBounds)
  const bottom = robustMedian(bottomBounds)

  const cropW = right - left
  const cropH = bottom - top

  if (cropW < width * 0.15 || cropH < height * 0.15) {
    return { x: 0, y: 0, width, height, confidence: 0.1 }
  }

  const cropRatio = (cropW * cropH) / (width * height)
  const confidence = cropRatio > 0.1 && cropRatio < 0.9
    ? 0.6 + wallUniformity * 0.3
    : 0.2

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(cropW),
    height: Math.round(cropH),
    confidence
  }
}

/**
 * Strategy 2: Find strongest gradient lines forming a rectangle
 * Works well for framed paintings where frame creates strong edges
 */
function detectByGradientPeaks(data, width, height) {
  // Convert to grayscale
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  }

  // For each row, find the strongest horizontal gradient (vertical edge)
  // For each column, find the strongest vertical gradient (horizontal edge)
  const leftEdges = []
  const rightEdges = []
  const topEdges = []
  const bottomEdges = []

  const minGradient = 25

  // Scan rows for vertical edges (left and right frame boundaries)
  const rowStep = Math.max(1, Math.floor(height / 80))
  for (let y = Math.floor(height * 0.1); y < height * 0.9; y += rowStep) {
    let maxLeftGrad = 0, leftX = 0
    let maxRightGrad = 0, rightX = width - 1

    // Left half - find strongest rising edge
    for (let x = 1; x < width * 0.45; x++) {
      const grad = Math.abs(gray[y * width + x] - gray[y * width + x - 1])
      if (grad > maxLeftGrad) {
        maxLeftGrad = grad
        leftX = x
      }
    }

    // Right half - find strongest rising edge
    for (let x = width - 2; x > width * 0.55; x--) {
      const grad = Math.abs(gray[y * width + x] - gray[y * width + x + 1])
      if (grad > maxRightGrad) {
        maxRightGrad = grad
        rightX = x
      }
    }

    if (maxLeftGrad > minGradient) leftEdges.push(leftX)
    if (maxRightGrad > minGradient) rightEdges.push(rightX)
  }

  // Scan columns for horizontal edges (top and bottom frame boundaries)
  const colStep = Math.max(1, Math.floor(width / 80))
  for (let x = Math.floor(width * 0.1); x < width * 0.9; x += colStep) {
    let maxTopGrad = 0, topY = 0
    let maxBottomGrad = 0, bottomY = height - 1

    // Top half
    for (let y = 1; y < height * 0.45; y++) {
      const grad = Math.abs(gray[y * width + x] - gray[(y - 1) * width + x])
      if (grad > maxTopGrad) {
        maxTopGrad = grad
        topY = y
      }
    }

    // Bottom half
    for (let y = height - 2; y > height * 0.55; y--) {
      const grad = Math.abs(gray[y * width + x] - gray[(y + 1) * width + x])
      if (grad > maxBottomGrad) {
        maxBottomGrad = grad
        bottomY = y
      }
    }

    if (maxTopGrad > minGradient) topEdges.push(topY)
    if (maxBottomGrad > minGradient) bottomEdges.push(bottomY)
  }

  // Need enough edge votes
  if (leftEdges.length < 5 || rightEdges.length < 5 ||
      topEdges.length < 5 || bottomEdges.length < 5) {
    return { x: 0, y: 0, width, height, confidence: 0.15 }
  }

  const left = robustMedian(leftEdges)
  const right = robustMedian(rightEdges)
  const top = robustMedian(topEdges)
  const bottom = robustMedian(bottomEdges)

  const cropW = right - left
  const cropH = bottom - top

  if (cropW < width * 0.15 || cropH < height * 0.15) {
    return { x: 0, y: 0, width, height, confidence: 0.1 }
  }

  // Confidence based on edge consistency (low std dev = good alignment)
  const leftStd = stdDev(leftEdges)
  const rightStd = stdDev(rightEdges)
  const topStd = stdDev(topEdges)
  const bottomStd = stdDev(bottomEdges)
  const avgStd = (leftStd + rightStd + topStd + bottomStd) / 4
  const alignment = Math.max(0, 1 - avgStd / (Math.min(width, height) * 0.1))

  const cropRatio = (cropW * cropH) / (width * height)
  const confidence = cropRatio > 0.1 && cropRatio < 0.92
    ? 0.5 + alignment * 0.4
    : 0.15

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(cropW),
    height: Math.round(cropH),
    confidence
  }
}

/**
 * Strategy 3: Detect frame by looking for common frame colors
 */
function detectByFrameColor(data, width, height) {
  // Expanded frame color signatures (HSL ranges)
  const frameColors = [
    { name: 'gold', hRange: [20, 65], sRange: [25, 100], lRange: [25, 75] },
    { name: 'brass', hRange: [35, 50], sRange: [15, 50], lRange: [40, 65] },
    { name: 'black', hRange: [0, 360], sRange: [0, 25], lRange: [0, 18] },
    { name: 'darkWood', hRange: [10, 50], sRange: [15, 70], lRange: [12, 45] },
    { name: 'white', hRange: [0, 360], sRange: [0, 15], lRange: [82, 100] },
    { name: 'cream', hRange: [30, 60], sRange: [10, 40], lRange: [70, 90] }
  ]

  // Sample edges - more points for better coverage
  const sampleSize = 150
  const edgePixels = []

  // Sample at multiple depths from edge (not just 5px)
  for (const depth of [3, 8, 15]) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / sampleSize))) {
      if (depth < height) {
        edgePixels.push(getPixelHSL(data, Math.min(x, width - 1), depth, width))
        edgePixels.push(getPixelHSL(data, Math.min(x, width - 1), height - 1 - depth, width))
      }
    }
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / sampleSize))) {
      if (depth < width) {
        edgePixels.push(getPixelHSL(data, depth, Math.min(y, height - 1), width))
        edgePixels.push(getPixelHSL(data, width - 1 - depth, Math.min(y, height - 1), width))
      }
    }
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

  // Lower threshold: 20% of edge pixels matching (was 30%)
  if (frameType && maxMatches > edgePixels.length * 0.2) {
    return findInnerBounds(data, width, height)
  }

  return { x: 0, y: 0, width, height, confidence: 0 }
}

/**
 * Find inner bounds by scanning inward from edges looking for color transitions
 */
function findInnerBounds(data, width, height) {
  const maxScan = Math.min(width, height) * 0.35 // Increased from 25% to 35%
  const scanLines = 40 // Increased from 20
  const threshold = 25 // Lowered from 30 for more sensitivity

  function scanEdge(direction) {
    const transitions = []

    if (direction === 'left' || direction === 'right') {
      const startX = direction === 'left' ? 0 : width - 1
      const stepX = direction === 'left' ? 1 : -1

      for (let i = 0; i < scanLines; i++) {
        const y = Math.floor((height * 0.15) + (height * 0.7 / scanLines) * i)
        let prevColor = getPixelRGB(data, startX, y, width)
        let biggestDiff = 0
        let biggestDiffX = startX

        for (let offset = 1; offset < maxScan; offset++) {
          const x = startX + (offset * stepX)
          if (x < 0 || x >= width) break

          const color = getPixelRGB(data, x, y, width)
          const diff = colorDifference(prevColor, color)

          if (diff > biggestDiff) {
            biggestDiff = diff
            biggestDiffX = x
          }
          prevColor = color
        }

        if (biggestDiff > threshold) {
          transitions.push(biggestDiffX)
        }
      }
    } else {
      const startY = direction === 'top' ? 0 : height - 1
      const stepY = direction === 'top' ? 1 : -1

      for (let i = 0; i < scanLines; i++) {
        const x = Math.floor((width * 0.15) + (width * 0.7 / scanLines) * i)
        let prevColor = getPixelRGB(data, x, startY, width)
        let biggestDiff = 0
        let biggestDiffY = startY

        for (let offset = 1; offset < maxScan; offset++) {
          const y = startY + (offset * stepY)
          if (y < 0 || y >= height) break

          const color = getPixelRGB(data, x, y, width)
          const diff = colorDifference(prevColor, color)

          if (diff > biggestDiff) {
            biggestDiff = diff
            biggestDiffY = y
          }
          prevColor = color
        }

        if (biggestDiff > threshold) {
          transitions.push(biggestDiffY)
        }
      }
    }

    return transitions
  }

  const leftT = scanEdge('left')
  const rightT = scanEdge('right')
  const topT = scanEdge('top')
  const bottomT = scanEdge('bottom')

  if (leftT.length < 5 || rightT.length < 5 || topT.length < 5 || bottomT.length < 5) {
    return { x: 0, y: 0, width, height, confidence: 0.2 }
  }

  let left = robustMedian(leftT)
  let right = robustMedian(rightT)
  let top = robustMedian(topT)
  let bottom = robustMedian(bottomT)

  // Small margin inside the frame
  const margin = Math.min(width, height) * 0.005
  left = Math.min(left + margin, width * 0.4)
  right = Math.max(right - margin, width * 0.6)
  top = Math.min(top + margin, height * 0.4)
  bottom = Math.max(bottom - margin, height * 0.6)

  const cropW = right - left
  const cropH = bottom - top
  const cropRatio = (cropW * cropH) / (width * height)
  const confidence = cropRatio > 0.1 && cropRatio < 0.92 ? 0.7 : 0.25

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(cropW),
    height: Math.round(cropH),
    confidence
  }
}

/**
 * Strategy 4: Rectangle heuristic - center vs edge variance
 */
function detectByRectangleHeuristic(data, width, height) {
  const centerSample = sampleRegion(data, width, height,
    width * 0.3, height * 0.3, width * 0.4, height * 0.4)

  const edgeSamples = [
    sampleRegion(data, width, height, 0, 0, width * 0.12, height * 0.12),
    sampleRegion(data, width, height, width * 0.88, 0, width * 0.12, height * 0.12),
    sampleRegion(data, width, height, 0, height * 0.88, width * 0.12, height * 0.12),
    sampleRegion(data, width, height, width * 0.88, height * 0.88, width * 0.12, height * 0.12)
  ]

  const centerVariance = calculateVariance(centerSample)
  const edgeVariance = edgeSamples.reduce((sum, s) => sum + calculateVariance(s), 0) / 4

  if (centerVariance > edgeVariance * 1.3) {
    const ratio = Math.min(0.92, 0.65 + (centerVariance - edgeVariance) / centerVariance * 0.25)
    const margin = (1 - ratio) / 2

    return {
      x: Math.round(width * margin),
      y: Math.round(height * margin),
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
      confidence: 0.45
    }
  }

  return { x: 0, y: 0, width, height, confidence: 0.1 }
}

// === Helper functions ===

function getPixelRGB(data, x, y, width) {
  const idx = (y * width + x) * 4
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
}

function getPixelHSL(data, x, y, width) {
  const { r, g, b } = getPixelRGB(data, x, y, width)
  return rgbToHSL(r, g, b)
}

function rgbToHSL(r, g, b) {
  r /= 255; g /= 255; b /= 255
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
    (c1.r - c2.r) ** 2 +
    (c1.g - c2.g) ** 2 +
    (c1.b - c2.b) ** 2
  )
}

function median(arr) {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function robustMedian(arr) {
  if (arr.length === 0) return 0
  // Remove outliers (values beyond 1.5 IQR)
  const sorted = [...arr].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const filtered = sorted.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr)
  return filtered.length > 0 ? median(filtered) : median(arr)
}

function stdDev(arr) {
  if (arr.length === 0) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length)
}

function sampleRegion(data, imgWidth, imgHeight, x, y, w, h) {
  const samples = []
  const sampleCount = 30

  for (let i = 0; i < sampleCount; i++) {
    const sx = Math.floor(x + Math.random() * w)
    const sy = Math.floor(y + Math.random() * h)
    if (sx >= 0 && sx < imgWidth && sy >= 0 && sy < imgHeight) {
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
    variance += (p.r - meanR) ** 2 + (p.g - meanG) ** 2 + (p.b - meanB) ** 2
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
