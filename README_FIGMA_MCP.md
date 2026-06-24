Figma MCP proxy

This small Express server proxies the Figma REST API and exposes two MCP-like endpoints for local use:

- GET /mcp/figma/file/:fileId  -> returns the file JSON
- GET /mcp/figma/node/:fileId/:nodeId  -> returns the node JSON for the given node id

Usage

1. Install dependencies

```powershell
npm install
```

2. Ensure your `FIGMA_TOKEN` is available either via environment variable or in `figma_token.txt` in the project root with a line `FIGMA_TOKEN=...`.

3. Start server

```powershell
npm start
```

4. Example requests

```powershell
Invoke-RestMethod http://localhost:3000/mcp/figma/file/hLRRQe7eKC1YCkOEQ9rx7o
Invoke-RestMethod http://localhost:3000/mcp/figma/node/hLRRQe7eKC1YCkOEQ9rx7o/1:5204
```

Notes

- `figma_token.txt` is ignored by `.gitignore`. Don't commit secrets to source control.
- This is a minimal proxy for development only.
