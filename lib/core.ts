import type { Macro } from './types';

/**
 * Accept one canonical hostname, never a URL, port, path, or query string.
 * Command lookup uses URL.hostname, so persisting anything else would create a
 * command that can never be reached from the toolbar popup.
 */
export function normalizeHostname(value: string): string | undefined {
  const hostname = value.trim().toLocaleLowerCase();
  if (!hostname || /[\s/?#\\@]/.test(hostname)) return undefined;
  try {
    const parsed = new URL(`https://${hostname}`);
    return parsed.hostname === hostname && hostname.includes('.') ? parsed.hostname : undefined;
  } catch {
    return undefined;
  }
}

export function normalizePhrase(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

export function matchMacro(heard: string, macros: Macro[]): Macro | undefined {
  const normalized = normalizePhrase(heard);
  return macros.find((macro) => normalizePhrase(macro.phrase) === normalized);
}

export function isDangerousElement(element: Element | null, macro: Macro): boolean {
  if (macro.kind === 'navigate' || macro.confirm) return true;
  if (!element) return false;
  const text = `${element.textContent ?? ''} ${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''}`.toLocaleLowerCase();
  const destructiveWords = /\b(delete|remove|erase|destroy|discard|purchase|pay|send|submit|publish|sign out|log out)\b/;
  const submitControl = element.matches('button[type="submit"], input[type="submit"]') || element.closest('form')?.querySelector('[type="submit"]') === element;
  const navigation = element.matches('a[href]');
  return destructiveWords.test(text) || submitControl || navigation;
}

export function safeSelector(value: string): boolean {
  if (!value.trim() || value.length > 300) return false;
  try {
    document.createDocumentFragment().querySelector(value);
    return true;
  } catch {
    return false;
  }
}

export function safeNavigationUrl(value: string, site: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname === site;
  } catch {
    return false;
  }
}
