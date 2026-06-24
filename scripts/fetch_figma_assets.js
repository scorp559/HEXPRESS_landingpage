const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

function getToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;
  const tokenFile = path.join(__dirname, '..', 'figma_token.txt');
  if (fs.existsSync(tokenFile)) {
    const content = fs.readFileSync(tokenFile, 'utf8');
    const m = content.match(/FIGMA_TOKEN=(.+)/);
    if (m) return m[1].trim();
  }
  throw new Error('FIGMA_TOKEN not found in env or figma_token.txt');
}

function collectNodeIds(node, out) {
  if (!node) return;
  if (node.id) out.add(node.id);
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectNodeIds(c, out);
  }
}

function chunk(array, size) {
  const res = [];
  for (let i = 0; i < array.length; i += size) res.push(array.slice(i, i + size));
  return res;
}

async function fetchImagesForBatch(fileId, ids, format, token) {
  const idsParam = ids.map(encodeURIComponent).join(',');
  const url = `https://api.figma.com/v1/images/${fileId}?ids=${idsParam}&format=${format}`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) throw new Error(`Figma images API returned ${res.status}`);
  return res.json();
}

async function downloadUrl(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = await res.buffer();
  fs.writeFileSync(outPath, buffer);
}

async function main() {
  const [,, fileId, nodeId, outDirArg] = process.argv;
  if (!fileId || !nodeId) {
    console.error('Usage: node fetch_figma_assets.js <fileId> <nodeId> [outDir]');
    process.exit(2);
  }
  const outDir = outDirArg || path.join(__dirname, '..', 'figma_output', `assets_${fileId}_${nodeId.replace(/[:\\/]/g,'_')}`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const savedPath = path.join(__dirname, '..', 'figma_nodes', `${fileId}-${nodeId.replace(/[:\\/]/g,'_')}.json`);
  if (!fs.existsSync(savedPath)) {
    console.error('Saved node JSON not found at', savedPath);
    process.exit(2);
  }
  const json = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
  const root = json.nodes && json.nodes[nodeId] && json.nodes[nodeId].document;
  if (!root) {
    console.error('Invalid saved JSON structure, cannot find document for node', nodeId);
    process.exit(2);
  }

  const idsSet = new Set();
  collectNodeIds(root, idsSet);
  const ids = Array.from(idsSet);
  console.log(`Collected ${ids.length} node ids; will request assets in batches.`);

  const token = getToken();
  const batches = chunk(ids, 50);
  let total = 0;
  for (const batch of batches) {
    // try SVG first
    let resp = await fetchImagesForBatch(fileId, batch, 'svg', token);
    const images = resp.images || {};
    // for ids without svg, request png
    const missing = batch.filter(id => !images[id]);
    if (missing.length) {
      const respPng = await fetchImagesForBatch(fileId, missing, 'png', token);
      Object.assign(images, respPng.images || {});
    }

    for (const id of batch) {
      const url = images[id];
      if (!url) continue;
      const ext = url.indexOf('.svg') !== -1 || url.includes('svg+xml') ? 'svg' : 'png';
      const outPath = path.join(outDir, `${id.replace(/[:\\/]/g,'_')}.${ext}`);
      try {
        await downloadUrl(url, outPath);
        console.log('Saved', outPath);
        total++;
      } catch (e) {
        console.warn('Failed to download', url, e.message);
      }
    }
  }
  console.log(`Downloaded ${total} assets to ${outDir}`);
}

main().catch(err=>{ console.error(err); process.exit(1); });
