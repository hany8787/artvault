// Script pour générer les icônes PWA
// Exécuter: node scripts/generate-icons.cjs
// Nécessite: npm install sharp canvas

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Couleurs ArtVault
const BG_COLOR = '#221e10';
const ACCENT_COLOR = '#f2b90d';

function drawIcon(ctx, size) {
  // Background
  ctx.fillStyle = BG_COLOR;
  const radius = size * 0.15;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.fill();
  
  // Frame outer
  ctx.strokeStyle = ACCENT_COLOR;
  ctx.lineWidth = size * 0.03;
  const margin = size * 0.15;
  roundRect(ctx, margin, margin, size - margin * 2, size - margin * 2, size * 0.04);
  ctx.stroke();
  
  // Frame inner
  ctx.lineWidth = size * 0.008;
  ctx.globalAlpha = 0.5;
  const innerMargin = size * 0.21;
  roundRect(ctx, innerMargin, innerMargin, size - innerMargin * 2, size - innerMargin * 2, size * 0.02);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Letter A
  ctx.fillStyle = ACCENT_COLOR;
  ctx.beginPath();
  const centerX = size / 2;
  const topY = size * 0.31;
  const bottomY = size * 0.69;
  const halfWidth = size * 0.16;
  
  ctx.moveTo(centerX, topY);
  ctx.lineTo(centerX - halfWidth, bottomY);
  ctx.lineTo(centerX - halfWidth + size * 0.05, bottomY);
  ctx.lineTo(centerX - halfWidth * 0.55, bottomY - size * 0.1);
  ctx.lineTo(centerX + halfWidth * 0.55, bottomY - size * 0.1);
  ctx.lineTo(centerX + halfWidth - size * 0.05, bottomY);
  ctx.lineTo(centerX + halfWidth, bottomY);
  ctx.closePath();
  ctx.fill();
  
  // Inner triangle cutout (simulated by drawing background color)
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.moveTo(centerX - halfWidth * 0.35, bottomY - size * 0.15);
  ctx.lineTo(centerX, topY + size * 0.15);
  ctx.lineTo(centerX + halfWidth * 0.35, bottomY - size * 0.15);
  ctx.closePath();
  ctx.fill();
  
  // Small dot accent
  ctx.fillStyle = ACCENT_COLOR;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(centerX, size * 0.74, size * 0.02, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    drawIcon(ctx, size);
    
    const buffer = canvas.toBuffer('image/png');
    const filename = size === 32 ? 'icon-32x32.png' : `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    
    console.log(`✓ Generated ${filename}`);
  }
  
  // Copy 32x32 as favicon
  fs.copyFileSync(
    path.join(outputDir, 'icon-32x32.png'),
    path.join(__dirname, '../public/favicon.png')
  );
  
  console.log('✓ Generated favicon.png');
  console.log('\nDone! All icons generated.');
}

generateIcons().catch(console.error);
