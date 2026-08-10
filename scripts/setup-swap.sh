#!/bin/bash
# One-time setup: add a swapfile to the production host.
#
# Why: this droplet has no swap. Without it, a transient memory spike
# (e.g. a container briefly exceeding its docker-compose mem_limit, or a
# heavy request) can trigger the OOM killer abruptly or, worse, leave the
# kernel unable to allocate memory for anything new -- including a new SSH
# session -- which is what "stuck, can't even SSH in" looks like from
# outside. Swap gives the kernel room to degrade gracefully instead.
#
# Run this once, directly on the production host, as root (or via sudo):
#   sudo bash scripts/setup-swap.sh
#
# Safe to re-run: it's a no-op if /swapfile already exists and is active.

set -euo pipefail

SWAPFILE=/swapfile
SWAP_SIZE_GB=2

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo bash scripts/setup-swap.sh)." >&2
  exit 1
fi

if swapon --show | grep -q "$SWAPFILE"; then
  echo "Swap already active at $SWAPFILE, nothing to do."
  exit 0
fi

if [ -f "$SWAPFILE" ]; then
  echo "$SWAPFILE exists but isn't active as swap -- inspect it manually before re-running." >&2
  exit 1
fi

echo "==> Allocating ${SWAP_SIZE_GB}G swapfile at $SWAPFILE..."
fallocate -l "${SWAP_SIZE_GB}G" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count=$((SWAP_SIZE_GB * 1024))
chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"

echo "==> Persisting across reboots via /etc/fstab..."
if ! grep -q "^$SWAPFILE " /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

# Low swappiness: prefer RAM, only spill to swap (which is much slower,
# especially on a small droplet's disk) under real pressure rather than
# proactively -- this is meant as a safety margin, not primary memory.
echo "==> Tuning vm.swappiness to 10..."
sysctl -w vm.swappiness=10
if ! grep -q "^vm.swappiness" /etc/sysctl.conf 2>/dev/null; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi

echo "==> Done. Current memory/swap:"
free -h
