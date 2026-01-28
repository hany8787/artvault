/**
 * Crop Preview Component
 * Interactive crop adjustment with drag handles
 * Fixed version with proper coordinate handling
 */

import { useState, useRef, useEffect, useCallback } from 'react'

export default function CropPreview({
  imageUrl,
  initialBounds,
  onCropChange,
  onConfirm,
  onCancel
}) {
  const containerRef = useRef(null)
  const imageRef = useRef(null)

  // Display coordinates (scaled to fit screen)
  const [displayBounds, setDisplayBounds] = useState({ x: 0, y: 0, width: 100, height: 100 })

  // Image dimensions
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 })
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })

  // Drag state
  const [dragState, setDragState] = useState(null) // { type: 'move'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w', startX, startY, startBounds }

  // Calculate scale factor
  const scale = imageNaturalSize.width > 0 ? imageDisplaySize.width / imageNaturalSize.width : 1

  // Convert natural coordinates to display coordinates
  const toDisplay = useCallback((naturalBounds) => {
    return {
      x: naturalBounds.x * scale,
      y: naturalBounds.y * scale,
      width: naturalBounds.width * scale,
      height: naturalBounds.height * scale
    }
  }, [scale])

  // Convert display coordinates to natural coordinates
  const toNatural = useCallback((displayBounds) => {
    return {
      x: Math.round(displayBounds.x / scale),
      y: Math.round(displayBounds.y / scale),
      width: Math.round(displayBounds.width / scale),
      height: Math.round(displayBounds.height / scale)
    }
  }, [scale])

  // Initialize display bounds when image loads or initial bounds change
  useEffect(() => {
    if (initialBounds && scale > 0) {
      setDisplayBounds(toDisplay(initialBounds))
    }
  }, [initialBounds, scale, toDisplay])

  // Handle image load
  function handleImageLoad(e) {
    const img = e.target
    const container = containerRef.current
    if (!container) return

    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight })

    // Calculate display size to fit in container
    const containerRect = container.getBoundingClientRect()
    const padding = 32 // 16px on each side
    const availableWidth = containerRect.width - padding
    const availableHeight = containerRect.height - padding

    const scaleX = availableWidth / naturalWidth
    const scaleY = availableHeight / naturalHeight
    const fitScale = Math.min(scaleX, scaleY, 1)

    const displayWidth = naturalWidth * fitScale
    const displayHeight = naturalHeight * fitScale

    setImageDisplaySize({ width: displayWidth, height: displayHeight })

    // Calculate offset to center image
    const offsetX = (containerRect.width - displayWidth) / 2
    const offsetY = (containerRect.height - displayHeight) / 2
    setImageOffset({ x: offsetX, y: offsetY })

    // Initialize bounds if not provided
    if (!initialBounds) {
      const defaultBounds = {
        x: naturalWidth * 0.1,
        y: naturalHeight * 0.1,
        width: naturalWidth * 0.8,
        height: naturalHeight * 0.8
      }
      setDisplayBounds(toDisplay(defaultBounds))
    }
  }

  // Get pointer position relative to image
  const getPointerPosition = useCallback((e) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }

    const rect = container.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left - imageOffset.x,
      y: clientY - rect.top - imageOffset.y
    }
  }, [imageOffset])

  // Start drag
  const startDrag = useCallback((e, type) => {
    e.preventDefault()
    e.stopPropagation()

    const pos = getPointerPosition(e)
    setDragState({
      type,
      startX: pos.x,
      startY: pos.y,
      startBounds: { ...displayBounds }
    })
  }, [getPointerPosition, displayBounds])

  // Handle drag
  const handleDrag = useCallback((e) => {
    if (!dragState) return

    const pos = getPointerPosition(e)
    const dx = pos.x - dragState.startX
    const dy = pos.y - dragState.startY
    const { startBounds, type } = dragState

    const minSize = 30 // Minimum size in display pixels
    const maxX = imageDisplaySize.width
    const maxY = imageDisplaySize.height

    let newBounds = { ...startBounds }

    switch (type) {
      case 'move':
        newBounds.x = Math.max(0, Math.min(maxX - startBounds.width, startBounds.x + dx))
        newBounds.y = Math.max(0, Math.min(maxY - startBounds.height, startBounds.y + dy))
        break

      case 'nw': // Top-left
        {
          const newX = Math.max(0, Math.min(startBounds.x + startBounds.width - minSize, startBounds.x + dx))
          const newY = Math.max(0, Math.min(startBounds.y + startBounds.height - minSize, startBounds.y + dy))
          newBounds.width = startBounds.x + startBounds.width - newX
          newBounds.height = startBounds.y + startBounds.height - newY
          newBounds.x = newX
          newBounds.y = newY
        }
        break

      case 'ne': // Top-right
        {
          const newY = Math.max(0, Math.min(startBounds.y + startBounds.height - minSize, startBounds.y + dy))
          const newWidth = Math.max(minSize, Math.min(maxX - startBounds.x, startBounds.width + dx))
          newBounds.width = newWidth
          newBounds.height = startBounds.y + startBounds.height - newY
          newBounds.y = newY
        }
        break

      case 'sw': // Bottom-left
        {
          const newX = Math.max(0, Math.min(startBounds.x + startBounds.width - minSize, startBounds.x + dx))
          const newHeight = Math.max(minSize, Math.min(maxY - startBounds.y, startBounds.height + dy))
          newBounds.width = startBounds.x + startBounds.width - newX
          newBounds.height = newHeight
          newBounds.x = newX
        }
        break

      case 'se': // Bottom-right
        newBounds.width = Math.max(minSize, Math.min(maxX - startBounds.x, startBounds.width + dx))
        newBounds.height = Math.max(minSize, Math.min(maxY - startBounds.y, startBounds.height + dy))
        break

      case 'n': // Top edge
        {
          const newY = Math.max(0, Math.min(startBounds.y + startBounds.height - minSize, startBounds.y + dy))
          newBounds.height = startBounds.y + startBounds.height - newY
          newBounds.y = newY
        }
        break

      case 's': // Bottom edge
        newBounds.height = Math.max(minSize, Math.min(maxY - startBounds.y, startBounds.height + dy))
        break

      case 'w': // Left edge
        {
          const newX = Math.max(0, Math.min(startBounds.x + startBounds.width - minSize, startBounds.x + dx))
          newBounds.width = startBounds.x + startBounds.width - newX
          newBounds.x = newX
        }
        break

      case 'e': // Right edge
        newBounds.width = Math.max(minSize, Math.min(maxX - startBounds.x, startBounds.width + dx))
        break
    }

    setDisplayBounds(newBounds)
  }, [dragState, getPointerPosition, imageDisplaySize])

  // End drag
  const endDrag = useCallback(() => {
    if (dragState) {
      // Notify parent of change in natural coordinates
      if (onCropChange) {
        onCropChange(toNatural(displayBounds))
      }
    }
    setDragState(null)
  }, [dragState, displayBounds, toNatural, onCropChange])

  // Global mouse/touch events
  useEffect(() => {
    if (dragState) {
      const handleMove = (e) => handleDrag(e)
      const handleEnd = () => endDrag()

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove, { passive: false })
      window.addEventListener('touchend', handleEnd)

      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleMove)
        window.removeEventListener('touchend', handleEnd)
      }
    }
  }, [dragState, handleDrag, endDrag])

  // Handle confirm
  const handleConfirm = () => {
    const naturalBounds = toNatural(displayBounds)
    onConfirm(naturalBounds)
  }

  // Natural bounds for display
  const naturalBounds = toNatural(displayBounds)

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onCancel}
          className="text-white/60 hover:text-white flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
          Annuler
        </button>

        <h2 className="font-display text-lg italic text-accent">Ajuster le cadrage</h2>

        <button
          onClick={handleConfirm}
          className="bg-accent text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">check</span>
          Confirmer
        </button>
      </div>

      {/* Crop area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-neutral-900"
        style={{ touchAction: 'none' }}
      >
        {/* Image container */}
        <div
          className="absolute"
          style={{
            left: imageOffset.x,
            top: imageOffset.y,
            width: imageDisplaySize.width,
            height: imageDisplaySize.height
          }}
        >
          {/* Image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            onLoad={handleImageLoad}
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Overlay outside crop area */}
          {imageDisplaySize.width > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Top overlay */}
              <div
                className="absolute left-0 right-0 top-0 bg-black/70"
                style={{ height: displayBounds.y }}
              />
              {/* Bottom overlay */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/70"
                style={{ height: imageDisplaySize.height - displayBounds.y - displayBounds.height }}
              />
              {/* Left overlay */}
              <div
                className="absolute left-0 bg-black/70"
                style={{
                  top: displayBounds.y,
                  width: displayBounds.x,
                  height: displayBounds.height
                }}
              />
              {/* Right overlay */}
              <div
                className="absolute right-0 bg-black/70"
                style={{
                  top: displayBounds.y,
                  width: imageDisplaySize.width - displayBounds.x - displayBounds.width,
                  height: displayBounds.height
                }}
              />
            </div>
          )}

          {/* Crop selection */}
          {imageDisplaySize.width > 0 && (
            <div
              className="absolute border-2 border-accent"
              style={{
                left: displayBounds.x,
                top: displayBounds.y,
                width: displayBounds.width,
                height: displayBounds.height
              }}
            >
              {/* Move area */}
              <div
                className="absolute inset-2 cursor-move"
                onMouseDown={(e) => startDrag(e, 'move')}
                onTouchStart={(e) => startDrag(e, 'move')}
              />

              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
              </div>

              {/* Corner handles */}
              <CropHandle position="nw" onStart={startDrag} />
              <CropHandle position="ne" onStart={startDrag} />
              <CropHandle position="sw" onStart={startDrag} />
              <CropHandle position="se" onStart={startDrag} />

              {/* Edge handles */}
              <CropHandle position="n" onStart={startDrag} />
              <CropHandle position="s" onStart={startDrag} />
              <CropHandle position="w" onStart={startDrag} />
              <CropHandle position="e" onStart={startDrag} />
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-white/10 bg-black/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="text-center">
            <p className="text-white/40 text-xs uppercase tracking-wider">Dimensions</p>
            <p className="text-white font-mono text-sm">
              {naturalBounds.width} × {naturalBounds.height} px
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-xs uppercase tracking-wider">Position</p>
            <p className="text-white font-mono text-sm">
              {naturalBounds.x}, {naturalBounds.y}
            </p>
          </div>
        </div>
        <p className="text-white/40 text-xs text-center mt-3">
          Glissez les coins ou les bords pour ajuster la sélection
        </p>
      </div>
    </div>
  )
}

// Crop handle component
function CropHandle({ position, onStart }) {
  const isCorner = ['nw', 'ne', 'sw', 'se'].includes(position)

  const positionStyles = {
    // Corners
    nw: { top: -8, left: -8, cursor: 'nwse-resize' },
    ne: { top: -8, right: -8, cursor: 'nesw-resize' },
    sw: { bottom: -8, left: -8, cursor: 'nesw-resize' },
    se: { bottom: -8, right: -8, cursor: 'nwse-resize' },
    // Edges
    n: { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    s: { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    w: { left: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
    e: { right: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }
  }

  if (isCorner) {
    return (
      <div
        className="absolute w-5 h-5 bg-accent rounded-full border-2 border-white shadow-lg z-10 touch-none"
        style={positionStyles[position]}
        onMouseDown={(e) => onStart(e, position)}
        onTouchStart={(e) => onStart(e, position)}
      />
    )
  }

  // Edge handle (smaller, rectangular)
  const isVertical = position === 'n' || position === 's'
  return (
    <div
      className={`absolute bg-accent rounded-full border border-white shadow-md z-10 touch-none ${
        isVertical ? 'w-8 h-3' : 'w-3 h-8'
      }`}
      style={positionStyles[position]}
      onMouseDown={(e) => onStart(e, position)}
      onTouchStart={(e) => onStart(e, position)}
    />
  )
}
