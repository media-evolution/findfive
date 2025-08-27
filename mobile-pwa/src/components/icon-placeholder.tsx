// This is a temporary solution for PWA icons
// In production, you should create proper icon files

export function generatePWAIcon(size: number, color: string = '#FF6B6B'): string {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.15}"/>
      <circle cx="${size/2}" cy="${size * 0.35}" r="${size * 0.15}" fill="white"/>
      <path d="M${size * 0.25} ${size * 0.55} Q${size/2} ${size * 0.65} ${size * 0.75} ${size * 0.55}" 
            stroke="white" stroke-width="${size * 0.05}" fill="none" stroke-linecap="round"/>
      <text x="${size/2}" y="${size * 0.85}" text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${size * 0.08}" fill="white" font-weight="bold">5</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}