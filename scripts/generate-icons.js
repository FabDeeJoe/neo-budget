const fs = require('fs').promises;
const { createCanvas, loadImage } = require('canvas');

// Icône en base64 (SVG converti)
const iconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="240" fill="#10B981" />
  <path d="M320 180C320 140 290 120 240 120C190 120 160 150 160 180H200C200 170 215 160 240 160C265 160 280 170 280 180C280 190 265 200 240 200H220V240H240C265 240 280 250 280 260C280 270 265 280 240 280C215 280 200 270 200 260H160C160 290 190 320 240 320C290 320 320 300 320 260C320 240 305 225 280 215C305 205 320 190 320 180Z" fill="white"/>
  <circle cx="350" cy="150" r="25" fill="white" opacity="0.8"/>
  <circle cx="380" cy="180" r="18" fill="white" opacity="0.6"/>
  <path d="M150 350 L200 320 L250 340 L300 300 L350 330" stroke="white" stroke-width="6" fill="none" opacity="0.7"/>
  <rect x="120" y="380" width="40" height="8" rx="4" fill="white" opacity="0.6"/>
  <rect x="120" y="400" width="60" height="8" rx="4" fill="white" opacity="0.4"/>
  <rect x="120" y="420" width="30" height="8" rx="4" fill="white" opacity="0.5"/>
</svg>`;

async function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background circle
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, '#10B981');
  gradient.addColorStop(1, '#059669');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw circle
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.47, 0, 2 * Math.PI);
  ctx.fillStyle = '#10B981';
  ctx.fill();

  // Draw Euro symbol
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('€', size/2, size/2);

  // Add small details for larger icons
  if (size >= 192) {
    // Small circles
    ctx.beginPath();
    ctx.arc(size * 0.68, size * 0.29, size * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(size * 0.74, size * 0.35, size * 0.035, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    // Chart line
    ctx.beginPath();
    ctx.moveTo(size * 0.29, size * 0.68);
    ctx.lineTo(size * 0.39, size * 0.625);
    ctx.lineTo(size * 0.49, size * 0.66);
    ctx.lineTo(size * 0.59, size * 0.59);
    ctx.lineTo(size * 0.68, size * 0.64);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = size * 0.012;
    ctx.stroke();
  }

  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(`public/${filename}`, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

async function generateIcons() {
  console.log('Generating PWA icons...');

  try {
    // Standard PWA icons
    await generateIcon(16, 'favicon-16x16.png');
    await generateIcon(32, 'favicon-32x32.png');
    await generateIcon(48, 'favicon-48x48.png');
    await generateIcon(72, 'icon-72x72.png');
    await generateIcon(96, 'icon-96x96.png');
    await generateIcon(128, 'icon-128x128.png');
    await generateIcon(144, 'icon-144x144.png');
    await generateIcon(152, 'icon-152x152.png');
    await generateIcon(192, 'icon-192x192.png');
    await generateIcon(384, 'icon-384x384.png');
    await generateIcon(512, 'icon-512x512.png');

    // Apple Touch icons
    await generateIcon(180, 'apple-touch-icon.png');
    await generateIcon(167, 'apple-touch-icon-ipad.png');

    console.log('✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);

    // Fallback: create simple colored square icons without canvas
    console.log('Creating fallback icons...');
    await createFallbackIcons();
  }
}

async function createFallbackIcons() {
  // Simple SVG-based fallback
  const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512, 180, 167];

  for (const size of sizes) {
    const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#10B981" rx="${size * 0.1}"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial" font-size="${size * 0.4}" font-weight="bold">€</text>
    </svg>`;

    const filename = size === 180 ? 'apple-touch-icon.png' :
                    size === 167 ? 'apple-touch-icon-ipad.png' :
                    size <= 48 ? `favicon-${size}x${size}.png` :
                    `icon-${size}x${size}.png`;

    // For now, save as SVG (browsers can handle SVG icons)
    const svgFilename = filename.replace('.png', '.svg');
    await fs.writeFile(`public/${svgFilename}`, svgContent);
    console.log(`Generated ${svgFilename} (${size}x${size})`);
  }
}

// Try to install canvas if needed
async function installCanvas() {
  try {
    require('canvas');
    return true;
  } catch (error) {
    console.log('Canvas not found, installing...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install canvas', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.log('Could not install canvas, using fallback method');
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  installCanvas().then(hasCanvas => {
    if (hasCanvas) {
      generateIcons();
    } else {
      createFallbackIcons();
    }
  });
}

module.exports = { generateIcons, createFallbackIcons };