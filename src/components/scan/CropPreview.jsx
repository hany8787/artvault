/**
 * Crop Preview Component
 * Interactive crop adjustment with drag handles
 */

import { useState, useRef, useEffect } from 'react'

export default function CropPreview({
  imageUrl,
  initialBounds,
  onCropChange,
  onConfirm,
  onCancel
}) {
  const containerRef = useRef(null)
  const [bounds, setBounds] = useState(initialBounds)
  const [isDragging, setIsDragging] = useState(null) // null, 'move', 'nw', 'ne', 'sw', 'se'
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startBounds, setStartBounds] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (initialBounds) {
      setBounds(initialBounds)
    }
  }, [initialBounds])

  function handleImageLoad(e) {
    const img = e.target
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight

    // Calculate scale to fit in container
    const scaleX = containerRect.width / imgWidth
    const scaleY = containerRect.height / imgHeight
    const newScale = Math.min(scaleX, scaleY, 1)

    setImageSize({ width: imgWidth, height: imgHeight })
    setScale(newScale)
  }

  function handleMouseDown(e, handle) {
    e.preventDefault()
    setIsDragging(handle)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartBounds({ ...bounds })
  }

  function handleTouchStart(e, handle) {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    setIsDragging(handle)
    setStartPos({ x: touch.clientX, y: touch.clientY })
    setStartBounds({ ...bounds })
  }

  function handleMouseMove(e) {
    if (!isDragging || !startBounds) return

    const dx = (e.clientX - startPos.x) / scale
    const dy = (e.clientY - startPos.y) / scale

    updateBounds(dx, dy)
  }

  function handleTouchMove(e) {
    if (!isDragging || !startBounds || e.touches.length !== 1) return

    const touch = e.touches[0]
    const dx = (touch.clientX - startPos.x) / scale
    const dy = (touch.clientY - startPos.y) / scale

    updateBounds(dx, dy)
  }

  function updateBounds(dx, dy) {
    let newBounds = { ...startBounds }
    const minSize = 50 // Minimum crop size

    switch (isDragging) {
      case 'move':
        newBounds.x = Math.max(0, Math.min(imageSize.width - startBounds.width, startBounds.x + dx))
        newBounds.y = Math.max(0, Math.min(imageSize.height - startBounds.height, startBounds.y + dy))
        break

      case 'nw':
        newBounds.x = Math.max(0, Math.min(startBounds.x + startBounds.width - minSize, startBounds.x + dx))
        newBounds.y = Math.max(0, Math.min(startBounds.y + startBounds.height - minSize, startBounds.y + dy))
        newBounds.width = startBounds.x + startBounds.width - newBounds.x
        newBounds.height = startBounds.y + startBounds.height - newBounds.y
        break

      case 'ne':
        newBounds.y = Math.max(0, Math.min(startBounds.y + startBounds.height - minSize, startBounds.y + dy))
        newBounds.width = Math.max(minSize, Math.min(imageSize.width - startBounds.x, startBounds.width + dx))
        newBounds.height = startBounds.y + startBounds.height - newBounds.y
        break

      case 'sw':
        newBounds.x = Math.max(0, Math.min(startBounds.x + startBounds.width - minSize, startBounds.x + dx))
        newBounds.width = startBounds.x + startBounds.width - newBounds.x
        newBounds.height = Math.max(minSize, Math.min(imageSize.height - startBounds.y, startBounds.height + dy))
        break

      case 'se':
        newBounds.width = Math.max(minSize, Math.min(imageSize.width - startBounds.x, startBounds.width + dx))
        newBounds.height = Math.max(minSize, Math.min(imageSize.height - startBounds.y, startBounds.height + dy))
        break
    }

    setBounds(newBounds)
    if (onCropChange) {
      onCropChange(newBounds)
    }
  }

  function handleMouseUp() {
    setIsDragging(null)
    setStartBounds(null)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging, startPos, startBounds])

  const scaledBounds = {
    x: bounds.x * scale,
    y: bounds.y * scale,
    width: bounds.width * scale,
    height: bounds.height * scale
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-white/60 hover:text-white flex items-center gap-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Annuler
        </button>

        <h2 className="font-display text-lg italic text-white">Ajuster le cadrage</h2>

        <button
          onClick={() => onConfirm(bounds)}
          className="text-accent hover:text-accent-hover flex items-center gap-2"
        >
          Confirmer
          <span className="material-symbols-outlined">check</span>
        </button>
      </div>

      {/* Crop area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center p-4"
      >
        <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {/* Image */}
          <img
            src={imageUrl}
            alt="Crop preview"
            onLoad={handleImageLoad}
            className="max-w-full max-h-full"
            style={{ display: imageSize.width ? 'block' : 'none' }}
          />

          {/* Darkened overlay outside crop */}
          {imageSize.width > 0 && (
            <>
              {/* Top */}
              <div
                className="absolute bg-black/60 left-0 right-0 top-0"
                style={{ height: bounds.y }}
              />
              {/* Bottom */}
              <div
                className="absolute bg-black/60 left-0 right-0 bottom-0"
                style={{ height: imageSize.height - bounds.y - bounds.height }}
              />
              {/* Left */}
              <div
                className="absolute bg-black/60 left-0"
                style={{
                  top: bounds.y,
                  width: bounds.x,
                  height: bounds.height
                }}
              />
              {/* Right */}
              <div
                className="absolute bg-black/60 right-0"
                style={{
                  top: bounds.y,
                  width: imageSize.width - bounds.x - bounds.width,
                  height: bounds.height
                }}
              />

              {/* Crop border */}
              <div
                className="absolute border-2 border-accent cursor-move"
                style={{
                  left: bounds.x,
                  top: bounds.y,
                  width: bounds.width,
                  height: bounds.height
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleTouchStart(e, 'move')}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>

                {/* Corner handles */}
                <Handle position="nw" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} />
                <Handle position="ne" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} />
                <Handle position="sw" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} />
                <Handle position="se" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <p className="text-white/40 text-sm">
          Faites glisser les coins pour ajuster le cadrage
        </p>
        {bounds && (
          <p className="text-white/60 text-xs mt-1">
            {Math.round(bounds.width)} × {Math.round(bounds.height)} px
          </p>
        )}
      </div>
    </div>
  )
}

function Handle({ position, onMouseDown, onTouchStart }) {
  const positionStyles = {
    nw: { top: -8, left: -8, cursor: 'nwse-resize' },
    ne: { top: -8, right: -8, cursor: 'nesw-resize' },
    sw: { bottom: -8, left: -8, cursor: 'nesw-resize' },
    se: { bottom: -8, right: -8, cursor: 'nwse-resize' }
  }

  return (
    <div
      className="absolute w-6 h-6 bg-accent rounded-full border-2 border-white shadow-lg z-10"
      style={positionStyles[position]}
      onMouseDown={(e) => onMouseDown(e, position)}
      onTouchStart={(e) => onTouchStart(e, position)}
    />
  )
}
