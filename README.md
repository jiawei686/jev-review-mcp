# jev-review-mcp

<p align="center">
  <img src="assets/usage-spend.png" width="520" alt="Jev cost on OpenRouter"/>
</p>

> Code-review gate as a **single-purpose** MCP tool, powered by **Jev** (TypeSafe's System One decision model). One MCP, one job.

*Real-world usage on OpenRouter: **4.9M tokens · $0.19 over 7 days.***


Turns a git diff into a **typed decision** — no prose, no Jev API knowledge needed from the host agent.

## 1. Install
```bash
npm install && npm run build
```

## 2. Add to your MCP client
```json
{
  "mcpServers": {
    "jev-review": {
      "command": "node",
      "args": ["/absolute/path/jev-review-mcp/dist/index.js"],
      "env": { "TYPESAFE_API_KEY": "ts_xxx" }
    }
  }
}
```
No key? It still runs in **mock mode** (`JEV_MCP_MOCK=1`, no network) so you can try it offline.

## Tool
`review_patch(diff, context?)` →
```json
{
  "verdict": "approve | request_changes | needs_discussion",
  "safe_prob": 0.92,
  "severity_label": "trivial",
  "confidence": 0.7,
  "action": "auto_merge | human_review"
}
```
Only act on `auto_merge` when `confidence` is high; route everything else to a human.

## Model endpoint
Works with any Jev-compatible endpoint. Default is the TypeSafe API
(`https://api.typesafe.ai/v1/systemone`); override with `JEV_BASE_URL`
(e.g. an OpenRouter-compatible route) and set `TYPESAFE_API_KEY` to your
provider key.

## License
MIT
