import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gifencoder';

// Directories
const FLAGS_DIR = './flags';
const OUTPUT_DIR = './press-kit';
const GIF_FILE_SMALL = `${OUTPUT_DIR}/scrolling-flags-banner-small.gif`;
const GIF_FILE_FULL = `${OUTPUT_DIR}/scrolling-flags-banner.gif`;

// Constants
const FLAG_WIDTH = 128; // Width of each flag
const FLAG_HEIGHT = 128; // Height of each flag
const TEXT_DEFAULT_WIDTH = 200; // Default width for text areas
const NUM_COLUMNS = 3; // Number of columns (e.g., FLAG TEXT | FLAG TEXT | FLAG TEXT)
const FRAME_DELAY = 50; // Frame delay in ms (20 FPS)
const SCROLL_SPEED = 4; // Pixels to scroll per frame

// Boolean to switch between small GIF (10 flags) and full GIF
const isSmallGif = true;

// Generate the banner
const generateBanner = async () => {
  console.log('Starting banner generation...');

  // Ensure the output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Load all flags from the flags directory
  const flagFiles = fs.readdirSync(FLAGS_DIR).filter((file) => file.endsWith('.png'));
  if (flagFiles.length === 0) {
    console.error('No flags found in the flags directory!');
    return;
  }

  console.log(`Found ${flagFiles.length} flags.`);

  const flags = await Promise.all(
      flagFiles.map(async (file) => ({
        image: await loadImage(path.join(FLAGS_DIR, file)),
        code: file.replace('.png', ''), // Remove the .png extension
      }))
  );

  // Filter for flags where prefix matches suffix (case-insensitive)
  const filteredFlags: any[] = [];
  const excludedFlags: any[] = [];
  flags.forEach((flag) => {
    const [prefix, suffix] = flag.code.split('-').map((part) => part.toLowerCase());
    if (prefix && suffix && prefix === suffix) {
      filteredFlags.push(flag);
    } else {
      excludedFlags.push({ code: flag.code, reason: 'Prefix and suffix do not match (case-insensitive).' });
    }
  });

  // Remove duplicate prefixes
  const usedPrefixes = new Set();
  const uniqueFlags = filteredFlags.filter((flag) => {
    if (usedPrefixes.has(flag.code)) {
      excludedFlags.push({ code: flag.code, reason: 'Duplicate flag code.' });
      return false;
    }
    usedPrefixes.add(flag.code);
    return true;
  });

  // Log the flags that will be included
  console.log(`Flags included (${uniqueFlags.length}):`);
  uniqueFlags.forEach((flag) => console.log(`- ${flag.code}`));

  // Log excluded flags
  console.log(`Flags excluded (${excludedFlags.length}):`);
  excludedFlags.forEach(({ code, reason }) => console.log(`- ${code}: ${reason}`));

  // Limit flags for small GIF
  const selectedFlags = isSmallGif ? uniqueFlags.slice(0, 10) : uniqueFlags;

  if (selectedFlags.length === 0) {
    console.error('No valid flags to generate the GIF.');
    return;
  }

  // Calculate rows, height, and width dynamically based on the number of selected flags
  const totalRows = Math.ceil(selectedFlags.length / NUM_COLUMNS);
  const BANNER_HEIGHT = Math.min(totalRows * FLAG_HEIGHT, totalRows * FLAG_HEIGHT); // Exact height needed
  const BANNER_WIDTH = NUM_COLUMNS * (FLAG_WIDTH + TEXT_DEFAULT_WIDTH); // Dynamic width based on columns
  const totalContentHeight = totalRows * FLAG_HEIGHT;
  const visibleContentHeight = BANNER_HEIGHT;
  const maxFrames =
      Math.ceil((totalContentHeight - visibleContentHeight + FLAG_HEIGHT) / SCROLL_SPEED) +
      Math.ceil(visibleContentHeight / SCROLL_SPEED);

  console.log(`Total scroll height: ${totalContentHeight}px`);
  console.log(`Generating ${maxFrames} frames for the ${isSmallGif ? 'small' : 'full'} GIF...`);
  console.log(`Dynamic banner height: ${BANNER_HEIGHT}px`);
  console.log(`Dynamic banner width: ${BANNER_WIDTH}px`);

  // Initialize the GIF encoder
  const encoder = new GIFEncoder(BANNER_WIDTH, BANNER_HEIGHT);
  const gifFile = isSmallGif ? GIF_FILE_SMALL : GIF_FILE_FULL;
  encoder.createReadStream().pipe(fs.createWriteStream(gifFile));
  encoder.start();
  encoder.setRepeat(0); // Infinite loop
  encoder.setDelay(FRAME_DELAY); // Frame delay in ms
  encoder.setQuality(10); // Quality setting

  // Create a canvas for rendering frames
  const canvas = createCanvas(BANNER_WIDTH, BANNER_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Render each frame
  for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
    const offset = frameIndex * SCROLL_SPEED;

    // Clear the canvas and set background color to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

    // Draw flags in the current frame
    selectedFlags.forEach((flag, index) => {
      const row = Math.floor(index / NUM_COLUMNS);
      const col = index % NUM_COLUMNS;

      const xPosition = col * (FLAG_WIDTH + TEXT_DEFAULT_WIDTH);
      const yPosition = row * FLAG_HEIGHT - offset;

      if (yPosition + FLAG_HEIGHT > 0 && yPosition < BANNER_HEIGHT) {
        // Draw the flag
        ctx.drawImage(flag.image, xPosition, yPosition, FLAG_WIDTH, FLAG_HEIGHT);

        // Draw the text next to the flag
        ctx.fillStyle = 'black';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(flag.code, xPosition + FLAG_WIDTH + 10, yPosition + FLAG_HEIGHT / 2 + 10);
      }
    });

    // Add the current frame to the GIF using raw pixel buffer
    const frameData = ctx.getImageData(0, 0, BANNER_WIDTH, BANNER_HEIGHT).data;
    // @ts-ignore
    encoder.addFrame(new Uint8Array(frameData));

    // Log progress
    if (frameIndex % 10 === 0 || frameIndex === maxFrames - 1) {
      console.log(`Progress: ${frameIndex + 1}/${maxFrames} frames generated.`);
    }
  }

  // Finalize the GIF
  encoder.finish();
  console.log(`Banner GIF saved to: ${gifFile}`);
};

// Run the script
generateBanner().catch((err) => {
  console.error('Error generating banner:', err);
});
