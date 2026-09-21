# jev-review-mcp

A **single-purpose** MCP server: one tool, one job. Powered by
[TypeSafe Jev](https://typesafe.ai) — the System One decision model. The host
agent gets a **typed decision, not prose**: the tool pre-builds the Jev
questions (candidate set, rubric, thresholds), so the agent never needs to know
Jev's API.

This is deliberately *not* a multi-tool "toolbox". One MCP = one function.

## Tool

| Tool | What it decides |
|------|----------------|
| `review_patch` | Patch verdict (approve / request_changes / needs_discussion), safety probability, severity, **auto_merge vs human_review** |

Returns a `confidence` (calibration concentration, **not** truth) and an
`action` the agent can branch on directly. **Execute `auto_merge` only on high
confidence.**

## Install

```bash
npm install
npm run build
```

Set your key (optional — without it the server runs in deterministic **mock**
mode, no network):

```bash
export TYPESAFE_API_KEY=ts_xxx      # live Jev calls
# or
export JEV_MCP_MOCK=1               # force deterministic mock (no key needed)
```

Diagnostics:

```bash
node dist/index.js doctor
node dist/index.js doctor --json
```

## Use

Register the server with any MCP client (Cursor, Codex, Claude Code, WorkBuddy):

```json
{
  "mcpServers": {
    "jev-review": {
      "command": "node",
      "args": ["/absolute/path/to/jev-review-mcp/dist/index.js"],
      "env": { "TYPESAFE_API_KEY": "ts_xxx" }
    }
  }
}
```

Then the agent can call `review_patch` like any other tool.

## How it works

```
diff (+ context) ──► Jev: one request, parallel typed questions ──► structured result
```

- `Noul` → 0..1 probability (is it safe?)
- `Choice` → pick from a fixed candidate set (verdict)
- `Score` → ordinal rubric (severity)

The result includes `probabilities` + `confidence`, and an `action` derived
from a simple confidence gate. **Low confidence always routes to a human /
stronger model** — that is the whole point of a calibrated decision model.

## Constraints (from Jev)

- Pure text input: no image / audio / video.
- State + all questions must fit ~64k tokens total; a single question ≤ 32k.
- Do arithmetic / date math in host code, not in Jev.
- Output is **free**; you pay only for input tokens.

## License

MIT
