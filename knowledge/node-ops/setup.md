---
type: Runbook
title: Hypersnap node setup
description: Verified setup path for a Hypersnap/Snapchain node using the operator toolkit and upstream bootstrap script.
tags: [node-ops, setup, install, server, docker, snapchain, hypersnap, ports]
status: verified
timestamp: 2026-06-17T00:00:00Z
source_url: https://github.com/arcabotai/hypersnap
---

# Hypersnap node setup

There are two layers:

1. **Arca operator toolkit**: installs the `hypersnap` helper CLI so an operator can preflight, run, verify, diagnose, and share support reports.
2. **Upstream Hypersnap bootstrap**: installs/runs the actual Hypersnap/Snapchain Docker stack from `farcasterorg/hypersnap`.

# Recommended operator path

Install the helper CLI:

```bash
curl -fsSL https://hypersnap.org/install.sh | bash
```

Check the server before running the node bootstrap:

```bash
hypersnap install --preflight
```

Print the exact upstream bootstrap command before executing it:

```bash
hypersnap install --print-command
```

Run the upstream bootstrap only when the operator is ready:

```bash
hypersnap install --yes
```

After install:

```bash
hypersnap install --verify
hypersnap doctor
hypersnap logs
```

# What the upstream bootstrap does

The upstream bootstrap source is:

```text
https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh
```

It creates `~/hypersnap`, fetches `scripts/hypersnap.sh`, installs `jq` if needed, then runs `./hypersnap.sh upgrade`. The upgrade path installs Docker if needed, prompts for the operator agreement, asks for an FID or Farcaster username, writes `.env`, fetches `docker-compose.mainnet.yml`, validators, and Grafana config, starts the Hypersnap container plus StatsD/Grafana support services, and installs an auto-upgrade cron job unless skipped.

The upstream direct command is:

```bash
curl -fsSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash
```

Nightly channel, if an operator explicitly wants it:

```bash
curl -fsSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash -s nightly
```

# Expected services and ports

The upstream mainnet compose uses image `farcasterorg/hypersnap:latest` and exposes:

- TCP `3381`: HTTP/API listener.
- UDP `3382`: gossip.
- TCP `3383`: peer/sync/RPC listener.
- TCP `3000`: Grafana dashboard.

The compose enables Hyper/API features, StatsD metrics, social graph/channels/metrics/search/conversations backfills, and snapshot loading from the configured R2 endpoint.

# Safety notes

Do not paste seed phrases, private keys, signer secrets, API tokens, Grafana credentials, or `.env` contents into chat. Use `hypersnap share --markdown` for a sanitized report when asking for help.

Running a node should not be described as guaranteed token rewards. The upstream script includes an operator agreement prompt warning against assuming rewards.