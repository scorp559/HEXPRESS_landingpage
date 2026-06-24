const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function getToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;
  const tokenFile = path.join(__dirname, 'figma_token.txt');
  if (fs.existsSync(tokenFile)) {
    const content = fs.readFileSync(tokenFile, 'utf8');
    const m = content.match(/FIGMA_TOKEN=(.+)/);
    if (m) return m[1].trim();
  }
  return null;
}

async function proxyFigma(url) {
  const token = getToken();
  if (!token) throw new Error('FIGMA_TOKEN not set in env or figma_token.txt');
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Figma API returned ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

app.get('/mcp/figma/file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const data = await proxyFigma(`https://api.figma.com/v1/files/${fileId}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/mcp/figma/node/:fileId/:nodeId', async (req, res) => {
  try {
    const { fileId, nodeId } = req.params;
    const data = await proxyFigma(`https://api.figma.com/v1/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Serve and persist a section/node JSON locally: saves to ./figma_nodes/:fileId-:nodeId.json
app.get('/mcp/figma/section/:fileId/:nodeId', async (req, res) => {
  try {
    const { fileId, nodeId } = req.params;
    const storageDir = path.join(__dirname, 'figma_nodes');
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
    const safeFileId = fileId.replace(/[:\\/]/g, '_');
    const safeNodeId = nodeId.replace(/[:\\/]/g, '_');
    const outPath = path.join(storageDir, `${safeFileId}-${safeNodeId}.json`);

    if (fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      return res.json(existing);
    }

    const data = await proxyFigma(`https://api.figma.com/v1/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send(`Figma MCP proxy running. Use /mcp/figma/file/:fileId or /mcp/figma/node/:fileId/:nodeId`);
});

app.listen(PORT, () => {
  console.log(`Figma MCP proxy listening on http://localhost:${PORT}`);
});
