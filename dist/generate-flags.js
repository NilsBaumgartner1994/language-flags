"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const canvas_1 = require("canvas");
const xmlbuilder2_1 = require("xmlbuilder2");
const locale_codes_1 = __importDefault(require("locale-codes"));
const centerDotRadius = 10;
// Function to map characters to colors
const charToColor = (char, index) => {
    const code = char.toUpperCase().charCodeAt(0); // Ensure case insensitivity
    const hue = (code % 26) * (360 / 26); // Spread hues evenly across the spectrum
    const saturation = 70 + (index % 2) * 10; // Alternate between 70% and 80% saturation
    const lightness = 50 + (index % 2) * 10; // Alternate between 50% and 60% lightness
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
// Function to calculate ring segments
const generateRings = (isoCode, maxRadius) => {
    const chars = isoCode.replace('-', '').toUpperCase().split('');
    const ringWidth = (maxRadius - centerDotRadius) / chars.length; // Divide equally for all characters
    console.log(`Ring Width: ${ringWidth}`);
    console.log("Chars: ", chars + " length: " + chars.length);
    const rings = [];
    chars.forEach((char, index) => {
        const color = charToColor(char, index);
        const outerRadius = maxRadius - index * ringWidth;
        const innerRadius = Math.max(outerRadius - ringWidth, 0);
        rings.push({ outerRadius, innerRadius, color });
    });
    return rings; // All characters contribute to the rings
};
// Generate PNG Flag
const generateFlagPng = (isoCode) => {
    const canvas = (0, canvas_1.createCanvas)(256, 256);
    const ctx = canvas.getContext('2d');
    const maxRadius = 256 / 2;
    const rings = generateRings(isoCode, maxRadius);
    rings.forEach((ring) => {
        ctx.beginPath();
        ctx.arc(128, 128, ring.outerRadius, 0, Math.PI * 2, false);
        ctx.arc(128, 128, ring.innerRadius, Math.PI * 2, 0, true);
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(128, 128, ring.outerRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        if (ring.innerRadius > 0) {
            ctx.beginPath();
            ctx.arc(128, 128, ring.innerRadius, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }
    });
    // Draw a black center dot (not part of the rings)
    ctx.beginPath();
    ctx.arc(128, 128, centerDotRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    return canvas.toBuffer();
};
// Generate SVG Flag
const generateFlagSvg = (isoCode) => {
    const maxRadius = 128;
    const rings = generateRings(isoCode, maxRadius);
    const svg = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
        .ele('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 256 256' })
        .ele('g');
    rings.forEach((ring) => {
        svg
            .ele('circle', {
            cx: 128,
            cy: 128,
            r: ring.outerRadius,
            fill: ring.color,
            stroke: 'black',
            'stroke-width': 2,
        })
            .up();
        if (ring.innerRadius > 0) {
            svg
                .ele('circle', {
                cx: 128,
                cy: 128,
                r: ring.innerRadius,
                fill: 'none',
                stroke: 'black',
                'stroke-width': 2,
            })
                .up();
        }
    });
    // Draw a black center dot (not part of the rings)
    svg
        .ele('circle', {
        cx: 128,
        cy: 128,
        r: centerDotRadius,
        fill: 'black',
    })
        .up();
    return svg.end({ prettyPrint: true });
};
// Debugging Function
const generateFlagDebug = (isoCode) => {
    const maxRadius = 128;
    const rings = generateRings(isoCode, maxRadius);
    console.log(`Ring Width: ${maxRadius / rings.length}`);
    console.log(`Chars: ${isoCode.replace('-', '').toUpperCase().split('')} length: ${rings.length}`);
    console.log(`Generating flag for: ${isoCode}`);
    console.log(`Rings: ${rings.length}`);
    rings.forEach((ring, index) => {
        console.log(`Ring ${index + 1}: Color = ${index === rings.length - 1 ? 'black' : ring.color}, Outer Radius = ${ring.outerRadius}, Inner Radius = ${ring.innerRadius}`);
    });
};
// Delete all files in the flags directory
const clearFlagsDirectory = (flagsDir) => {
    if (fs_1.default.existsSync(flagsDir)) {
        fs_1.default.readdirSync(flagsDir).forEach((file) => {
            const filePath = path_1.default.join(flagsDir, file);
            if (fs_1.default.lstatSync(filePath).isFile()) {
                fs_1.default.unlinkSync(filePath);
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
        const locales = locale_codes_1.default.all.filter((loc) => loc.tag.includes('-'));
        if (locales.length === 0) {
            console.error('No valid locales found! Exiting.');
            return;
        }
        console.log(`Found ${locales.length} valid locales:`, locales.map((l) => l.tag));
        // Ensure the flags directory exists
        if (!fs_1.default.existsSync(flagsDir)) {
            fs_1.default.mkdirSync(flagsDir);
            console.log('Created flags directory.');
        }
        else {
            clearFlagsDirectory(flagsDir);
        }
        // Debug flag generation for de-DE
        generateFlagDebug('de-DE');
        // Generate flags
        locales.forEach((loc) => {
            try {
                const pngBuffer = generateFlagPng(loc.tag);
                const svgContent = generateFlagSvg(loc.tag);
                const pngPath = path_1.default.join(flagsDir, `${loc.tag}.png`);
                const svgPath = path_1.default.join(flagsDir, `${loc.tag}.svg`);
                fs_1.default.writeFileSync(pngPath, pngBuffer);
                fs_1.default.writeFileSync(svgPath, svgContent);
                console.log(`Generated flag for: ${loc.tag}`);
            }
            catch (error) {
                console.error(`Failed to generate flag for: ${loc.tag}`, error);
            }
        });
        console.log('All flags generated successfully.');
    }
    catch (error) {
        console.error('Unexpected error during flag generation:', error);
    }
})();
