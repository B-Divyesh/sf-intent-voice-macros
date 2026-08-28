import { describe, expect, it } from 'vitest';
import { matchMacro, normalizePhrase, safeNavigationUrl } from '../../lib/core';
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
