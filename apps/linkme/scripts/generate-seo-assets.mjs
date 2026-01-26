/**
 * Script de generation des assets SEO pour LinkMe
 *
 * Genere:
 * - favicon.ico (32x32, 16x16)
 * - apple-touch-icon.png (180x180)
 * - android-chrome-192x192.png
 * - android-chrome-512x512.png
 * - og-image.png (1200x630)
 *
 * Usage: node scripts/generate-seo-assets.mjs
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Couleurs LinkMe
const COLORS = {
  primary: '#5DBEBB',
  secondary: '#7E84C0',
  dark: '#183559',
  white: '#FFFFFF',
};

/**
 * Cree une image de base avec le logo LinkMe
 */
async function createBaseIcon(size) {
  // Creer un SVG avec le L stylise
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.primary}"/>
          <stop offset="100%" style="stop-color:${COLORS.secondary}"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
      <text x="50%" y="58%"
            font-family="Arial, sans-serif"
            font-size="${size * 0.55}"
            font-weight="bold"
            fill="white"
            text-anchor="middle"
            dominant-baseline="middle">L</text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * Cree l'image Open Graph (1200x630)
 */
async function createOGImage() {
  const width = 1200;
  const height = 630;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.dark}"/>
          <stop offset="100%" style="stop-color:#2a5080"/>
        </linearGradient>
        <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${COLORS.primary}"/>
          <stop offset="100%" style="stop-color:${COLORS.secondary}"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg-grad)"/>

      <!-- Decorative circles -->
      <circle cx="1100" cy="100" r="200" fill="${COLORS.primary}" opacity="0.1"/>
      <circle cx="100" cy="530" r="150" fill="${COLORS.secondary}" opacity="0.1"/>

      <!-- Logo icon -->
      <rect x="80" y="200" width="120" height="120" rx="24" fill="url(#accent-grad)"/>
      <text x="140" y="275"
            font-family="Arial, sans-serif"
            font-size="70"
            font-weight="bold"
            fill="white"
            text-anchor="middle"
            dominant-baseline="middle">L</text>

      <!-- Title -->
      <text x="230" y="250"
            font-family="Arial, sans-serif"
            font-size="64"
            font-weight="bold"
            fill="white">LinkMe</text>

      <!-- Subtitle -->
      <text x="80" y="380"
            font-family="Arial, sans-serif"
            font-size="32"
            fill="white"
            opacity="0.9">Plateforme d'affiliation B2B</text>

      <text x="80" y="430"
            font-family="Arial, sans-serif"
            font-size="28"
            fill="white"
            opacity="0.7">Mobilier et decoration d'interieur</text>

      <!-- Accent bar -->
      <rect x="80" y="480" width="400" height="4" rx="2" fill="url(#accent-grad)"/>

      <!-- Stats -->
      <text x="80" y="540"
            font-family="Arial, sans-serif"
            font-size="20"
            fill="${COLORS.primary}">✓ Commission 5%</text>
      <text x="300" y="540"
            font-family="Arial, sans-serif"
            font-size="20"
            fill="${COLORS.primary}">✓ Paiement securise</text>
      <text x="550" y="540"
            font-family="Arial, sans-serif"
            font-size="20"
            fill="${COLORS.primary}">✓ Suivi temps reel</text>

      <!-- Verone branding -->
      <text x="1120" y="590"
            font-family="Arial, sans-serif"
            font-size="16"
            fill="white"
            opacity="0.5"
            text-anchor="end">by Verone</text>
    </svg>
  `;

  return Buffer.from(svg);
}

async function main() {
  console.log('Generation des assets SEO...\n');

  try {
    // 1. Favicon / Icons
    console.log('1. Creation des icones...');

    // apple-touch-icon.png (180x180)
    const icon180 = await createBaseIcon(180);
    await sharp(icon180)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('   ✓ apple-touch-icon.png (180x180)');

    // android-chrome-192x192.png
    const icon192 = await createBaseIcon(192);
    await sharp(icon192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
    console.log('   ✓ android-chrome-192x192.png');

    // android-chrome-512x512.png
    const icon512 = await createBaseIcon(512);
    await sharp(icon512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));
    console.log('   ✓ android-chrome-512x512.png');

    // favicon-32x32.png
    const icon32 = await createBaseIcon(32);
    await sharp(icon32)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    console.log('   ✓ favicon-32x32.png');

    // favicon-16x16.png
    const icon16 = await createBaseIcon(16);
    await sharp(icon16)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
    console.log('   ✓ favicon-16x16.png');

    // favicon.ico (using 32x32 PNG as base)
    // Note: Sharp ne supporte pas ICO nativement, on copie le PNG
    await fs.copyFile(
      path.join(PUBLIC_DIR, 'favicon-32x32.png'),
      path.join(PUBLIC_DIR, 'favicon.ico')
    );
    console.log('   ✓ favicon.ico (from 32x32)');

    // 2. Open Graph image
    console.log('\n2. Creation de l\'image Open Graph...');
    const ogImage = await createOGImage();
    await sharp(ogImage)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'og-image.png'));
    console.log('   ✓ og-image.png (1200x630)');

    console.log('\n✅ Tous les assets SEO ont ete generes avec succes!');
    console.log(`   Dossier: ${PUBLIC_DIR}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
