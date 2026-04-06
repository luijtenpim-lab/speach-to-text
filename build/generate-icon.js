#!/usr/bin/env node
/**
 * Generates build/icon.png (1024x1024) — Voxa app icon.
 * Run: node build/generate-icon.js
 */
const sharp = require('sharp')
const path  = require('path')

const SIZE = 1024

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A0830"/>
      <stop offset="100%" stop-color="#0A0A0A"/>
    </linearGradient>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333EA"/>
      <stop offset="100%" stop-color="#D946EF"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#D946EF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#9333EA" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <ellipse cx="512" cy="430" rx="420" ry="380" fill="url(#glow)"/>

  <!-- Mic capsule body -->
  <rect x="382" y="148" width="260" height="400" rx="130" fill="url(#grad)"/>

  <!-- Stand arc -->
  <path d="M 260 450 Q 260 700 512 700 Q 764 700 764 450"
        stroke="url(#grad)" stroke-width="56" fill="none" stroke-linecap="round"/>

  <!-- Vertical stem -->
  <line x1="512" y1="700" x2="512" y2="820"
        stroke="url(#grad)" stroke-width="56" stroke-linecap="round"/>

  <!-- Base -->
  <line x1="330" y1="820" x2="694" y2="820"
        stroke="url(#grad)" stroke-width="56" stroke-linecap="round"/>

  <!-- Circuit node dots (brand detail) -->
  <circle cx="382" cy="200" r="18" fill="#F0ABFC" opacity="0.7"/>
  <circle cx="642" cy="200" r="18" fill="#F0ABFC" opacity="0.7"/>
  <circle cx="382" cy="496" r="18" fill="#F0ABFC" opacity="0.7"/>
  <circle cx="642" cy="496" r="18" fill="#F0ABFC" opacity="0.7"/>
</svg>`

const outPath = path.join(__dirname, 'icon.png')

sharp(Buffer.from(svg))
  .resize(SIZE, SIZE)
  .png()
  .toFile(outPath)
  .then(() => console.log(`✓ Icon written to ${outPath}`))
  .catch(err => { console.error('Error:', err); process.exit(1) })
