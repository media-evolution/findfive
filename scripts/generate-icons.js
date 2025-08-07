// Simple script to generate placeholder PWA icons using SVG
// In production, you should use proper icon files from a designer

const fs = require('fs');
const path = require('path');

function generateSVGIcon(size, color = '#FF6B6B') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.15}"/>
  <circle cx="${size/2}" cy="${size * 0.35}" r="${size * 0.15}" fill="white"/>
  <path d="M${size * 0.25} ${size * 0.55} Q${size/2} ${size * 0.65} ${size * 0.75} ${size * 0.55}" 
        stroke="white" stroke-width="${size * 0.05}" fill="none" stroke-linecap="round"/>
  <text x="${size/2}" y="${size * 0.85}" text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${size * 0.08}" fill="white" font-weight="bold">5</text>
</svg>`;
}

// Generate icon files
const publicDir = path.join(__dirname, '..', 'public');
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Generate a simple favicon
const favicon = generateSVGIcon(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), favicon);
console.log('Generated favicon.svg');

console.log('PWA icons generated successfully!');
console.log('Note: For production, replace these with proper PNG icons from a designer.');