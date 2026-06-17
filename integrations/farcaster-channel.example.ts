/**
 * Farcaster / Hypersnap mention-channel sketch.
 *
 * This is intentionally not auto-loaded by Eve yet. Wire it as a real channel only after
 * signer custody, webhook verification, rate limits, and posting policy are decided.
 *
 * Env contract:
 * - FARCASTER_BOT_FID
 * - FARCASTER_BOT_USERNAME
 * - FARCASTER_SIGNER_UUID or Hypersnap-native signer material
 * - FARCASTER_WEBHOOK_SECRET
 * - SNAPCHAIN_HUB_URL (preferred native read path)
 * - COMPAT_FARCASTER_API_URL (temporary compatibility bridge, if used)
 */
export type MentionEvent = {
  text: string;
  authorFid: number;
  castHash?: string;
  parentUrl?: string;
};

export function shouldAnswer(event: MentionEvent): boolean {
  return /\b(ardea|hypersnap|snapchain|farcaster|\$snap|qns)\b/i.test(event.text);
}
