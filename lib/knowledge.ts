import fs from "node:fs";
import path from "node:path";

export type KnowledgeStatus = "verified" | "inferred" | "proposal-stage" | "unknown" | string;

export type KnowledgeDoc = {
  id: string;
  title: string;
  type: string;
  description: string;
  tags: string[];
  status: KnowledgeStatus;
  body: string;
  href: string;
};

function parseFrontmatter(raw: string): { frontmatter: Record<string, string | string[]>; body: string } {
  if (!raw.startsWith("---")) return { frontmatter: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: {}, body: raw };
  const yaml = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const frontmatter: Record<string, string | string[]> = {};
  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      frontmatter[key] = value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
    } else {
      frontmatter[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
  return { frontmatter, body };
}

function walkMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

export function loadKnowledge(): KnowledgeDoc[] {
  const root = path.join(process.cwd(), "knowledge");
  return walkMarkdown(root).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const id = rel.replace(/\.md$/, "");
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    return {
      id,
      title: String(frontmatter.title || id),
      type: String(frontmatter.type || "Concept"),
      description: String(frontmatter.description || ""),
      tags,
      status: String(frontmatter.status || "unknown"),
      body,
      href: `/knowledge/${rel}`,
    };
  });
}

function tokenize(input: string): string[] {
  const lower = input.toLowerCase();
  const raw = lower.match(/[a-z0-9$]+/g)?.filter((t) => t.length > 1) || [];
  const terms = new Set<string>();

  for (const term of raw) {
    if (term.length > 2 || term === "q") terms.add(term);
    if (term.endsWith("ing") && term.length > 5) terms.add(term.slice(0, -3));
    if (term.endsWith("ed") && term.length > 4) terms.add(term.slice(0, -2));
    if (term.endsWith("s") && term.length > 4) terms.add(term.slice(0, -1));
  }

  const add = (...items: string[]) => items.forEach((item) => terms.add(item));
  if (/\b(q\s*name|qns|recover|recovery|seed|phrase|private key|owner wallet)\b/.test(lower)) {
    add("qns", "recovery", "recover", "identity", "safety", "owner", "wallet", "phrase");
  }
  if (/\b(node|health|sync|peer|lag|doctor|operator)\b/.test(lower)) {
    add("node", "health", "snapchain", "operator", "sync", "lag", "doctor");
  }
  if (/\b(\$snap|snap|fdv|dexscreener|hypria|token|claim)\b/.test(lower)) {
    add("$snap", "snap", "fdv", "dexscreener", "hypria", "tokenomics", "supply");
  }
  if (/\b(farcaster|fork|protocol|signer|fid|cast)\b/.test(lower)) {
    add("farcaster", "protocol", "fid", "signer", "cast", "fork");
  }
  if (/\b(hypersnap|what is hypersnap|independent)\b/.test(lower)) {
    add("hypersnap", "independent", "farcaster", "snapchain");
  }

  return [...terms];
}

export function searchKnowledge(query: string, limit = 5): Array<KnowledgeDoc & { score: number; snippet: string }> {
  const terms = tokenize(query);
  const docs = loadKnowledge();
  return docs
    .map((doc) => {
      const haystack = `${doc.id} ${doc.title} ${doc.description} ${doc.type} ${doc.tags.join(" ")} ${doc.body}`.toLowerCase();
      let score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      if (doc.id === "index") score -= 1;
      if (doc.id.startsWith("sources/")) score -= 0.5;
      const firstParagraph = doc.body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith("#")) || doc.description;
      return { ...doc, score, snippet: firstParagraph.replace(/\s+/g, " ").slice(0, 420) };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
