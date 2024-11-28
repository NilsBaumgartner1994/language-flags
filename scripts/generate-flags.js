const fs = require('fs');
const axios = require('axios');
const { createCanvas } = require('canvas');
const csv = require('csv-parser');
const path = require('path');

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

// Ordner löschen
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const currentPath = path.join(folderPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteFolderRecursive(currentPath);
      } else {
        fs.unlinkSync(currentPath); // Datei löschen
      }
    });
    fs.rmdirSync(folderPath); // Ordner löschen
  }
}

// Hauptprozess
async function main() {
  try {
    const csvUrl = 'https://gist.githubusercontent.com/umpirsky/6e95c86837d2e441e035/raw/locale.csv';
    const locales = [];

    // Versuche, die Online-CSV-Datei herunterzuladen
    try {
      const response = await axios.get(csvUrl, { responseType: 'stream' });
      response.data
        .pipe(csv())
        .on('data', (row) => {
          if (row['locale']) {
            locales.push(row['locale']);
          }
        })
        .on('end', () => processLocales(locales));
    } catch (error) {
      console.error('Online file unavailable. Using local fallback.');
      // Lokale CSV-Datei lesen
      fs.createReadStream('./scripts/locales.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (row['locale']) {
            locales.push(row['locale']);
          }
        })
        .on('end', () => processLocales(locales));
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Locale-Daten verarbeiten und Flaggen generieren
function processLocales(locales) {
  console.log(`Processing ${locales.length} locale codes.`);

  // Flags-Ordner löschen und neu erstellen
  const flagsDir = './flags';
  deleteFolderRecursive(flagsDir);
  fs.mkdirSync(flagsDir);

  // Flags generieren und speichern
  locales.forEach((locale) => {
    const colors = getColorsForISO(locale);
    const flag = createFlag(locale, colors);

    const filePath = `${flagsDir}/${locale}.png`;
    fs.writeFileSync(filePath, flag);
    console.log(`Generated flag for ${locale}`);
  });
}

main();
