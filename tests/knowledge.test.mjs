import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

test("knowledge docs are OKF-like markdown with type frontmatter", () => {
  const docs = walk(path.join(root, "knowledge"));
  assert.ok(docs.length >= 8, "expected seeded knowledge docs");
  for (const file of docs) {
    const raw = fs.readFileSync(file, "utf8");
    assert.match(raw, /^---\n[\s\S]*?^type:/m, `${file} needs YAML frontmatter with type`);
  }
});

test("safety instructions reject secret collection", () => {
  const instructions = fs.readFileSync(path.join(root, "agent/instructions.md"), "utf8");
  assert.match(instructions, /Never ask a user to paste seed phrases/i);
  assert.match(instructions, /no investment advice/i);
});

test("Q name recovery questions retrieve the QNS safety document first", async () => {
  const { searchKnowledge } = await import("../lib/knowledge.ts");
  const [top] = searchKnowledge("What should I know before recovering a Q name?", 3);
  assert.equal(top.id, "qns/recovery-safety");
});

test("general Hypersnap questions do not trigger token warning classifier", () => {
  const answerSource = fs.readFileSync(path.join(root, "lib/answer.ts"), "utf8");
  assert.ok(!answerSource.includes("/snap|hypria|token|claim|fdv|price|airdrop|reward/"));
  assert.match(answerSource, /\\\$snap\|hypria/);
});

test("$SNAP supply constants are documented", () => {
  const doc = fs.readFileSync(path.join(root, "knowledge/token/snap-and-hypria.md"), "utf8");
  assert.match(doc, /200,000,000,000/);
  assert.match(doc, /correctedFdv = priceUsd \* 200_000_000_000/);
});
