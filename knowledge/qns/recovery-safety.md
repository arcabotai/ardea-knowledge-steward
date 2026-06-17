---
type: Safety Guide
title: QNS and recovery safety
description: Safe guidance for Q names, recovery phrases, wallets, and profile ownership questions.
tags: [qns, recovery, identity, safety]
status: inferred
timestamp: 2026-06-17T00:00:00Z
---

# QNS and recovery safety

Never ask users to paste a seed phrase, recovery phrase, private key, signer secret, or screenshot of secret material.

# Separate layers

| Layer | Meaning |
|---|---|
| App profile | The account/profile inside an app. |
| Protocol identity | FID or protocol-recognized identity. |
| Owner wallet | Wallet that controls or purchased a name/asset. |
| Recovery authority | Key/phrase/wallet allowed to recover an account. |
| App signer | Delegated key allowed to publish app actions. |
| Gas | Network fee for onchain actions where relevant. |

If a name was bought by a different wallet than the profile wallet, the owner wallet may need to connect first in the official flow.

Avoid inventing exact UI labels unless verified from current official app/docs. Describe the authority chain instead.
