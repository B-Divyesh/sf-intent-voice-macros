export const PRODUCT_SLUG = 'intent-voice-macros';
export const BILLING_BASE = 'https://api.sociobot.in/api/v1';
export const CHECKOUT_URL = `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;

export type LicenseVerdict = {
  valid: boolean;
  reason?: string;
  expires_at?: string | null;
};

function retryDelay(response: Response): string {
  const raw = response.headers.get('retry-after');
  if (!raw) return 'a moment';
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) return `${Math.ceil(seconds)} seconds`;
  const date = Date.parse(raw);
  if (Number.isFinite(date)) {
    return `${Math.max(1, Math.ceil((date - Date.now()) / 1_000))} seconds`;
  }
  return 'a moment';
}

/** Parse the documented billing response without treating an outage as an invalid license. */
export async function readLicenseVerdict(response: Response): Promise<LicenseVerdict> {
  if (response.status === 429) {
    throw new Error(`Too many license checks. Try again in ${retryDelay(response)}.`);
  }
  if (!response.ok) {
    throw new Error('License verification is unavailable. Your saved setup is unchanged.');
  }
  const body = await response.json() as Partial<LicenseVerdict>;
  if (typeof body.valid !== 'boolean') {
    throw new Error('The license service returned an unreadable response. Your saved setup is unchanged.');
  }
  return body as LicenseVerdict;
}
