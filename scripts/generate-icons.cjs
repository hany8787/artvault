// Script pour générer les icônes PWA
// Exécuter avec: node scripts/generate-icons.js

const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '../public/icons')

// SVG template for icon
function generateSVG(size) {
  const fontSize = Math.round(size * 0.15)
  const strokeWidth = Math.max(2, Math.round(size * 0.03))
  const padding = Math.round(size * 0.1)
  const frameSize = size - padding * 2
  const frameRadius = Math.round(size * 0.08)
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#221e10"/>
  <rect x="${padding}" y="${padding}" width="${frameSize}" height="${frameSize}" rx="${frameRadius}" fill="none" stroke="#f2b90d" stroke-width="${strokeWidth}"/>
  <text x="${size/2}" y="${size*0.62}" text-anchor="middle" font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold" font-style="italic" fill="#f2b90d">ArtVault</text>
</svg>`
}

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate SVGs for each size
sizes.forEach(size => {
  const svg = generateSVG(size)
  const filename = `icon-${size}x${size}.svg`
  fs.writeFileSync(path.join(iconsDir, filename), svg)
  console.log(`Generated ${filename}`)
})

console.log('\n✓ SVG icons generated!')
console.log('\nNote: For production, convert these SVGs to PNGs using:')
console.log('- Online tool: https://cloudconvert.com/svg-to-png')
console.log('- Or install sharp: npm install sharp && node scripts/convert-to-png.js')
