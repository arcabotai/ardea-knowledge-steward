# Build report

```text

$ node -v
v22.22.2
exit_code=0

$ npx -y -p node@24 -p npm@latest node -v
v24.16.0
exit_code=0

$ npx -y -p node@24 -p npm@latest -p eve@latest eve --version
0.11.4
exit_code=0

$ npx -y -p node@24 -p npm@latest -p eve@latest eve init --channel-web-nextjs ardea-knowledge-steward
 eve  v0.11.4
eve is currently a preview and subject to the Vercel beta terms; the framework, APIs, documentation, and behavior may change before general availability.
✓ Created an eve agent in /root/ardea-knowledge-steward
eve is currently a preview and subject to the Vercel beta terms; the framework, APIs, documentation, and behavior may change before general availability.
Installing dependencies...
✓ Installed dependencies
$ eve dev --input /model
 eve  v0.11.4
eve is currently a preview and subject to the Vercel beta terms; the framework, APIs, documentation, and behavior may change before general availability.
--input requires the interactive UI.
Development server exited unsuccessfully in "/root/ardea-knowledge-steward".
exit_code=1

$ git config user.name Cad from Arca
exit_code=0

$ git config user.email cad@arcabot.ai
exit_code=0

$ npx -y -p node@24 -p npm@latest npm install

added 6 packages, removed 5 packages, and audited 723 packages in 4s

138 packages are looking for funding
  run `npm fund` for details

4 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn allow-scripts   sharp@0.34.5 (install: node install/check.js || npm run build)
npm warn allow-scripts
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
exit_code=0

$ npx -y -p node@24 -p npm@latest npm test

> ardea-knowledge-steward@0.1.0 test
> node --test tests/*.test.mjs

✖ knowledge docs are OKF-like markdown with type frontmatter (3.390131ms)
✔ safety instructions reject secret collection (0.383652ms)
✔ $SNAP supply constants are documented (0.231381ms)
ℹ tests 3
ℹ suites 0
ℹ pass 2
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 88.982373

✖ failing tests:

test at tests/knowledge.test.mjs:16:1
✖ knowledge docs are OKF-like markdown with type frontmatter (3.390131ms)
  AssertionError [ERR_ASSERTION]: /root/ardea-knowledge-steward/knowledge/farcaster/protocol.md needs YAML frontmatter with type
      at TestContext.<anonymous> (file:///root/ardea-knowledge-steward/tests/knowledge.test.mjs:21:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1306:25)
      at Test.start (node:internal/test_runner/test:1177:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: '---\ntype: Protocol Primer\ntitle: Farcaster protocol\ndescription: A protocol layer for social identity, messages, signers, reactions, and client interoperability.\ntags: [farcaster, protocol, identity, casts]\nstatus: verified\ntimestamp: 2026-06-17T00:00:00Z\n---\n\n# Farcaster protocol\n\nUse **Farcaster protocol** for the network/protocol layer. Use **Farcaster app** for the official app surface.\n\nCore concepts to keep distinct:\n\n- Account/FID: protocol identity.\n- Custody or recovery authority: wallet/control layer for account-level actions.\n- App signer: delegated key that can publish app actions.\n- Cast/message: social content object.\n- Reaction: protocol object targeting another message.\n- Client/app: one interface over the protocol.\n\n# Fork-compatible framing\n\nHypersnap should be presented as protocol-compatible where appropriate, while retaining a path toward independent infrastructure and provenance.\n',
    expected: /^---\n[\s\S]*?\ntype:/,
    operator: 'match',
    diff: 'simple'
  }
exit_code=1

ERROR: CalledProcessError(1, 'npx -y -p node@24 -p npm@latest npm test')
```
