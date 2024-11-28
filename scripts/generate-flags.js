const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const ISO6391 = require('iso-639-1');
const countries = require('country-codes-list').customList('countryCode', '{officialLanguageISO6391Code}');

// Map characters to colors
const charToColor = (char) => {
  const code = char.toUpperCase().charCodeAt(0);
  const hue = (code % 36) * 10; // Spread hues across the spectrum
  return `hsl(${hue}, 100%, 50%)`;
};

// Generate flag for a given language code
const generateFlag = (langCode) => {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  const chars = langCode.split('');
  const segmentAngle = (2 * Math.PI) / chars.length;

  chars.forEach((char, index) => {
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.arc(100, 100, 100, index * segmentAngle, (index + 1) * segmentAngle);
    ctx.closePath();
    ctx.fillStyle = charToColor(char);
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
    console.log('Retrieving country and language codes...');

    const locales = Object.entries(countries)
      .map(([countryCode, langCode]) => {
        if (ISO6391.validate(langCode)) {
          return `${langCode}-${countryCode}`;
        } else {
          console.warn(`Invalid language code: ${langCode} for country: ${countryCode}`);
          return null;
        }
      })
      .filter((locale) => locale !== null);

    if (locales.length === 0) {
      console.error('No valid locales found! Exiting.');
      return;
    }

    console.log(`Found ${locales.length} valid locales:`, locales);

    // Ensure the flags directory exists
    if (!fs.existsSync(flagsDir)) {
      fs.mkdirSync(flagsDir);
      console.log('Created flags directory.');
    } else {
      clearFlagsDirectory(flagsDir);
    }

    // Generate flags
    locales.forEach((locale) => {
      try {
        const buffer = generateFlag(locale);
        const filePath = path.join(flagsDir, `${locale}.png`);
        fs.writeFileSync(filePath, buffer);
        console.log(`Generated flag for: ${locale}`);
      } catch (error) {
        console.error(`Failed to generate flag for: ${locale}`, error);
      }
    });

    console.log('All flags generated successfully.');
  } catch (error) {
    console.error('Unexpected error during flag generation:', error);
  }
})();
