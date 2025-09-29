const fs = require('fs').promises;
const path = require('path');

async function createIcon(size, filename) {
  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </radialGradient>
    </defs>

    <!-- Background circle -->
    <circle cx="${size/2}" cy="${size/2}" r="${size * 0.47}" fill="url(#bg)"/>

    <!-- Euro symbol -->
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
          fill="white"
          font-family="Arial, sans-serif"
          font-size="${size * 0.4}"
          font-weight="bold">€</text>

    ${size >= 192 ? `
    <!-- Small decorative elements for larger icons -->
    <circle cx="${size * 0.68}" cy="${size * 0.29}" r="${size * 0.05}" fill="rgba(255,255,255,0.8)"/>
    <circle cx="${size * 0.74}" cy="${size * 0.35}" r="${size * 0.035}" fill="rgba(255,255,255,0.6)"/>

    <!-- Chart line -->
    <path d="M${size * 0.29},${size * 0.68} L${size * 0.39},${size * 0.625} L${size * 0.49},${size * 0.66} L${size * 0.59},${size * 0.59} L${size * 0.68},${size * 0.64}"
          stroke="rgba(255,255,255,0.7)"
          stroke-width="${size * 0.012}"
          fill="none"/>
    ` : ''}
  </svg>`;

  const publicPath = path.join(process.cwd(), 'public');
  await fs.writeFile(path.join(publicPath, filename), svgContent);
  console.log(`✅ Generated ${filename} (${size}x${size})`);
}

async function generateAllIcons() {
  console.log('🚀 Generating PWA icons...\n');

  const icons = [
    // Favicons
    { size: 16, name: 'favicon-16x16.svg' },
    { size: 32, name: 'favicon-32x32.svg' },
    { size: 48, name: 'favicon-48x48.svg' },

    // PWA icons
    { size: 72, name: 'icon-72x72.svg' },
    { size: 96, name: 'icon-96x96.svg' },
    { size: 128, name: 'icon-128x128.svg' },
    { size: 144, name: 'icon-144x144.svg' },
    { size: 152, name: 'icon-152x152.svg' },
    { size: 192, name: 'icon-192x192.svg' },
    { size: 384, name: 'icon-384x384.svg' },
    { size: 512, name: 'icon-512x512.svg' },

    // Apple icons
    { size: 180, name: 'apple-touch-icon.svg' },
    { size: 167, name: 'apple-touch-icon-ipad.svg' },
  ];

  try {
    // Ensure public directory exists
    const publicPath = path.join(process.cwd(), 'public');
    await fs.mkdir(publicPath, { recursive: true });

    // Generate all icons
    for (const icon of icons) {
      await createIcon(icon.size, icon.name);
    }

    console.log('\n🎉 All PWA icons generated successfully!');
    console.log('📱 Your app is now ready for installation!');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
}

// Run the script
if (require.main === module) {
  generateAllIcons();
}

module.exports = { generateAllIcons };