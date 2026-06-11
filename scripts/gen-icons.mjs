// Run with: node scripts/gen-icons.mjs
// Generates icon-192.png and icon-512.png in public/
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const r = size / 2;

  // Background circle
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f97316";
  ctx.fill();

  // Inner dark circle
  ctx.beginPath();
  ctx.arc(r, r, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = "#07090c";
  ctx.fill();

  // Letter S
  ctx.fillStyle = "#f97316";
  ctx.font = `bold ${size * 0.52}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", r, r * 1.04);

  return canvas.toBuffer("image/png");
}

const outDir = join(__dirname, "../public");

writeFileSync(join(outDir, "icon-192.png"), drawIcon(192));
writeFileSync(join(outDir, "icon-512.png"), drawIcon(512));

console.log("✓ Generated icon-192.png and icon-512.png");
