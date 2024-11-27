const fs = require('fs');
const axios = require('axios');
const { createCanvas } = require('canvas');
const csv = require('csv-parser');

// Alphabet-Farben zuordnen
const alphabetColors = (() => {
  const colors = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((char, index) => {
    const hue = (index * 360) / 26; // Jede Farbe basierend auf dem Alphabet
    colors[char] = `hsl(${hue}, 100%, 50%)`;
  });
  return colors;
})();

// Farben für ISO-Code erhalten
function getColorsForISO(code) {
  return code.toUpperCase().split('').map((char) => alphabetColors[char] || '#000000');
}

// Runde Flagge generieren
function createFlag(isoCode, colors, size = 200) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const ringWidth = size / (2 * colors.length); // Breite der Farbringe
  colors.forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - index * ringWidth, 0, Math.PI * 2);
    ctx.arc(size / 2, size / 2, size / 2 - (index + 1) * ringWidth, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });

  return canvas.toBuffer(); // Rückgabe als Bildpuffer
}

// Hauptprozess
async function main() {
  try {
    // CSV-Datei herunterladen und verarbeiten
    const csvUrl = 'https://datahub.io/core/language-codes/r/language-codes.csv';
    const response = await axios.get(csvUrl, { responseType: 'stream' });

    const languages = [];
    response.data
      .pipe(csv())
      .on('data', (row) => {
        if (row['alpha2']) {
          languages.push(row['alpha2']);
        }
      })
      .on('end', () => {
        console.log(`Fetched ${languages.length} language codes.`);

        // Sicherstellen, dass Flags-Ordner existiert
        const flagsDir = './flags';
        if (!fs.existsSync(flagsDir)) {
          fs.mkdirSync(flagsDir);
        }

        // Flags generieren und speichern
        languages.forEach((isoCode) => {
          const colors = getColorsForISO(isoCode);
          const flag = createFlag(isoCode, colors);

          const filePath = `${flagsDir}/${isoCode}.png`;
          fs.writeFileSync(filePath, flag);
          console.log(`Generated flag for ${isoCode}`);
        });
      });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
