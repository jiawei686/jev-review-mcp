// Smoke test: exercises review_patch in deterministic MOCK mode.
// Runs against the compiled output (run `npm run build` first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewPatch } from "../dist/tools/review_patch.js";

process.env.JEV_MCP_MOCK = "1";

test("review_patch returns a structured verdict", async () => {
  const r = await reviewPatch(
    "diff --git a/x b/x\n@@\n-print('hi')\n+print('hello')"
  );
  assert.ok(["approve", "request_changes", "needs_discussion"].includes(r.verdict));
  assert.ok(r.safe_prob >= 0 && r.safe_prob <= 1);
  assert.ok(r.confidence >= 0 && r.confidence <= 1);
  assert.ok(["auto_merge", "human_review"].includes(r.action));
});

test("review_patch flags risky diff as not auto-merge", async () => {
  const r = await reviewPatch(
    "DELETE FROM users; DROP TABLE sessions; -- critical security change"
  );
  // Risky keywords drive safe_prob down, so it should not auto-merge.
  assert.equal(r.action, "human_review");
  assert.ok(r.safe_prob < 0.9);
});
