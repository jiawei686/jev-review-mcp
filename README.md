# jev-review-mcp

> 🇨🇳 [中文文档](README.zh-CN.md)

> Code-review gate as a **single-purpose** MCP tool, powered by **Jev** (TypeSafe's System One decision model). One MCP, one job.

Real-world cost on OpenRouter — **4.9M tokens · $0.19 over 7 days**:

<img src="assets/usage-spend.png" alt="Jev cost on OpenRouter" width="100%"/>

Turns a git diff into a **typed decision** — no prose, no Jev API knowledge needed from the host agent.

## What it does

`review_patch(diff, context?)` returns a structured verdict instead of free-form text:

| Field | Type | Meaning |
|-------|------|---------|
| `verdict` | `approve` \| `request_changes` \| `needs_discussion` | Overall call on the patch |
| `safe_prob` | number (0–1) | P(safe to merge without human review) |
| `severity_score` | number (0–4) | Index into the severity scale |
| `severity_label` | `trivial` \| `minor` \| `moderate` \| `major` \| `critical` | Human-readable severity |
| `confidence` | number (0–1) | Model's calibrated certainty on the verdict |
| `action` | `auto_merge` \| `human_review` | What the agent should do next |
| `recommended` | boolean | Convenience flag = (`action === "auto_merge"`) |

**Decision gate:** `action` is `auto_merge` only when `verdict === "approve"` **and** `safe_prob > 0.8` **and** `confidence >= 0.6`. Every other case is `human_review`.

> ⚠️ Only execute `auto_merge` on high `confidence`. A high `safe_prob` alone is never permission to merge — gate on `confidence`.

## Install & build

```bash
npm install
npm run build
```

The compiled server is at `dist/index.js`.

## Add to your MCP client

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

No key? It still runs in **mock mode** (`JEV_MCP_MOCK=1`, or simply no `TYPESAFE_API_KEY`) so you can try it offline.

## Example call

```json
{
  "diff": "diff --git a/src/app.ts b/src/app.ts\n- const x = secret\n+ const x = process.env.SECRET",
  "context": "Move hardcoded secret to an env var"
}
```

returns something like:

```json
{
  "verdict": "request_changes",
  "safe_prob": 0.2,
  "severity_score": 4,
  "severity_label": "critical",
  "confidence": 0.7,
  "action": "human_review",
  "recommended": false
}
```

## Model endpoint

Works with any Jev-compatible endpoint. Default is the TypeSafe API
(`https://api.typesafe.ai/v1/systemone`); override with `JEV_BASE_URL`
(e.g. an OpenRouter-compatible route) and set `TYPESAFE_API_KEY` to your
provider key.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TYPESAFE_API_KEY` | — | TypeSafe Jev key. Absent ⇒ mock mode |
| `JEV_MCP_MOCK` | `0` | Set `1` to force the deterministic offline mock |
| `JEV_MODEL` | `jev-latest` | Model id sent to the endpoint |
| `JEV_BASE_URL` | `https://api.typesafe.ai/v1/systemone` | API base URL |
| `JEV_MCP_TIMEOUT_MS` | `30000` | Per-call timeout (ms) |

## Mock mode

With no key (or `JEV_MCP_MOCK=1`) the server answers **deterministically** from
keyword heuristics — useful for demos, tests, and offline development. A single
derived risk signal drives every field, so the mock stays internally consistent
(risky diff → low `safe_prob`, high severity, `human_review`).

## Diagnostics

```bash
node dist/index.js doctor          # human-readable
node dist/index.js doctor --json   # machine-readable
```

Prints mock/live mode, key presence, model, and base URL.

## Test

```bash
npm test
```

Runs a smoke test against the compiled output in deterministic mock mode.

## Notes

- Jev is a **decision** model: pure text in → typed decision out. It does not read
  images or generate prose.
- Diffs are truncated at 60k characters to stay within Jev's ~64k-token budget.
- Keep the human in the loop: route anything that is not a high-confidence
  `auto_merge` to a person.

## License

MIT
