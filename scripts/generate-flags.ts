import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { create } from 'xmlbuilder2';
import locale from 'locale-codes';

// Types for SVG creation
interface SvgRing {
  outerRadius: number;
  innerRadius: number;
  color: string;
  centerX: number;
  centerY: number;
  strokeColor: string;
  strokeWidth: number;
}

const charToColor = (char: string, index: number): string => {
  const code = char.toUpperCase().charCodeAt(0); // Ensure case insensitivity
  const hue = (code % 26) * (360 / 26); // Spread hues evenly across the spectrum
  const saturation = 70 + (index % 2) * 10; // Alternate between 70% and 80% saturation
  const lightness = 50 + (index % 2) * 10; // Alternate between 50% and 60% lightness
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Function to add a black dot at the center
const drawCenterDot = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.arc(128, 128, 10, 0, Math.PI * 2); // Small black dot in the center
  ctx.fillStyle = 'black';
  ctx.fill();
};

// Generate PNG flag for a given locale code with a center dot
const generateFlagPng = (isoCode: string): Buffer => {
  const chars = isoCode.replace('-', '').toUpperCase().split('');
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  const maxRadius = 256 / 2;
  const ringWidth = maxRadius / chars.length;

  chars.forEach((char, index) => {
    const color = charToColor(char, index);
    const outerRadius = maxRadius - index * ringWidth;
    const innerRadius = Math.max(outerRadius - ringWidth, 0);

    ctx.beginPath();
    ctx.arc(128, 128, outerRadius, 0, Math.PI * 2, false);
    ctx.arc(128, 128, innerRadius, Math.PI * 2, 0, true);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(128, 128, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    if (innerRadius > 0) {
      ctx.beginPath();
      ctx.arc(128, 128, innerRadius, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }
  });

  // Draw the innermost center dot if required
  const lastColor = charToColor(chars[chars.length - 1], chars.length - 1);
  ctx.beginPath();
  ctx.arc(128, 128, ringWidth / 2, 0, Math.PI * 2); // Center radius as half of `ringWidth`
  ctx.fillStyle = lastColor;
  ctx.fill();

  // Add a black dot for final aesthetic
  // @ts-ignore
  drawCenterDot(ctx);

  return canvas.toBuffer();
};


// Generate SVG flag for a given locale code with a center dot
const generateFlagSvg = (isoCode: string): string => {
  const chars = isoCode.replace('-', '').split('');
  const maxRadius = 128;
  const ringWidth = Math.min(maxRadius / chars.length, maxRadius / 4);
  const rings: SvgRing[] = [];

  chars.forEach((char, index) => {
    const color = charToColor(char, index);
    const outerRadius = maxRadius - index * ringWidth;
    const innerRadius = Math.max(outerRadius - ringWidth, 0);

    if (outerRadius <= 0 || innerRadius <= 0) return;

    rings.push({
      outerRadius,
      innerRadius,
      color,
      centerX: 128,
      centerY: 128,
      strokeColor: 'black',
      strokeWidth: 2,
    });
  });

  // Generate SVG
  const svg = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 256 256' })
      .ele('g');

  rings.forEach((ring) => {
    svg
        .ele('circle', {
          cx: ring.centerX,
          cy: ring.centerY,
          r: ring.outerRadius,
          fill: ring.color,
          stroke: ring.strokeColor,
          'stroke-width': ring.strokeWidth,
        })
        .up();
  });

  // Add a black dot in the center
  svg
      .ele('circle', {
        cx: 128,
        cy: 128,
        r: 10,
        fill: 'black',
      })
      .up();

  return svg.end({ prettyPrint: true });
};

// Debug function to print color and radius information
const generateFlagDebug = (isoCode: string): void => {
  const chars = isoCode.replace('-', '').toUpperCase().split(''); // Remove dash and ensure case insensitivity
  const maxRadius = 128; // Outer radius
  const ringWidth = maxRadius / chars.length; // Divide evenly for all characters

  console.log(`Generating flag for: ${isoCode}`);
  console.log(`Characters: ${chars.join(', ')}`);
  console.log(`Max Radius: ${maxRadius}, Ring Width: ${ringWidth}`);

  chars.forEach((char, index) => {
    const color = charToColor(char, index); // Generate a color for the character
    const outerRadius = maxRadius - index * ringWidth; // Outer radius for the current ring
    const innerRadius = Math.max(outerRadius - ringWidth, 0); // Clamp innerRadius to non-negative

    if (index === chars.length - 1 && innerRadius === 0) {
      // Ensure the last character is drawn as a filled circle in the center
      console.log(
          `Center Ring: Character = ${char}, Color = ${color}, Radius = ${outerRadius}`
      );
    } else {
      console.log(
          `Ring ${index + 1}: Character = ${char}, Color = ${color}, Outer Radius = ${outerRadius}, Inner Radius = ${innerRadius}`
      );
    }
  });

  console.log("Center should have a black dot.");
};

// Delete all files in the flags directory
const clearFlagsDirectory = (flagsDir: string): void => {
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

    // Debug flag generation for de-DE
    generateFlagDebug('de-DE');

    // Generate flags
    locales.forEach((loc) => {
      try {
        const pngBuffer = generateFlagPng(loc.tag);
        const svgContent = generateFlagSvg(loc.tag);

        const pngPath = path.join(flagsDir, `${loc.tag}.png`);
        const svgPath = path.join(flagsDir, `${loc.tag}.svg`);

        fs.writeFileSync(pngPath, pngBuffer);
        fs.writeFileSync(svgPath, svgContent);

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
