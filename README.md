# Ardea Knowledge Steward

Public, source-labelled answers for Hypersnap, Snapchain, Farcaster-fork builders, node operators, and curious humans.

Ardea is the Arca heron steward/nodekeeper for Hypersnap and the broader Farcaster-fork ecosystem. This repo packages that role as a Vercel Eve agent plus a web Q&A surface.

## What this builds

- **Eve agent** under `agent/` with instructions, tools, skills, and a public HTTP channel.
- **OKF-style knowledge bundle** under `knowledge/` using Markdown + YAML frontmatter.
- **Ask Ardea web UI** backed by `/api/ask`. In production it calls a real AI model through Vercel AI Gateway, constrained by the local knowledge bundle. If auth/model calls fail, it falls back to deterministic retrieval instead of hallucinating.
- **Node-status probe** at `/api/node-status` for public reachability checks. It does not overclaim full sync health.
- **$SNAP market endpoint** at `/api/snap-market` that corrects FDV math using the user-confirmed 200B supply.
- **Farcaster/Hypersnap channel scaffold** under `integrations/` for the future mention bot.

## Why not just a chatbot?

Because public protocol support needs provenance. Ardea answers should say whether a claim is verified, inferred, proposal-stage, or unknown. Token and recovery answers carry extra safety rails.

## Local setup

Eve currently requires Node 24. On a host with another default Node, run commands through `node@24`:

```bash
npx -y -p node@24 -p npm@latest npm install
npx -y -p node@24 -p npm@latest npm run dev
```

Then open `http://localhost:3000`.

Useful checks:

```bash
npx -y -p node@24 -p npm@latest npm test
npx -y -p node@24 -p npm@latest npm run typecheck
npx -y -p node@24 -p npm@latest npm run build
```

## API smoke tests

```bash
curl -sS http://localhost:3000/api/ask       -H 'content-type: application/json'       -d '{"question":"What is Hypersnap?"}' | jq

curl -sS http://localhost:3000/api/node-status | jq
curl -sS http://localhost:3000/api/snap-market | jq
```

## Model behavior

`/api/ask` uses `generateText` from the Vercel AI SDK with `ARDEA_MODEL` defaulting to `anthropic/claude-sonnet-4.6`. It sends only retrieved knowledge snippets plus Ardea's safety rules to the model.

Production on Vercel can authenticate to AI Gateway with deployment OIDC. For local development, either run through `vercel dev`, pull Vercel env, or set `AI_GATEWAY_API_KEY` yourself.

Operational knobs:

```bash
ARDEA_MODEL=anthropic/claude-sonnet-4.6
ARDEA_AI_ENABLED=1       # set 0 to force deterministic retrieval
ARDEA_DISABLE_AI=1       # emergency hard-disable
```

The API has a small in-memory throttle and a question length cap. That is not a full anti-abuse layer; add a durable rate limiter before making a high-traffic public launch.

## Knowledge bundle

Knowledge lives under `knowledge/`. Each concept is a Markdown file with YAML frontmatter:

```md
---
type: Protocol Primer
title: Snapchain basics
description: Short summary.
tags: [snapchain, nodes]
status: inferred
---
```

This follows the useful parts of the Open Knowledge Format pattern: plain files, frontmatter, citations/provenance, and git review.

## Responsible use

Ardea must not:

- ask for seed phrases, private keys, app recovery phrases, or signer secrets;
- provide investment advice or imply guaranteed token rewards;
- present draft governance or tokenomics as final policy;
- make farcaster.xyz, hosted APIs, Mini Apps, or Farcaster Snaps a permanent core dependency unless explicitly chosen.

## Farcaster / Hypersnap mention bot roadmap

`integrations/farcaster-channel.example.ts` documents the env contract and routing shape for the mention bot. Before enabling posting, implement:

- webhook signature verification;
- signer custody policy;
- rate limits and anti-spam;
- source/provenance rendering in replies;
- review/approval mode for recovery, token, or governance-sensitive answers;
- native Snapchain/Hypersnap read path, with hosted Farcaster APIs only as labelled compatibility bridges.

## Deployment

```bash
npx -y -p node@24 -p npm@latest npm run build
vercel --prod
```

If wiring into `hypersnap.org`, prefer linking to the deployed Ask Ardea URL first. Embed/proxy only after the agent API and Farcaster channel are stable.

## License

Apache-2.0.
