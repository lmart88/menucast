const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const publicIconsDir = path.resolve(__dirname, "../public/icons");
const publicDir = path.resolve(__dirname, "../public");
const appDir = path.resolve(__dirname, "../app");
const tvDrawableDir = path.resolve(__dirname, "../../tv-android/app/src/main/res/drawable");

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// 1. Brand SVG Icon Generator
function createBrandIconSvg({ maskable = false, solidBg = true, borderRadius = 112, size = 512 } = {}) {
  // Safe zone calculation:
  // For maskable icon, Android crops to various shapes (circle, squircle, pebble) within 80% diameter circle.
  // 80% diameter circle = 409.6px diameter (radius ~204.8px from center 256, 256).
  const scale = maskable ? 5.2 : 6.2;
  const tx = 256 - 32.5 * scale;
  const ty = 256 - 30 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D1F21" />
      <stop offset="100%" stop-color="#061012" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#008996" stop-opacity="0.4" />
      <stop offset="60%" stop-color="#008996" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#008996" stop-opacity="0" />
    </radialGradient>
    <clipPath id="clip0_1459_10971">
      <rect width="50" height="38.1579" fill="white" transform="translate(21.0713) rotate(33.5189)"/>
    </clipPath>
  </defs>

  ${
    solidBg
      ? `
  <!-- Background -->
  <rect width="${size}" height="${size}" ${maskable ? "" : `rx="${borderRadius}"`} fill="url(#bgGrad)" />
  <rect width="${size}" height="${size}" ${maskable ? "" : `rx="${borderRadius}"`} fill="url(#glowGrad)" />
  ${
    !maskable
      ? `<rect width="${size - 4}" height="${size - 4}" x="2" y="2" rx="${borderRadius - 2}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />`
      : ""
  }
  `
      : ""
  }

  <!-- miniKast Brand Mascot -->
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <g clip-path="url(#clip0_1459_10971)">
      <path d="M25.0579 23.9329C26.5204 20.7079 29.9393 17.4881 33.0419 15.8533C40.9164 11.7043 50.881 16.9738 51.8781 25.7637C51.954 26.4323 51.8084 28.7694 52.0339 29.1537C53.672 31.122 55.5483 33.7354 57.205 35.5385C55.2314 35.4357 52.2209 35.2963 50.2714 35.0382C49.974 35.4084 49.6587 36.2364 49.4305 36.6895C48.9827 37.5812 48.4928 38.4513 47.9625 39.2968C43.8671 45.893 36.9539 49.607 29.2715 48.7293C28.3408 48.623 27.2945 48.2544 26.3847 48.1728C22.2002 46.4542 21.592 46.147 18.1674 43.2339C16.0778 41.0086 13.9601 37.1735 13.2812 34.2038C13.0757 33.9312 8.54887 30.7652 7.80225 30.1754C8.70276 29.544 12.3723 27.864 12.6457 27.4788C11.0319 25.0527 8.63189 21.0498 9.41147 17.9752C9.92693 15.9424 11.5636 15.5306 13.3773 16.0855C13.5242 16.1657 13.7263 16.1888 13.7543 15.9876C14.0265 14.0347 15.0164 10.9795 17.6345 11.4587C18.3903 11.6037 19.0539 12.0462 19.4781 12.6883C20.3134 13.9261 20.197 15.2312 19.9386 16.6071C20.5678 16.5788 21.3926 16.5902 21.9371 16.9097C24.6365 18.4937 22.4907 22.2268 21.3064 23.9556L21.2595 24.1709C21.3712 24.2212 24.3549 23.88 25.0579 23.9329Z" fill="#008996"/>
      <path d="M13.3773 16.0854C13.5242 16.1657 13.7263 16.1887 13.7543 15.9875C14.0265 14.0347 15.0164 10.9794 17.6345 11.4586C18.3903 11.6036 19.0539 12.0462 19.4781 12.6882C20.3134 13.926 20.197 15.2312 19.9386 16.607C20.5678 16.5787 21.3926 16.5901 21.937 16.9096C24.6365 18.4937 22.4907 22.2267 21.3064 23.9555L21.2595 24.1708C21.3712 24.2211 24.3548 23.88 25.0579 23.9329C27.1323 24.1759 29.3388 24.7383 30.4523 26.4472C34.6454 32.8825 27.9008 38.2497 21.5554 37.1208C18.0307 36.4938 16.2037 35.5334 13.2812 34.2037C13.0757 33.9311 8.54886 30.7652 7.80224 30.1754C8.70275 29.5439 12.3723 27.864 12.6457 27.4787C11.0319 25.0526 8.63188 21.0497 9.41146 17.9752C9.92692 15.9423 11.5636 15.5305 13.3773 16.0854Z" fill="#015860"/>
      <path d="M13.3773 16.0856C13.635 16.3608 13.7069 16.3602 13.749 16.7553C13.8463 17.6659 13.7381 18.6047 13.8508 19.5192C14.1208 21.7108 14.5472 24.3491 15.1083 26.4652C14.616 26.7234 13.1076 27.6272 12.6457 27.4789C11.0319 25.0528 8.63187 21.0499 9.41146 17.9753C9.92692 15.9425 11.5636 15.5307 13.3773 16.0856Z" fill="#008996"/>
      <path d="M19.9386 16.6071C20.5678 16.5788 21.3926 16.5903 21.9371 16.9097C24.6366 18.4938 22.4907 22.2268 21.3064 23.9556C20.773 24.6034 17.8084 25.2832 16.6034 25.8006C17.7838 23.9427 19.5675 18.7828 19.9386 16.6071Z" fill="#008996"/>
      <path d="M52.0339 29.1536C53.672 31.1219 55.5483 33.7353 57.205 35.5384C55.2314 35.4356 52.2209 35.2962 50.2714 35.0381C50.298 34.6483 50.9547 32.8993 51.0892 32.3678C51.2314 31.806 51.7735 29.3794 52.0339 29.1536Z" fill="#FF8400"/>
      <ellipse cx="43.7038" cy="25.0781" rx="1.84426" ry="1.86642" transform="rotate(33.5189 43.7038 25.0781)" fill="white"/>
    </g>
  </g>
</svg>`;
}

// 2. OpenGraph 1200x630 Card Generator
function createOgCardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081416" />
      <stop offset="60%" stop-color="#0d1f21" />
      <stop offset="100%" stop-color="#050d0e" />
    </linearGradient>
    <radialGradient id="ogGlow" cx="600" cy="270" r="500" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#008996" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#008996" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#008996" stop-opacity="0" />
    </radialGradient>
    <clipPath id="clip_og">
      <rect width="50" height="38.1579" fill="white" transform="translate(21.0713) rotate(33.5189)"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)" />
  <circle cx="600" cy="270" r="500" fill="url(#ogGlow)" />

  <!-- Grid overlay -->
  <path d="M0 100 H1200 M0 200 H1200 M0 300 H1200 M0 400 H1200 M0 500 H1200" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <path d="M200 0 V630 M400 0 V630 M600 0 V630 M800 0 V630 M1000 0 V630" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- miniKast Mascot Centered at Y=230 -->
  <g transform="translate(505, 120) scale(3.1)">
    <g clip-path="url(#clip_og)">
      <path d="M25.0579 23.9329C26.5204 20.7079 29.9393 17.4881 33.0419 15.8533C40.9164 11.7043 50.881 16.9738 51.8781 25.7637C51.954 26.4323 51.8084 28.7694 52.0339 29.1537C53.672 31.122 55.5483 33.7354 57.205 35.5385C55.2314 35.4357 52.2209 35.2963 50.2714 35.0382C49.974 35.4084 49.6587 36.2364 49.4305 36.6895C48.9827 37.5812 48.4928 38.4513 47.9625 39.2968C43.8671 45.893 36.9539 49.607 29.2715 48.7293C28.3408 48.623 27.2945 48.2544 26.3847 48.1728C22.2002 46.4542 21.592 46.147 18.1674 43.2339C16.0778 41.0086 13.9601 37.1735 13.2812 34.2038C13.0757 33.9312 8.54887 30.7652 7.80225 30.1754C8.70276 29.544 12.3723 27.864 12.6457 27.4788C11.0319 25.0527 8.63189 21.0498 9.41147 17.9752C9.92693 15.9424 11.5636 15.5306 13.3773 16.0855C13.5242 16.1657 13.7263 16.1888 13.7543 15.9876C14.0265 14.0347 15.0164 10.9795 17.6345 11.4587C18.3903 11.6037 19.0539 12.0462 19.4781 12.6883C20.3134 13.9261 20.197 15.2312 19.9386 16.6071C20.5678 16.5788 21.3926 16.5902 21.9371 16.9097C24.6365 18.4937 22.4907 22.2268 21.3064 23.9556L21.2595 24.1709C21.3712 24.2212 24.3549 23.88 25.0579 23.9329Z" fill="#008996"/>
      <path d="M13.3773 16.0854C13.5242 16.1657 13.7263 16.1887 13.7543 15.9875C14.0265 14.0347 15.0164 10.9794 17.6345 11.4586C18.3903 11.6036 19.0539 12.0462 19.4781 12.6882C20.3134 13.926 20.197 15.2312 19.9386 16.607C20.5678 16.5787 21.3926 16.5901 21.937 16.9096C24.6365 18.4937 22.4907 22.2267 21.3064 23.9555L21.2595 24.1708C21.3712 24.2211 24.3548 23.88 25.0579 23.9329C27.1323 24.1759 29.3388 24.7383 30.4523 26.4472C34.6454 32.8825 27.9008 38.2497 21.5554 37.1208C18.0307 36.4938 16.2037 35.5334 13.2812 34.2037C13.0757 33.9311 8.54886 30.7652 7.80224 30.1754C8.70275 29.5439 12.3723 27.864 12.6457 27.4787C11.0319 25.0526 8.63188 21.0497 9.41146 17.9752C9.92692 15.9423 11.5636 15.5305 13.3773 16.0854Z" fill="#015860"/>
      <path d="M13.3773 16.0856C13.635 16.3608 13.7069 16.3602 13.749 16.7553C13.8463 17.6659 13.7381 18.6047 13.8508 19.5192C14.1208 21.7108 14.5472 24.3491 15.1083 26.4652C14.616 26.7234 13.1076 27.6272 12.6457 27.4789C11.0319 25.0528 8.63187 21.0499 9.41146 17.9753C9.92692 15.9425 11.5636 15.5307 13.3773 16.0856Z" fill="#008996"/>
      <path d="M19.9386 16.6071C20.5678 16.5788 21.3926 16.5903 21.9371 16.9097C24.6366 18.4938 22.4907 22.2268 21.3064 23.9556C20.773 24.6034 17.8084 25.2832 16.6034 25.8006C17.7838 23.9427 19.5675 18.7828 19.9386 16.6071Z" fill="#008996"/>
      <path d="M52.0339 29.1536C53.672 31.1219 55.5483 33.7353 57.205 35.5384C55.2314 35.4356 52.2209 35.2962 50.2714 35.0381C50.298 34.6483 50.9547 32.8993 51.0892 32.3678C51.2314 31.806 51.7735 29.3794 52.0339 29.1536Z" fill="#FF8400"/>
      <ellipse cx="43.7038" cy="25.0781" rx="1.84426" ry="1.86642" transform="rotate(33.5189 43.7038 25.0781)" fill="white"/>
    </g>
  </g>

  <!-- Typography -->
  <text x="600" y="390" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#F4F8F7" letter-spacing="-0.02em">miniKast</text>
  <text x="600" y="445" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#A3B7B5">Digital Menu Management for Restaurants &amp; Bars</text>

  <!-- Badge -->
  <rect x="500" y="490" width="200" height="38" rx="19" fill="#008996" fill-opacity="0.2" stroke="#008996" stroke-width="1.5" />
  <text x="600" y="515" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#57D6D3" letter-spacing="0.05em">FIGMA TO TV IN SECONDS</text>
</svg>`;
}

// 3. ICO File Generator
function createIcoFile(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let currentOffset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type 1
  header.writeUInt16LE(count, 4); // count of images

  const entries = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8); // image byte length
    entry.writeUInt32LE(currentOffset, 12); // file offset
    entries.push(entry);
    currentOffset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

// Generate standard and maskable SVGs
const standardSvg = createBrandIconSvg({ maskable: false, solidBg: true });
const maskableSvg = createBrandIconSvg({ maskable: true, solidBg: true });
const ogSvg = createOgCardSvg();

// Write SVG files
const publicIconSvgPath = path.join(publicIconsDir, "icon.svg");
const appIconSvgPath = path.join(appDir, "icon.svg");
const maskableSvgPath = path.join(publicIconsDir, "icon-maskable-512.svg");

fs.writeFileSync(publicIconSvgPath, standardSvg);
fs.writeFileSync(appIconSvgPath, standardSvg);
fs.writeFileSync(maskableSvgPath, maskableSvg);
console.log("✓ Saved SVGs:", publicIconSvgPath, appIconSvgPath);

// Render PNGs via qlmanage and sips
const tmpDir = "/tmp/menucast_icons";
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

fs.writeFileSync(path.join(tmpDir, "icon_standard.svg"), standardSvg);
fs.writeFileSync(path.join(tmpDir, "icon_maskable.svg"), maskableSvg);
fs.writeFileSync(path.join(tmpDir, "og_card.svg"), ogSvg);

// Generate 512 base PNGs
execSync(`qlmanage -t -s 512 -o "${tmpDir}" "${path.join(tmpDir, "icon_standard.svg")}" 2>/dev/null`);
execSync(`qlmanage -t -s 512 -o "${tmpDir}" "${path.join(tmpDir, "icon_maskable.svg")}" 2>/dev/null`);
execSync(`qlmanage -t -s 1200 -o "${tmpDir}" "${path.join(tmpDir, "og_card.svg")}" 2>/dev/null`);

const renderedStandard512 = path.join(tmpDir, "icon_standard.svg.png");
const renderedMaskable512 = path.join(tmpDir, "icon_maskable.svg.png");
const renderedOg1200 = path.join(tmpDir, "og_card.svg.png");

// Save 512 PNGs
const icon512 = path.join(publicIconsDir, "icon-512.png");
const iconMaskable512 = path.join(publicIconsDir, "icon-maskable-512.png");
fs.copyFileSync(renderedStandard512, icon512);
fs.copyFileSync(renderedMaskable512, iconMaskable512);
console.log("✓ Generated 512x512 standard and maskable PNGs");

// Save intermediate PNGs
const sizes = [192, 180, 48, 32, 16];
sizes.forEach((sz) => {
  const target = path.join(publicIconsDir, `icon-${sz}.png`);
  execSync(`sips -z ${sz} ${sz} "${renderedStandard512}" --out "${target}" 2>/dev/null`);
  console.log(`✓ Generated icon-${sz}.png`);
});

// Apple Touch Icons
const appleTouchIcon180 = path.join(publicIconsDir, "icon-180.png");
fs.copyFileSync(appleTouchIcon180, path.join(publicIconsDir, "apple-touch-icon.png"));
fs.copyFileSync(appleTouchIcon180, path.join(publicDir, "apple-touch-icon.png"));

// Favicon fallbacks
fs.copyFileSync(path.join(publicIconsDir, "icon-32.png"), path.join(publicDir, "favicon-32x32.png"));
fs.copyFileSync(path.join(publicIconsDir, "icon-16.png"), path.join(publicDir, "favicon-16x16.png"));

// Generate Multi-resolution ICO (16x16, 32x32, 48x48)
const icoBuffer = createIcoFile(
  [
    fs.readFileSync(path.join(publicIconsDir, "icon-16.png")),
    fs.readFileSync(path.join(publicIconsDir, "icon-32.png")),
    fs.readFileSync(path.join(publicIconsDir, "icon-48.png")),
  ],
  [16, 32, 48]
);

fs.writeFileSync(path.join(appDir, "favicon.ico"), icoBuffer);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
console.log("✓ Generated multi-resolution favicon.ico (16, 32, 48)");

// OpenGraph Image
if (fs.existsSync(renderedOg1200)) {
  const ogTarget = path.join(appDir, "opengraph-image.png");
  execSync(`sips -z 630 1200 "${renderedOg1200}" --out "${ogTarget}" 2>/dev/null`);
  console.log("✓ Generated OpenGraph social image: app/opengraph-image.png");
}

// 4. Android TV Vector Drawables (apps/tv-android)
if (fs.existsSync(tvDrawableDir)) {
  const bannerXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="320dp"
    android:height="180dp"
    android:viewportWidth="320"
    android:viewportHeight="180">
    <!-- Dark Background -->
    <path
        android:fillColor="#0D1F21"
        android:pathData="M0,0h320v180h-320z" />

    <!-- Ambient Subtle Glow Ring -->
    <path
        android:fillColor="#008996"
        android:pathData="M160,90m-46,0a46,46 0,1,1 92,0a46,46 0,1,1 -92,0" />

    <path
        android:fillColor="#0D1F21"
        android:pathData="M160,90m-43,0a43,43 0,1,1 86,0a43,43 0,1,1 -86,0" />

    <!-- miniKast Mascot -->
    <group
        android:scaleX="1.25"
        android:scaleY="1.25"
        android:translateX="120.6"
        android:translateY="52.5">
        <path
            android:fillColor="#008996"
            android:pathData="M25.0579,23.9329C26.5204,20.7079 29.9393,17.4881 33.0419,15.8533C40.9164,11.7043 50.881,16.9738 51.8781,25.7637C51.954,26.4323 51.8084,28.7694 52.0339,29.1537C53.672,31.122 55.5483,33.7354 57.205,35.5385C55.2314,35.4357 52.2209,35.2963 50.2714,35.0382C49.974,35.4084 49.6587,36.2364 49.4305,36.6895C48.9827,37.5812 48.4928,38.4513 47.9625,39.2968C43.8671,45.893 36.9539,49.607 29.2715,48.7293C28.3408,48.623 27.2945,48.2544 26.3847,48.1728C22.2002,46.4542 21.592,46.147 18.1674,43.2339C16.0778,41.0086 13.9601,37.1735 13.2812,34.2038C13.0757,33.9312 8.54887,30.7652 7.80225,30.1754C8.70276,29.544 12.3723,27.864 12.6457,27.4788C11.0319,25.0527 8.63189,21.0498 9.41147,17.9752C9.92693,15.9424 11.5636,15.5306 13.3773,16.0855C13.5242,16.1657 13.7263,16.1888 13.7543,15.9876C14.0265,14.0347 15.0164,10.9795 17.6345,11.4587C18.3903,11.6037 19.0539,12.0462 19.4781,12.6883C20.3134,13.9261 20.197,15.2312 19.9386,16.6071C20.5678,16.5788 21.3926,16.5902 21.9371,16.9097C24.6365,18.4937 22.4907,22.2268 21.3064,23.9556L21.2595,24.1709C21.3712,24.2212 24.3549,23.88 25.0579,23.9329Z" />
        <path
            android:fillColor="#015860"
            android:pathData="M13.3773,16.0854C13.5242,16.1657 13.7263,16.1887 13.7543,15.9875C14.0265,14.0347 15.0164,10.9794 17.6345,11.4586C18.3903,11.6036 19.0539,12.0462 19.4781,12.6882C20.3134,13.926 20.197,15.2312 19.9386,16.607C20.5678,16.5787 21.3926,16.5901 21.937,16.9096C24.6365,18.4937 22.4907,22.2267 21.3064,23.9555L21.2595,24.1708C21.3712,24.2211 24.3548,23.88 25.0579,23.9329C27.1323,24.1759 29.3388,24.7383 30.4523,26.4472C34.6454,32.8825 27.9008,38.2497 21.5554,37.1208C18.0307,36.4938 16.2037,35.5334 13.2812,34.2037C13.0757,33.9311 8.54886,30.7652 7.80224,30.1754C8.70275,29.5439 12.3723,27.864 12.6457,27.4787C11.0319,25.0526 8.63188,21.0497 9.41146,17.9752C9.92692,15.9423 11.5636,15.5305 13.3773,16.0854Z" />
        <path
            android:fillColor="#008996"
            android:pathData="M13.3773,16.0856C13.635,16.3608 13.7069,16.3602 13.749,16.7553C13.8463,17.6659 13.7381,18.6047 13.8508,19.5192C14.1208,21.7108 14.5472,24.3491 15.1083,26.4652C14.616,26.7234 13.1076,27.6272 12.6457,27.4789C11.0319,25.0528 8.63187,21.0499 9.41146,17.9753C9.92692,15.9425 11.5636,15.5307 13.3773,16.0856Z" />
        <path
            android:fillColor="#008996"
            android:pathData="M19.9386,16.6071C20.5678,16.5788 21.3926,16.5903 21.9371,16.9097C24.6366,18.4938 22.4907,22.2268 21.3064,23.9556C20.773,24.6034 17.8084,25.2832 16.6034,25.8006C17.7838,23.9427 19.5675,18.7828 19.9386,16.6071Z" />
        <path
            android:fillColor="#FF8400"
            android:pathData="M52.0339,29.1536C53.672,31.1219 55.5483,33.7353 57.205,35.5384C55.2314,35.4356 52.2209,35.2962 50.2714,35.0381C50.298,34.6483 50.9547,32.8993 51.0892,32.3678C51.2314,31.806 51.7735,29.3794 52.0339,29.1536Z" />
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M43.7038,25.0781m-1.85,0a1.85,1.85 0,1,1 3.7,0a1.85,1.85 0,1,1 -3.7,0" />
    </group>
</vector>`;

  const icLauncherXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0D1F21"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#008996"
        android:pathData="M54,54m-32,0a32,32 0,1,1 64,0a32,32 0,1,1 -64,0" />
    <path
        android:fillColor="#0D1F21"
        android:pathData="M54,54m-29,0a29,29 0,1,1 58,0a29,29 0,1,1 -58,0" />

    <!-- miniKast Mascot Centered -->
    <group
        android:scaleX="0.9"
        android:scaleY="0.9"
        android:translateX="25.65"
        android:translateY="27">
        <path
            android:fillColor="#008996"
            android:pathData="M25.0579,23.9329C26.5204,20.7079 29.9393,17.4881 33.0419,15.8533C40.9164,11.7043 50.881,16.9738 51.8781,25.7637C51.954,26.4323 51.8084,28.7694 52.0339,29.1537C53.672,31.122 55.5483,33.7354 57.205,35.5385C55.2314,35.4357 52.2209,35.2963 50.2714,35.0382C49.974,35.4084 49.6587,36.2364 49.4305,36.6895C48.9827,37.5812 48.4928,38.4513 47.9625,39.2968C43.8671,45.893 36.9539,49.607 29.2715,48.7293C28.3408,48.623 27.2945,48.2544 26.3847,48.1728C22.2002,46.4542 21.592,46.147 18.1674,43.2339C16.0778,41.0086 13.9601,37.1735 13.2812,34.2038C13.0757,33.9312 8.54887,30.7652 7.80225,30.1754C8.70276,29.544 12.3723,27.864 12.6457,27.4788C11.0319,25.0527 8.63189,21.0498 9.41147,17.9752C9.92693,15.9424 11.5636,15.5306 13.3773,16.0855C13.5242,16.1657 13.7263,16.1888 13.7543,15.9876C14.0265,14.0347 15.0164,10.9795 17.6345,11.4587C18.3903,11.6037 19.0539,12.0462 19.4781,12.6883C20.3134,13.9261 20.197,15.2312 19.9386,16.6071C20.5678,16.5788 21.3926,16.5902 21.9371,16.9097C24.6365,18.4937 22.4907,22.2268 21.3064,23.9556L21.2595,24.1709C21.3712,24.2212 24.3549,23.88 25.0579,23.9329Z" />
        <path
            android:fillColor="#015860"
            android:pathData="M13.3773,16.0854C13.5242,16.1657 13.7263,16.1887 13.7543,15.9875C14.0265,14.0347 15.0164,10.9794 17.6345,11.4586C18.3903,11.6036 19.0539,12.0462 19.4781,12.6882C20.3134,13.926 20.197,15.2312 19.9386,16.607C20.5678,16.5787 21.3926,16.5901 21.937,16.9096C24.6365,18.4937 22.4907,22.2267 21.3064,23.9555L21.2595,24.1708C21.3712,24.2211 24.3548,23.88 25.0579,23.9329C27.1323,24.1759 29.3388,24.7383 30.4523,26.4472C34.6454,32.8825 27.9008,38.2497 21.5554,37.1208C18.0307,36.4938 16.2037,35.5334 13.2812,34.2037C13.0757,33.9311 8.54886 30.7652 7.80224 30.1754C8.70275 29.5439 12.3723 27.864 12.6457 27.4787C11.0319,25.0526 8.63188,21.0497 9.41146,17.9752C9.92692,15.9423 11.5636,15.5305 13.3773,16.0854Z" />
        <path
            android:fillColor="#008996"
            android:pathData="M13.3773,16.0856C13.635,16.3608 13.7069,16.3602 13.749,16.7553C13.8463,17.6659 13.7381,18.6047 13.8508,19.5192C14.1208,21.7108 14.5472,24.3491 15.1083,26.4652C14.616,26.7234 13.1076,27.6272 12.6457,27.4789C11.0319,25.0528 8.63187,21.0499 9.41146,17.9753C9.92692,15.9425 11.5636,15.5307 13.3773,16.0856Z" />
        <path
            android:fillColor="#008996"
            android:pathData="M19.9386,16.6071C20.5678,16.5788 21.3926,16.5903 21.9371,16.9097C24.6366,18.4938 22.4907,22.2268 21.3064,23.9556C20.773,24.6034 17.8084,25.2832 16.6034,25.8006C17.7838,23.9427 19.5675,18.7828 19.9386,16.6071Z" />
        <path
            android:fillColor="#FF8400"
            android:pathData="M52.0339,29.1536C53.672,31.1219 55.5483,33.7353 57.205,35.5384C55.2314,35.4356 52.2209,35.2962 50.2714,35.0381C50.298,34.6483 50.9547,32.8993 51.0892,32.3678C51.2314,31.806 51.7735,29.3794 52.0339,29.1536Z" />
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M43.7038,25.0781m-1.85,0a1.85,1.85 0,1,1 3.7,0a1.85,1.85 0,1,1 -3.7,0" />
    </group>
</vector>`;

  fs.writeFileSync(path.join(tvDrawableDir, "banner.xml"), bannerXml);
  fs.writeFileSync(path.join(tvDrawableDir, "ic_launcher.xml"), icLauncherXml);
  console.log("✓ Updated Android TV drawables: banner.xml, ic_launcher.xml");
}

console.log("🎉 All icons and favicons successfully updated!");
