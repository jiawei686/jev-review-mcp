#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { reviewPatch } from "./tools/review_patch.js";
import { runDoctor } from "./doctor.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] === "doctor") {
    await runDoctor(args.includes("--json"));
    return;
  }

  const server = new McpServer({
    name: "jev-review-mcp",
    version: "0.1.0",
  });

  server.tool(
    "review_patch",
    "Code-review gate powered by Jev (System One decision model). Given a git diff and optional context, returns a verdict (approve / request_changes / needs_discussion), a safety probability, a severity score, a calibrated confidence, and an action (auto_merge / human_review). Only execute auto_merge on high confidence.",
    {
      diff: z.string().describe("The git diff or patch to review."),
      context: z
        .string()
        .optional()
        .describe("Optional surrounding context (file purpose, PR description)."),
    },
    async ({ diff, context }) => {
      const r = await reviewPatch(diff, context);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
