#!/usr/bin/env node
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const fileId = process.argv[2] || 'hLRRQe7eKC1YCkOEQ9rx7o';
const nodeId = process.argv[3] || '1:9760';
const out = process.argv[4] || path.join(__dirname, '..', `tmp_figma_node_${nodeId.replace(/[:\\/]/g,'_')}.json`);

const maxAttempts = parseInt(process.env.MAX_ATTEMPTS || '8', 10);
const baseDelay = parseInt(process.env.BASE_DELAY_MS || '1000', 10);

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchNode(){
  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try{
      console.log(`Attempt ${attempt} -> GET http://localhost:3000/mcp/figma/node/${fileId}/${encodeURIComponent(nodeId)}`);
      const res = await fetch(`http://localhost:3000/mcp/figma/node/${fileId}/${encodeURIComponent(nodeId)}`);
      if(!res.ok){
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
      console.log('Saved:', out);
      return;
    }catch(err){
      console.error(`Error on attempt ${attempt}:`, err.message);
      if(attempt === maxAttempts){
        console.error('Max attempts reached — giving up.');
        process.exit(2);
      }
      const jitter = Math.random() * 500;
      const delay = Math.min(30000, baseDelay * Math.pow(2, attempt-1)) + jitter;
      console.log(`Waiting ${Math.round(delay)}ms before retrying...`);
      await sleep(delay);
    }
  }
}

fetchNode().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
