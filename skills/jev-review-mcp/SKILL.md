---
name: jev-review-mcp
description: Single-purpose MCP server that wraps Jev (TypeSafe System One decision model) as a code-review gate. Use when an agent needs a typed approve/request_changes decision with an auto_merge confidence gate for a git diff — without writing Jev API calls. Trigger on "review this patch", "should I merge this", "code review gate", "auto-merge decision".
---

# jev-review-mcp

One MCP, one function: a **code-review gate** powered by Jev.

## What it gives you
- Tool `review_patch(diff, context?)` → `{ verdict, safe_prob, severity_score, severity_label, confidence, action, recommended }`.
- `action` is `auto_merge` (only when verdict=approve, safe_prob>0.8, confidence>=0.6) or `human_review`.
- The agent must only act on `auto_merge` when `confidence` is high. Low confidence ⇒ route to a human.

## Why single-purpose
This server is intentionally NOT a multi-tool toolbox. One MCP = one function, so
it is trivial to compose, audit, and swap. The companion server `jev-screen-mcp`
handles content moderation; each is independent.

## Setup for the host agent
```json
{ "mcpServers": { "jev-review": {
  "command": "node",
  "args": ["/abs/path/jev-review-mcp/dist/index.js"],
  "env": { "TYPESAFE_API_KEY": "ts_xxx" }
}}}
```
- No key ⇒ deterministic **mock** mode (no network). Force with `JEV_MCP_MOCK=1`.
- `node dist/index.js doctor` prints auth/mode diagnostics.

## Notes
- Jev is a *decision* model: pure text in, typed decision out. It does not read
  images or generate prose.
- `confidence` is the model's reported calibration, not truth. Never treat a
  high `safe_prob` as permission to auto-merge on its own.
- Keep diffs within Jev's ~64k token total budget (the tool truncates at 60k).
