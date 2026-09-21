import { decide, type JevChoice, type JevScore } from "../jev.js";

export interface ReviewPatchResult {
  verdict: "approve" | "request_changes" | "needs_discussion";
  safe_prob: number;
  severity_score: number;
  severity_label: string;
  confidence: number;
  action: "auto_merge" | "human_review";
  recommended: boolean;
}

const SEVERITY = ["trivial", "minor", "moderate", "major", "critical"];

/**
 * Code-review gate. Given a diff (+ optional context), Jev decides whether the
 * patch is safe, how severe any issues are, and an overall verdict. The agent
 * should execute `auto_merge` only on high confidence.
 */
export async function reviewPatch(
  diff: string,
  context?: string
): Promise<ReviewPatchResult> {
  const state = buildState(diff, context);
  const questions = {
    safe: {
      type: "noul" as const,
      instructions:
        "Is this patch safe to merge without human review? Answer yes only if it has no obvious bugs, no security issues, and low risk.",
    },
    severity: {
      type: "score" as const,
      instructions: "If issues exist, how severe are they?",
      criteria: SEVERITY,
    },
    verdict: {
      type: "choice" as const,
      instructions: "Overall verdict for this patch.",
      options: ["approve", "request_changes", "needs_discussion"],
    },
  };

  const a = await decide(state, questions);
  const safe = a.safe as number;
  const sev = a.severity as JevScore;
  const verdict = a.verdict as JevChoice;

  // Confidence = the model's reported certainty on the verdict & severity
  // questions (not the safe-probability magnitude).
  const confidence = Math.min(sev.confidence, verdict.confidence);
  const auto = verdict.choice === "approve" && safe > 0.8 && confidence >= 0.6;
  const action: ReviewPatchResult["action"] = auto ? "auto_merge" : "human_review";

  return {
    verdict: verdict.choice as ReviewPatchResult["verdict"],
    safe_prob: round(safe),
    severity_score: round(sev.score),
    severity_label: SEVERITY[clampIdx(sev.score, SEVERITY.length)] ?? "unknown",
    confidence: round(confidence),
    action,
    recommended: action === "auto_merge",
  };
}

function buildState(diff: string, context?: string): string {
  const head = context ? `Context: ${context}\n\n` : "";
  const body = `Diff:\n${diff}`;
  // Keep within Jev's 64k total budget; truncate defensively.
  return (head + body).slice(0, 60000);
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function clampIdx(score: number, len: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(len - 1, Math.round(score)));
}
