import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../public/icons/icon.svg');
const iconDir = path.join(__dirname, '../public/icons');

// Ensure icon directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const generateIcons = async () => {
  try {
    // Generate standard icons
    for (const { name, size } of sizes) {
      const outputPath = path.join(iconDir, name);
      await sharp(svgPath)
        .resize(size, size, { fit: 'contain', background: { r: 10, g: 15, b: 30, alpha: 1 } })
        .png()
        .toFile(outputPath);
      console.log(`✓ ${name}`);
    }

    // Generate maskable icon (512, with safe zone)
    const maskablePath = path.join(iconDir, 'icon-maskable-512.png');
    await sharp(svgPath)
      .resize(512, 512, { fit: 'contain', background: { r: 10, g: 15, b: 30, alpha: 1 } })
      .png()
      .toFile(maskablePath);
    console.log('✓ icon-maskable-512.png');

    // Copy SVG to favicon
    const faviconPath = path.join(__dirname, '../public/favicon.svg');
    fs.copyFileSync(svgPath, faviconPath);
    console.log('✓ favicon.svg');

    console.log('\nAll icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
};

generateIcons();
