import type { LicenseCache } from './types';
import { BILLING_BASE, CHECKOUT_URL, PRODUCT_SLUG, readLicenseVerdict } from './billing';

export { CHECKOUT_URL, PRODUCT_SLUG };
export const FREE_COMMAND_LIMIT = 10;
export const PAID_COMMAND_LIMIT = 25;
const ONE_DAY = 86_400_000;

export function canUsePaid(cache?: LicenseCache): boolean {
  return Boolean(cache?.token && cache.valid);
}

/** The brief's smallest useful product is available without a purchase. */
export function commandLimit(cache?: LicenseCache): number {
  return canUsePaid(cache) ? PAID_COMMAND_LIMIT : FREE_COMMAND_LIMIT;
}

export async function verifyLicense(token: string): Promise<LicenseCache> {
  const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  const result = await readLicenseVerdict(response);
  return { token, valid: result.valid, reason: result.reason, checkedAt: Date.now() };
}

export function shouldVerify(cache?: LicenseCache): boolean {
  return Boolean(cache?.token) && (!cache?.checkedAt || Date.now() - cache.checkedAt > ONE_DAY);
}
