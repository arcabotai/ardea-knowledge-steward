---
type: Protocol Primer
title: Farcaster protocol
description: A protocol layer for social identity, messages, signers, reactions, and client interoperability.
tags: [farcaster, protocol, identity, casts]
status: verified
timestamp: 2026-06-17T00:00:00Z
---

# Farcaster protocol

Use **Farcaster protocol** for the network/protocol layer. Use **Farcaster app** for the official app surface.

Core concepts to keep distinct:

- Account/FID: protocol identity.
- Custody or recovery authority: wallet/control layer for account-level actions.
- App signer: delegated key that can publish app actions.
- Cast/message: social content object.
- Reaction: protocol object targeting another message.
- Client/app: one interface over the protocol.

# Fork-compatible framing

Hypersnap should be presented as protocol-compatible where appropriate, while retaining a path toward independent infrastructure and provenance.
