import type { Macro, PageActionResponse } from './types';

/**
 * This whole function is passed to chrome.scripting.executeScript, so it must
 * remain self-contained. Browser tests inject this same production function.
 */
export function performPageAction(type: 'inspect' | 'execute', macro: Macro): PageActionResponse {
  const target = macro.selector ? (() => {
    try { return document.querySelector(macro.selector!); } catch { return null; }
  })() : null;
  let safeUrl: URL | undefined;
  if (macro.kind === 'navigate' && macro.url) {
    try {
      const candidate = new URL(macro.url);
      if (['http:', 'https:'].includes(candidate.protocol) && candidate.hostname === macro.site) safeUrl = candidate;
    } catch { /* Invalid URL is rejected below. */ }
  }
  if (macro.kind === 'navigate' && !safeUrl) return { ok: false, detail: 'Navigation must stay on the approved site.' };
  if (['click', 'focus'].includes(macro.kind) && !target) return { ok: false, detail: `Could not find “${macro.label}” on this page.` };
  const text = target ? `${target.textContent ?? ''} ${target.getAttribute('aria-label') ?? ''} ${target.getAttribute('title') ?? ''}`.toLocaleLowerCase() : '';
  const riskyWords = /\b(delete|remove|erase|destroy|discard|purchase|pay|send|submit|publish|sign out|log out)\b/;
  const riskyElement = Boolean(target && (riskyWords.test(text) || target.matches('button[type="submit"], input[type="submit"], a[href]')));
  const requiresConfirmation = macro.confirm || macro.kind === 'navigate' || riskyElement;
  const detail = macro.kind === 'navigate' && safeUrl ? `open ${safeUrl.pathname}` : macro.label;
  if (type === 'inspect') return { ok: true, requiresConfirmation, detail };
  if (macro.kind === 'navigate' && safeUrl) {
    location.assign(safeUrl.href);
    return { ok: true, detail };
  }
  if (macro.kind === 'scroll-top' || macro.kind === 'scroll-bottom') {
    window.scrollTo({
      top: macro.kind === 'scroll-top' ? 0 : document.documentElement.scrollHeight,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
    return { ok: true, detail };
  }
  const element = target as HTMLElement;
  element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (macro.kind === 'focus') element.focus(); else element.click();
  return { ok: true, detail };
}
