const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const tokenFile = path.resolve(__dirname, '..', 'figma_token.txt');
const outDir = path.resolve(__dirname, '..', 'hexpress webpage', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const fileKey = 'hLRRQe7eKC1YCkOEQ9rx7o';
const ids = ['1:5217','17:97','17:100','17:101'];
const nameMap = { '1:5217': 'logo.svg', '17:97': 'search.svg', '17:100': 'user1.svg', '17:101': 'user2.svg' };

function readToken(){
  const content = fs.readFileSync(tokenFile,'utf8');
  const m = content.split(/\r?\n/).find(l=>l.startsWith('FIGMA_TOKEN='));
  if(!m) throw new Error('FIGMA_TOKEN not found in '+tokenFile);
  return m.split('=')[1].trim();
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

async function fetchWithRetry(url, options={}, attempts=5){
  let wait = 500;
  for(let i=0;i<attempts;i++){
    const res = await fetch(url, options);
    if(res.status===429){
      const retryAfter = res.headers.get('retry-after');
      const maxDelay = 60000; // cap to 60s
      const parsed = retryAfter ? parseInt(retryAfter) : NaN;
      const delay = !isNaN(parsed) ? Math.min(parsed*1000, maxDelay) : Math.min(wait, maxDelay);
      console.log(`429 received, backing off ${delay}ms (attempt ${i+1})`);
      await sleep(delay);
      wait = Math.min(wait * 2, maxDelay);
      continue;
    }
    return res;
  }
  throw new Error(`Failed after ${attempts} attempts: ${url}`);
}

async function download(){
  const token = readToken();
  // Request each id individually with a small delay to avoid rate limits
  for(const id of ids){
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${id}&format=svg`;
    try{
      const res = await fetchWithRetry(url, { headers: { 'X-Figma-Token': token } }, 5);
      if(!res.ok){ console.log('Images API returned', res.status, 'for', id); continue }
      const json = await res.json();
      const imgUrl = json.images && json.images[id];
      if(!imgUrl){ console.log('No URL returned for', id); continue }
      const name = nameMap[id] || id.replace(':','_')+'.svg';
      const outPath = path.join(outDir, name);
      const r = await fetchWithRetry(imgUrl, {}, 5);
      if(!r.ok){ console.log('Failed to fetch image', r.status, id); continue }
      const text = await r.text();
      fs.writeFileSync(outPath, text, 'utf8');
      console.log('Saved', name);
    }catch(err){
      console.log('Error for', id, err.message);
    }
    // small pause between requests
    await sleep(1000);
  }
}

download().catch(err=>{ console.error(err); process.exit(1) });
