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
// Function to calculate hexagonal segments
const generateHexSegments = (isoCode, maxRadius) => {
    const chars = isoCode.replace('-', '').toUpperCase().split('');
    const segmentWidth = (maxRadius - centerDotRadius) / chars.length; // Divide equally for all characters
    const segments = [];
    chars.forEach((char, index) => {
        const color = charToColor(char, index);
        const outerRadius = maxRadius - index * segmentWidth;
        const innerRadius = Math.max(outerRadius - segmentWidth, 0);
        segments.push({ outerRadius, innerRadius, color });
    });
    return segments; // All characters contribute to the hexagonal segments
};
// Function to calculate hexagon points
const getHexagonPoints = (cx, cy, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i; // 60-degree increments
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return points.join(' ');
};
// Function to draw hexagons in canvas
const drawHexagon = (ctx, cx, cy, outerRadius, innerRadius, color) => {
    // Outer Hexagon
    ctx.beginPath();
    const outerPoints = getHexagonPoints(cx, cy, outerRadius).split(' ');
    outerPoints.forEach((point, index) => {
        const [x, y] = point.split(',').map(Number);
        if (index === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner Hexagon (Hole)
    if (innerRadius > 0) {
        ctx.beginPath();
        const innerPoints = getHexagonPoints(cx, cy, innerRadius).split(' ');
        innerPoints.forEach((point, index) => {
            const [x, y] = point.split(',').map(Number);
            if (index === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
    }
};
// Generate PNG Flag
const generateFlagPng = (isoCode) => {
    const canvas = (0, canvas_1.createCanvas)(256, 256);
    const ctx = canvas.getContext('2d');
    const maxRadius = 256 / 2;
    const segments = generateHexSegments(isoCode, maxRadius);
    segments.forEach((segment) => {
        // @ts-ignore
        drawHexagon(ctx, 128, 128, segment.outerRadius, segment.innerRadius, segment.color);
    });
    // Draw a black center dot (not part of the hexagons)
    ctx.beginPath();
    ctx.arc(128, 128, centerDotRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    return canvas.toBuffer();
};
// Generate SVG Flag
const generateFlagSvg = (isoCode) => {
    const maxRadius = 128;
    const segments = generateHexSegments(isoCode, maxRadius);
    const svg = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
        .ele('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 256 256' })
        .ele('g');
    segments.forEach((segment) => {
        const outerPoints = getHexagonPoints(128, 128, segment.outerRadius);
        const innerPoints = segment.innerRadius > 0 ? getHexagonPoints(128, 128, segment.innerRadius) : null;
        svg.ele('polygon', {
            points: outerPoints,
            fill: segment.color,
            stroke: 'black',
            'stroke-width': 2,
        }).up();
        if (innerPoints) {
            svg.ele('polygon', {
                points: innerPoints,
                fill: 'none',
                stroke: 'black',
                'stroke-width': 2,
            }).up();
        }
    });
    // Draw a black center dot (not part of the hexagons)
    svg.ele('circle', {
        cx: 128,
        cy: 128,
        r: centerDotRadius,
        fill: 'black',
    }).up();
    return svg.end({ prettyPrint: true });
};
// Debugging Function
const generateFlagDebug = (isoCode) => {
    const maxRadius = 128;
    const segments = generateHexSegments(isoCode, maxRadius);
    console.log(`Segment Width: ${maxRadius / segments.length}`);
    console.log(`Chars: ${isoCode.replace('-', '').toUpperCase().split('')} length: ${segments.length}`);
    console.log(`Generating flag for: ${isoCode}`);
    console.log(`Segments: ${segments.length}`);
    segments.forEach((segment, index) => {
        console.log(`Segment ${index + 1}: Color = ${index === segments.length - 1 ? 'black' : segment.color}, Outer Radius = ${segment.outerRadius}, Inner Radius = ${segment.innerRadius}`);
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
