import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const src = await readFile("lib/portrait.ts", "utf8");
const rows = JSON.parse(src.match(/portrait: string\[\] = (\[[\s\S]*?\]);/)[1]);
const shade = JSON.parse(src.match(/portraitShade: string\[\] = (\[[\s\S]*?\]);/)[1]);
const CW = 7, CH = 14;
const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let body = "";
rows.forEach((line, y) => {
  [...line].forEach((ch, x) => {
    if (ch === " ") return;
    const o = 1;
    body += `<text x="${x*CW}" y="${(y+1)*CH-3}" fill="#33ff66" fill-opacity="${o.toFixed(2)}">${esc(ch)}</text>`;
  });
});
const W = Math.max(...rows.map(r=>r.length))*CW, H = rows.length*CH;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#020a02"/><g font-family="Menlo,monospace" font-size="12">${body}</g></svg>`;
await sharp(Buffer.from(svg)).resize(W*2, H*2, {kernel:"nearest"}).png().toFile(process.argv[2]);
console.log("ok", W, H);
