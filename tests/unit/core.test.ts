import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchMacro, MAX_LOG_ENTRIES, normalizeHostname, normalizePhrase, safeNavigationUrl, withNewestEntry } from '../../lib/core';
import { BILLING_BASE, readLicenseVerdict } from '../../lib/billing';
import { commandLimit, FREE_COMMAND_LIMIT, PAID_COMMAND_LIMIT, shouldVerify } from '../../lib/license';
import { ACTION_KINDS, type Macro } from '../../lib/types';

const macro: Macro = {
  id: 'one', site: 'example.com', phrase: 'Focus search', label: 'Focus search',
  kind: 'focus', selector: '#search', confirm: false, createdAt: 1
};

describe('exact command grammar', () => {
  it('normalizes case, spacing, and trailing speech punctuation', () => {
    expect(normalizePhrase('  FOCUS   Search! ')).toBe('focus search');
    expect(matchMacro('focus search.', [macro])).toBe(macro);
  });

  it('does not guess a partial or similar command', () => {
    expect(matchMacro('focus the search', [macro])).toBeUndefined();
    expect(matchMacro('search', [macro])).toBeUndefined();
  });
});

describe('navigation boundary', () => {
  it('@claim:same-site-navigation allows only http(s) URLs on the approved hostname', () => {
    expect(safeNavigationUrl('https://example.com/issues', 'example.com')).toBe(true);
    expect(safeNavigationUrl('https://evil.example/issues', 'example.com')).toBe(false);
    expect(safeNavigationUrl('javascript:alert(1)', 'example.com')).toBe(false);
  });
});

describe('hostname command boundary', () => {
  it('persists only the canonical hostname the popup will derive from a tab URL', () => {
    expect(normalizeHostname('Example.COM')).toBe('example.com');
    expect(normalizeHostname('example.com:443')).toBeUndefined();
    expect(normalizeHostname('https://example.com')).toBeUndefined();
    expect(normalizeHostname('example.com/path?query=yes')).toBeUndefined();
  });
});

describe('command capacity contract', () => {
  it('@claim:command-capacity keeps ten actions free and adds paid capacity', () => {
    expect(FREE_COMMAND_LIMIT).toBe(10);
    expect(commandLimit()).toBe(FREE_COMMAND_LIMIT);
    expect(commandLimit({ token: 'valid-token', valid: true, checkedAt: 1 })).toBe(PAID_COMMAND_LIMIT);
    expect(PAID_COMMAND_LIMIT).toBeGreaterThan(FREE_COMMAND_LIMIT);
  });
});

describe('supported action contract', () => {
  it('@claim:supported-actions exposes the five documented bounded actions', () => {
    expect(ACTION_KINDS).toEqual(['click', 'focus', 'scroll-top', 'scroll-bottom', 'navigate']);
  });
});

describe('local log boundary', () => {
  it('@claim:log-limit keeps only the latest 100 results', () => {
    const existing = Array.from({ length: 100 }, (_, index) => `old-${index}`);
    const result = withNewestEntry(existing, 'new');
    expect(MAX_LOG_ENTRIES).toBe(100);
    expect(result).toHaveLength(100);
    expect(result[0]).toBe('new');
    expect(result).not.toContain('old-99');
  });
});

describe('billing response policy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the production gateway and honors a deterministic 429 Retry-After fixture', async () => {
    expect(BILLING_BASE).toBe('https://api.sociobot.in/api/v1');
    const response = new Response(null, { status: 429, headers: { 'Retry-After': '120' } });
    await expect(readLicenseVerdict(response)).rejects.toThrow('Too many license checks. Try again in 120 seconds.');
  });

  it('@claim:license-cache checks a saved license at most once per day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-30T12:00:00Z'));
    const now = Date.now();
    expect(shouldVerify({ token: 'fixture', valid: true, checkedAt: now })).toBe(false);
    expect(shouldVerify({ token: 'fixture', valid: true, checkedAt: now - 86_400_001 })).toBe(true);
    expect(shouldVerify()).toBe(false);
    vi.useRealTimers();
  });
});
