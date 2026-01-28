/**
 * Auto-crop utility for artwork detection
 * Uses canvas-based edge detection to find artwork boundaries
 */

/**
 * Detect artwork edges and return crop coordinates
 * @param {HTMLImageElement|HTMLCanvasElement} source - Image source
 * @returns {Promise<{x: number, y: number, width: number, height: number, confidence: number}>}
 */
export async function detectArtworkBounds(source) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size
    const width = source.naturalWidth || source.width
    const height = source.naturalHeight || source.height
    canvas.width = width
    canvas.height = height

    // Draw image
    ctx.drawImage(source, 0, 0)

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Convert to grayscale and detect edges
    const grayscale = new Uint8Array(width * height)
    const edges = new Uint8Array(width * height)

    // Grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4
      grayscale[idx] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }

    // Sobel edge detection
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0
        let kernelIdx = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = (y + ky) * width + (x + kx)
            gx += grayscale[pixelIdx] * sobelX[kernelIdx]
            gy += grayscale[pixelIdx] * sobelY[kernelIdx]
            kernelIdx++
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy)
        edges[y * width + x] = Math.min(255, magnitude)
      }
    }

    // Find bounding box using edge histogram
    const threshold = 50 // Edge threshold
    const margin = Math.min(width, height) * 0.02 // 2% margin

    let minX = width, maxX = 0, minY = height, maxY = 0
    let edgeCount = 0

    // Scan columns to find left/right bounds
    for (let x = 0; x < width; x++) {
      let colEdges = 0
      for (let y = 0; y < height; y++) {
        if (edges[y * width + x] > threshold) colEdges++
      }
      if (colEdges > height * 0.05) { // 5% of column has edges
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        edgeCount += colEdges
      }
    }

    // Scan rows to find top/bottom bounds
    for (let y = 0; y < height; y++) {
      let rowEdges = 0
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > threshold) rowEdges++
      }
      if (rowEdges > width * 0.05) { // 5% of row has edges
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    // Apply margin and clamp
    minX = Math.max(0, minX - margin)
    maxX = Math.min(width, maxX + margin)
    minY = Math.max(0, minY - margin)
    maxY = Math.min(height, maxY + margin)

    // If detection failed, return full image
    if (maxX <= minX || maxY <= minY) {
      resolve({
        x: 0,
        y: 0,
        width,
        height,
        confidence: 0
      })
      return
    }

    // Calculate confidence based on how much we cropped
    const cropWidth = maxX - minX
    const cropHeight = maxY - minY
    const cropArea = cropWidth * cropHeight
    const totalArea = width * height
    const cropRatio = cropArea / totalArea

    // Higher confidence if we cropped a reasonable amount (20-90% of original)
    const confidence = cropRatio > 0.2 && cropRatio < 0.9 ? 0.8 : 0.5

    resolve({
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      confidence
    })
  })
}

/**
 * Apply crop to canvas and return data URL
 * @param {HTMLCanvasElement|HTMLImageElement} source
 * @param {{x: number, y: number, width: number, height: number}} bounds
 * @returns {string} Data URL of cropped image
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

/**
 * Create a preview with crop overlay
 * @param {string} imageUrl
 * @param {{x: number, y: number, width: number, height: number}} bounds
 * @returns {string} Data URL with crop preview
 */
export function createCropPreview(imageUrl, bounds) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Darken outside crop area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'

      // Top
      ctx.fillRect(0, 0, img.width, bounds.y)
      // Bottom
      ctx.fillRect(0, bounds.y + bounds.height, img.width, img.height - bounds.y - bounds.height)
      // Left
      ctx.fillRect(0, bounds.y, bounds.x, bounds.height)
      // Right
      ctx.fillRect(bounds.x + bounds.width, bounds.y, img.width - bounds.x - bounds.width, bounds.height)

      // Draw crop border
      ctx.strokeStyle = '#f2b90d'
      ctx.lineWidth = 3
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

      // Draw corner handles
      const handleSize = 20
      ctx.fillStyle = '#f2b90d'

      // Top-left
      ctx.fillRect(bounds.x - 2, bounds.y - 2, handleSize, 4)
      ctx.fillRect(bounds.x - 2, bounds.y - 2, 4, handleSize)

      // Top-right
      ctx.fillRect(bounds.x + bounds.width - handleSize + 2, bounds.y - 2, handleSize, 4)
      ctx.fillRect(bounds.x + bounds.width - 2, bounds.y - 2, 4, handleSize)

      // Bottom-left
      ctx.fillRect(bounds.x - 2, bounds.y + bounds.height - 2, handleSize, 4)
      ctx.fillRect(bounds.x - 2, bounds.y + bounds.height - handleSize + 2, 4, handleSize)

      // Bottom-right
      ctx.fillRect(bounds.x + bounds.width - handleSize + 2, bounds.y + bounds.height - 2, handleSize, 4)
      ctx.fillRect(bounds.x + bounds.width - 2, bounds.y + bounds.height - handleSize + 2, 4, handleSize)

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = imageUrl
  })
}

export default {
  detectArtworkBounds,
  applyCrop,
  createCropPreview
}
