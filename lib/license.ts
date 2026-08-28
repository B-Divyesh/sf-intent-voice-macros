import type { LicenseCache } from './types';

export const PRODUCT_SLUG = 'intent-voice-macros';
export const BILLING_BASE = 'https://pilot-api.sociobot.in/api/v1';
export const CHECKOUT_URL = `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
const ONE_DAY = 86_400_000;

export function canUsePaid(cache?: LicenseCache): boolean {
  return Boolean(cache?.token && cache.valid);
}

export async function verifyLicense(token: string): Promise<LicenseCache> {
  const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('The license service did not respond. Your saved setup is unchanged.');
  const result = await response.json() as { valid: boolean; reason?: string };
  return { token, valid: result.valid, reason: result.reason, checkedAt: Date.now() };
}

export function shouldVerify(cache?: LicenseCache): boolean {
  return Boolean(cache?.token) && (!cache?.checkedAt || Date.now() - cache.checkedAt > ONE_DAY);
}
