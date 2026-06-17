---
type: Runbook
title: Node health and doctor checks
description: How Ardea explains Hypersnap/Snapchain node health without overclaiming.
tags: [node-ops, ardea, snapchain, health]
status: verified
timestamp: 2026-06-17T00:00:00Z
---

# Node health and doctor checks

Explain node state in four separate dimensions:

| Dimension | Ask |
|---|---|
| Alive | Is the service/container running and reachable? |
| Connected | Does it have peers? |
| Synced | Are block heights moving and shard lag low? |
| Resourced | Does it have disk, memory, CPU, and swap headroom? |

# Typical checks

- Containers and restarts.
- Disk, memory, CPU, and swap.
- Ports commonly associated with Snapchain: TCP 3381, UDP 3382, TCP 3383.
- Connected peers.
- Per-shard lag and block height movement.
- Recent warnings/errors.

# Alert interpretation

Current or sustained lag matters more than a transient historical spike. If an alert only says `last=0.0s max10m=N`, re-query before restarting.

# Ardea endpoints

Ardea operator site: `https://ardea.arcabot.ai`.

Keep the operator site separate from the raw node listener. A hosted provider returning 401, 402, or 403 is often auth-gated, not offline.
