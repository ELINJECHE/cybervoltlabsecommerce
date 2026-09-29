// Generates lightweight placeholder SVG images for products, categories and
// hero banners so the storefront has visual content out of the box. Swap
// any file under /public/assets/images with real photography later — the
// filenames referenced in /data are the contract, not this script.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "..", "public", "assets", "images");
const PRODUCTS_DIR = path.join(IMAGES_DIR, "products");
const PRODUCTS_JSON = path.join(__dirname, "..", "data", "products.json");
const CATEGORIES_JSON = path.join(__dirname, "..", "data", "categories.json");

mkdirSync(PRODUCTS_DIR, { recursive: true });

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapLines(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function placeholderSvg({
  width,
  height,
  colorFrom,
  colorTo,
  title,
  subtitle,
  gradientId,
}) {
  const titleLines = wrapLines(title, Math.floor(width / 22));
  const titleFontSize = Math.round(width / 18);
  const lineHeight = titleFontSize * 1.25;
  const titleStartY = height / 2 - ((titleLines.length - 1) * lineHeight) / 2 - (subtitle ? 14 : 0);

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="50%" y="${titleStartY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const subtitleText = subtitle
    ? `<text x="50%" y="${titleStartY + titleLines.length * lineHeight + 6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.round(titleFontSize * 0.45)}" fill="rgba(255,255,255,0.85)">${escapeXml(subtitle)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorFrom}" />
      <stop offset="100%" stop-color="${colorTo}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradientId})" />
  <text text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${titleFontSize}" fill="#ffffff">${titleTspans}</text>
  ${subtitleText}
</svg>`;
}

const PALETTES = [
  ["#4f46e5", "#3730a3"],
  ["#0d9488", "#115e59"],
  ["#dc2626", "#991b1b"],
  ["#2563eb", "#1d4ed8"],
  ["#7c3aed", "#5b21b6"],
  ["#ca8a04", "#854d0e"],
];

function paletteFor(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

// --- Product images (2 angles each) ---
const products = JSON.parse(readJson(PRODUCTS_JSON));
for (const product of products) {
  const [colorFrom, colorTo] = paletteFor(product.id);
  product.images.forEach((imagePath, index) => {
    const fileName = path.basename(imagePath);
    const label = index === 0 ? "" : ` — ${["Detail", "In use", "Angle 2"][index - 1] ?? "Detail"}`;
    const svg = placeholderSvg({
      width: 800,
      height: 800,
      colorFrom,
      colorTo,
      title: product.name,
      subtitle: `Cybervolt Labs${label}`,
      gradientId: `grad-${product.id}-${index}`,
    });
    writeFileSync(path.join(PRODUCTS_DIR, fileName), svg, "utf8");
  });
}

// --- Category images ---
const categories = JSON.parse(readJson(CATEGORIES_JSON));
for (const category of categories) {
  const [colorFrom, colorTo] = paletteFor(category.slug);
  const fileName = path.basename(category.image);
  const svg = placeholderSvg({
    width: 400,
    height: 400,
    colorFrom,
    colorTo,
    title: category.name,
    subtitle: "",
    gradientId: `grad-cat-${category.slug}`,
  });
  writeFileSync(path.join(IMAGES_DIR, fileName), svg, "utf8");
}

// --- Hero banners ---
const heroBanners = [
  { file: "hero-1.svg", title: "Mega Deals Every Week", subtitle: "Genuine gadgets, Nairobi-fast delivery", palette: ["#4f46e5", "#3730a3"] },
  { file: "hero-2.svg", title: "New Arrivals Just Landed", subtitle: "Fresh audio, wearables & accessories", palette: ["#0d9488", "#115e59"] },
  { file: "hero-3.svg", title: "Pay With M-Pesa On Delivery", subtitle: "Order on WhatsApp, Jumia or right here", palette: ["#dc2626", "#991b1b"] },
];
for (const banner of heroBanners) {
  const svg = placeholderSvg({
    width: 1200,
    height: 500,
    colorFrom: banner.palette[0],
    colorTo: banner.palette[1],
    title: banner.title,
    subtitle: banner.subtitle,
    gradientId: `grad-${banner.file}`,
  });
  writeFileSync(path.join(IMAGES_DIR, banner.file), svg, "utf8");
}

// --- Logo placeholder ---
writeFileSync(
  path.join(IMAGES_DIR, "logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <rect width="240" height="60" rx="8" fill="#4f46e5" />
  <text x="120" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="26" fill="#ffffff">Cybervolt Labs</text>
</svg>`,
  "utf8"
);

console.log(`Generated ${products.reduce((n, p) => n + p.images.length, 0)} product images, ${categories.length} category images, ${heroBanners.length} hero banners, 1 logo.`);

function readJson(filePath) {
  return readFileSync(filePath, "utf8");
}
