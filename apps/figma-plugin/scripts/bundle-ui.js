const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "../dist");
const srcHtml = path.resolve(__dirname, "../src/ui/index.html");
const destHtml = path.resolve(distDir, "ui.html");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(srcHtml, destHtml);
console.log("✓ Copied ui/index.html -> dist/ui.html");
