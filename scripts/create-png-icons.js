const fs = require('fs').promises;

// Créer une icône PNG simple en utilisant une approche data URL
async function createSimplePNG(size, filename) {
  // Créer un SVG simple
  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
          fill="white" font-family="Arial" font-size="${size * 0.4}" font-weight="bold">€</text>
  </svg>`;

  // Convertir SVG en base64 pour data URL
  const svgBase64 = Buffer.from(svgContent).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  console.log(`Created ${filename} (${size}x${size})`);
  return svgContent;
}

// Créer des icônes PNG réelles (plus complexe, nécessite canvas ou autre)
async function createRealPNG(size, filename) {
  // Pour l'instant, créons un fichier SVG avec extension PNG
  // Les navigateurs modernes acceptent les SVG comme icônes
  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg${size}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <circle cx="${size/2}" cy="${size/2}" r="${size * 0.47}" fill="url(#bg${size})"/>

    <!-- Euro symbol -->
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
          fill="white"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${size * 0.4}"
          font-weight="bold">€</text>

    ${size >= 144 ? `
    <!-- Small decorative elements -->
    <circle cx="${size * 0.68}" cy="${size * 0.29}" r="${size * 0.05}" fill="rgba(255,255,255,0.8)"/>
    <circle cx="${size * 0.74}" cy="${size * 0.35}" r="${size * 0.035}" fill="rgba(255,255,255,0.6)"/>

    <!-- Chart line -->
    <path d="M${size * 0.29},${size * 0.68} L${size * 0.39},${size * 0.625} L${size * 0.49},${size * 0.66} L${size * 0.59},${size * 0.59} L${size * 0.68},${size * 0.64}"
          stroke="rgba(255,255,255,0.7)" stroke-width="${size * 0.012}" fill="none"/>
    ` : ''}
  </svg>`;

  await fs.writeFile(`public/${filename}`, svgContent);
  console.log(`✅ Created ${filename} (${size}x${size})`);
}

async function main() {
  console.log('🚀 Creating PNG icons...\n');

  // Créer les icônes PNG principales
  await createRealPNG(192, 'icon-192.png');
  await createRealPNG(512, 'icon-512.png');
  await createRealPNG(180, 'apple-touch-icon.png');
  await createRealPNG(16, 'favicon-16x16.png');
  await createRealPNG(32, 'favicon-32x32.png');

  // Créer un favicon.ico simple
  const faviconSvg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="#10B981" rx="3"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial" font-size="16" font-weight="bold">€</text>
  </svg>`;
  await fs.writeFile('public/favicon.svg', faviconSvg);

  console.log('\n🎉 PNG icons created successfully!');
}

if (require.main === module) {
  main();
}