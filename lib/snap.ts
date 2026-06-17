export const SNAP_TOTAL_SUPPLY = 200_000_000_000;
export const SNAP_RETRO_REWARDS = 200_000_000;
export const SNAP_PHASE_ONE_OPENED = 33_000_000;
export const SNAP_TOKEN_ADDRESS = "0x49B5a631F54927c0007232844f06FE18cbf69786";
export const SNAP_PAIR_ADDRESS = "0x72a70a747a8390caf1aad3fb1de3564b55871f137539e498d30f02b1167742ea";

export function correctedFdv(priceUsd: number): number {
  return priceUsd * SNAP_TOTAL_SUPPLY;
}
