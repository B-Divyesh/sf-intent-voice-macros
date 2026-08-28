import { describe, expect, it } from 'vitest';
import { matchMacro, normalizeHostname, normalizePhrase, safeNavigationUrl } from '../../lib/core';
import { commandLimit, FREE_COMMAND_LIMIT, PAID_COMMAND_LIMIT } from '../../lib/license';
import type { Macro } from '../../lib/types';

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
  it('allows only http(s) URLs on the approved hostname', () => {
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
  it('keeps the brief’s ten-action useful baseline free and adds paid capacity', () => {
    expect(FREE_COMMAND_LIMIT).toBe(10);
    expect(commandLimit()).toBe(FREE_COMMAND_LIMIT);
    expect(commandLimit({ token: 'valid-token', valid: true, checkedAt: 1 })).toBe(PAID_COMMAND_LIMIT);
    expect(PAID_COMMAND_LIMIT).toBeGreaterThan(FREE_COMMAND_LIMIT);
  });
});
