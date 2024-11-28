const fs = require('fs');
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

// Ensure flags directory exists
if (!fs.existsSync('flags')) {
  fs.mkdirSync('flags');
}

// Generate flags for all language-country combinations
Object.entries(countries).forEach(([countryCode, langCode]) => {
  if (ISO6391.validate(langCode)) {
    const fullCode = `${langCode}-${countryCode}`;
    const buffer = generateFlag(fullCode);
    fs.writeFileSync(`flags/${fullCode}.png`, buffer);
    console.log(`Generated flag for ${fullCode}`);
  }
});
