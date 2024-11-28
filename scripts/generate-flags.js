const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const locale = require('locale-codes');

// Map characters to colors
const charToColor = (char) => {
  const code = char.toUpperCase().charCodeAt(0);
  const hue = (code % 36) * 10; // Spread hues across the spectrum
  return `hsl(${hue}, 100%, 50%)`;
};

// Generate donut-shaped flag for a given locale code
const generateFlag = (isoCode) => {
  const parts = isoCode.split('-'); // Split into language and region
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  const centerRadius = 50; // Radius of the empty center
  const ringWidth = (100 - centerRadius) / parts.length; // Width of each ring

  parts.forEach((part, index) => {
    const color = charToColor(part); // Generate a color for the part
    const outerRadius = 100 - index * ringWidth; // Outer radius of the ring
    const innerRadius = outerRadius - ringWidth; // Inner radius of the ring

    // Draw the ring
    ctx.beginPath();
    ctx.arc(100, 100, outerRadius, 0, Math.PI * 2);
    ctx.arc(100, 100, innerRadius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });

  return canvas.toBuffer();
};

// Delete all files in the flags directory
const clearFlagsDirectory = (flagsDir) => {
  if (fs.existsSync(flagsDir)) {
    fs.readdirSync(flagsDir).forEach((file) => {
      const filePath = path.join(flagsDir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    });
    console.log('Flags directory cleared.');
  }
};

// Main process
(async () => {
  const flagsDir = './flags';

  try {
    console.log('Starting flag generation process...');
    console.log('Retrieving locale codes...');

    // Get all locales with both language and region
    const locales = locale.all.filter((loc) => loc.tag.includes('-'));

    if (locales.length === 0) {
      console.error('No valid locales found! Exiting.');
      return;
    }

    console.log(`Found ${locales.length} valid locales:`, locales.map((l) => l.tag));

    // Ensure the flags directory exists
    if (!fs.existsSync(flagsDir)) {
      fs.mkdirSync(flagsDir);
      console.log('Created flags directory.');
    } else {
      clearFlagsDirectory(flagsDir);
    }

    // Generate flags
    locales.forEach((loc) => {
      try {
        const buffer = generateFlag(loc.tag);
        const filePath = path.join(flagsDir, `${loc.tag}.png`);
        fs.writeFileSync(filePath, buffer);
        console.log(`Generated flag for: ${loc.tag}`);
      } catch (error) {
        console.error(`Failed to generate flag for: ${loc.tag}`, error);
      }
    });

    console.log('All flags generated successfully.');
  } catch (error) {
    console.error('Unexpected error during flag generation:', error);
  }
})();
