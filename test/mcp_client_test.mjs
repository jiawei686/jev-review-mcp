// Canonical MCP protocol test using the SDK's own Client + StdioClientTransport.
// This is the authoritative check that the server speaks MCP (hand-rolled
// stdio framing tests are unreliable).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  cwd: process.cwd(),
  env: { ...process.env, JEV_MCP_MOCK: "1" },
});

const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: {} });

await client.connect(transport);
console.log("CONNECTED");

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));
assertSingleTool(tools.tools.map((t) => t.name));

const review = await client.callTool({
  name: "review_patch",
  arguments: { diff: "const x = 1;", context: "trivial constant" },
});
console.log("REVIEW(clean):", review.content[0].text);

await client.close();
console.log("DONE_OK");

function assertSingleTool(names) {
  if (names.length !== 1 || names[0] !== "review_patch") {
    throw new Error("expected exactly [review_patch], got: " + JSON.stringify(names));
  }
}
