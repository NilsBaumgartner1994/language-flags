"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const canvas_1 = require("canvas");
const gifencoder_1 = __importDefault(require("gifencoder"));
// Directories
const FLAGS_DIR = './flags';
const OUTPUT_DIR = './press-kit';
const GIF_FILE_SMALL = `${OUTPUT_DIR}/scrolling-flags-banner-small.gif`;
const GIF_FILE_FULL = `${OUTPUT_DIR}/scrolling-flags-banner.gif`;
// Constants
const FLAG_WIDTH = 64; // Width of each flag
const FLAG_HEIGHT = 64; // Height of each flag
const TEXT_DEFAULT_WIDTH = 200; // Default width for text areas
const NUM_COLUMNS = 5; // Number of columns (e.g., FLAG TEXT | FLAG TEXT | FLAG TEXT)
const FRAME_DELAY = 50; // Frame delay in ms (20 FPS)
const SCROLL_SPEED = 4; // Pixels to scroll per frame
const AMOUNT_VISIBLE_ROWS = 3; // Number of rows visible at a time
// Boolean to switch between small GIF (10 flags) and full GIF
const isSmallGif = false;
// Generate the banner
const generateBanner = async () => {
    console.log('Starting banner generation...');
    // Ensure the output directory exists
    if (!fs_1.default.existsSync(OUTPUT_DIR)) {
        fs_1.default.mkdirSync(OUTPUT_DIR);
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
    // Load all flags from the flags directory
    const flagFiles = fs_1.default.readdirSync(FLAGS_DIR).filter((file) => file.endsWith('.png'));
    if (flagFiles.length === 0) {
        console.error('No flags found in the flags directory!');
        return;
    }
    console.log(`Found ${flagFiles.length} flags.`);
    const flags = await Promise.all(flagFiles.map(async (file) => ({
        image: await (0, canvas_1.loadImage)(path_1.default.join(FLAGS_DIR, file)),
        code: file.replace('.png', ''), // Remove the .png extension
    })));
    // Filter and remove duplicates
    const uniqueFlags = [];
    for (const flag of flags) {
        let flagCodeParts = flag.code.split('-');
        // if "de-DE-siuefh" check if the first two parts are the same ignoring case
        if (flagCodeParts.length >= 2 && flagCodeParts[0].toLowerCase() === flagCodeParts[1].toLowerCase()) {
            uniqueFlags.push(flag);
        }
    }
    console.log(`Unique flags: ${uniqueFlags.length}`);
    // Limit flags for small GIF
    const selectedFlags = isSmallGif ? uniqueFlags.slice(0, 10) : uniqueFlags;
    // randomize selected flags
    console.log(`Selected flags: ${selectedFlags.length}`);
    // sort by code
    selectedFlags.sort((a, b) => a.code.localeCompare(b.code));
    if (selectedFlags.length === 0) {
        console.error('No valid flags to generate the GIF.');
        return;
    }
    // Seamless loop adjustment
    const amountExtraRows = AMOUNT_VISIBLE_ROWS;
    const amountExtraFlags = NUM_COLUMNS * amountExtraRows;
    // 1. fill the last row of unfull flags with placeholders
    const amountPlaceholders = NUM_COLUMNS - (selectedFlags.length % NUM_COLUMNS);
    if (amountPlaceholders !== NUM_COLUMNS) {
        for (let i = 0; i < amountPlaceholders; i++) {
            selectedFlags.push({ image: null, code: '' });
        }
    }
    // 2. add extra flags for seamless loop
    for (let i = 0; i < amountExtraFlags; i++) {
        selectedFlags.push(selectedFlags[i]);
    }
    // Calculate rows, height, and frames
    const totalRows = Math.ceil(selectedFlags.length / NUM_COLUMNS);
    const BANNER_WIDTH = NUM_COLUMNS * (FLAG_WIDTH + TEXT_DEFAULT_WIDTH);
    const BANNER_HEIGHT = FLAG_HEIGHT * AMOUNT_VISIBLE_ROWS; // One row visible at a time
    const totalContentHeight = totalRows * FLAG_HEIGHT;
    const maxFrames = Math.ceil((totalContentHeight - BANNER_HEIGHT) / SCROLL_SPEED) + 1;
    // Debug logs
    console.log(`Total rows: ${totalRows}`);
    console.log(`Banner dimensions (width x height): ${BANNER_WIDTH} x ${BANNER_HEIGHT}`);
    console.log(`Total content height: ${totalContentHeight}`);
    console.log(`Max frames: ${maxFrames}`);
    // Initialize GIF encoder
    const encoder = new gifencoder_1.default(BANNER_WIDTH, BANNER_HEIGHT);
    const gifFile = isSmallGif ? GIF_FILE_SMALL : GIF_FILE_FULL;
    encoder.createReadStream().pipe(fs_1.default.createWriteStream(gifFile));
    encoder.start();
    encoder.setRepeat(0); // Infinite loop
    encoder.setDelay(FRAME_DELAY); // Frame delay in ms
    encoder.setQuality(10); // Quality setting
    // Create canvas
    const canvas = (0, canvas_1.createCanvas)(BANNER_WIDTH, BANNER_HEIGHT);
    const ctx = canvas.getContext('2d');
    // Generate frames
    for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
        const offset = frameIndex * SCROLL_SPEED;
        // Clear the canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
        // Draw flags
        selectedFlags.forEach((flag, index) => {
            const row = Math.floor(index / NUM_COLUMNS);
            const col = index % NUM_COLUMNS;
            const xPosition = col * (FLAG_WIDTH + TEXT_DEFAULT_WIDTH);
            const yPosition = row * FLAG_HEIGHT - offset;
            if (yPosition + FLAG_HEIGHT > 0 && yPosition < BANNER_HEIGHT) {
                // Draw flag
                if (flag.image) {
                    ctx.drawImage(flag.image, xPosition, yPosition, FLAG_WIDTH, FLAG_HEIGHT);
                    // Draw text
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 30px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(flag.code, xPosition + FLAG_WIDTH + 10, yPosition + FLAG_HEIGHT / 2 + 10);
                }
            }
        });
        // Add frame to GIF
        const frameData = ctx.getImageData(0, 0, BANNER_WIDTH, BANNER_HEIGHT).data;
        // @ts-ignore
        encoder.addFrame(new Uint8Array(frameData));
        // Log progress
        if (frameIndex % 10 === 0 || frameIndex === maxFrames - 1) {
            console.log(`Progress: ${frameIndex + 1}/${maxFrames} frames generated.`);
        }
    }
    // Finalize GIF
    encoder.finish();
    console.log(`Banner GIF saved to: ${gifFile}`);
};
// Run the script
generateBanner().catch((err) => {
    console.error('Error generating banner:', err);
});
