const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const locale = require('locale-codes');

// Map characters to colors with improved diversity
const charToColor = (char, index) => {
  const code = char.toUpperCase().charCodeAt(0);
  const hue = (code % 26) * (360 / 26); // Spread hues evenly across the spectrum
  const saturation = 70 + (index % 2) * 10; // Alternate between 70% and 80% saturation
  const lightness = 50 + (index % 2) * 10; // Alternate between 50% and 60% lightness
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Generate circular flag for a given locale code with black lines
const generateFlag = (isoCode) => {
  const chars = isoCode.replace('-', '').split(''); // Remove dash and split into characters
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  const ringWidth = 100 / chars.length; // Width of each ring

  chars.forEach((char, index) => {
    const color = charToColor(char, index); // Generate a color for the character
    const outerRadius = 100 - index * ringWidth; // Outer radius for the current ring
    const innerRadius = outerRadius - ringWidth; // Inner radius for the current ring

    // Draw the ring segment
    ctx.beginPath();
    ctx.arc(100, 100, outerRadius, 0, Math.PI * 2);
    ctx.arc(100, 100, innerRadius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Draw black line to separate this ring
    ctx.beginPath();
    ctx.arc(100, 100, outerRadius, 0, Math.PI * 2);
    ctx.arc(100, 100, innerRadius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.lineWidth = 2; // Line thickness
    ctx.strokeStyle = 'black';
    ctx.stroke();
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
