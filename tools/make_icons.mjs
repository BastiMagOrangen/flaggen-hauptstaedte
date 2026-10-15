// Renders public/icon-*.png from an inline SVG. Usage: node tools/make_icons.mjs
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#0f172a"/>
<rect x="176" y="120" width="24" height="272" rx="8" fill="#e2e8f0"/>
<path d="M200 128h176v112H200z" fill="#ef4444"/>
<path d="M200 184h176v56H200z" fill="#f8fafc"/></svg>`;
for (const s of [192, 512]) await sharp(Buffer.from(svg)).resize(s, s).png().toFile(`public/icon-${s}.png`);
