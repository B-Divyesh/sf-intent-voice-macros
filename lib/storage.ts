import { browser } from 'wxt/browser';
import type { CommandLog, LicenseCache, Macro, StoredState } from './types';
import { withNewestEntry } from './core';

const DEFAULT_STATE: StoredState = { macros: [], logs: [] };

export async function getState(): Promise<StoredState> {
  const stored = await browser.storage.local.get(DEFAULT_STATE);
  return {
    macros: Array.isArray(stored.macros) ? stored.macros as Macro[] : [],
    logs: Array.isArray(stored.logs) ? stored.logs as CommandLog[] : [],
    license: stored.license as LicenseCache | undefined
  };
}

export async function setMacros(macros: Macro[]): Promise<void> {
  await browser.storage.local.set({ macros });
}

export async function addLog(entry: Omit<CommandLog, 'id' | 'at'>): Promise<void> {
  const { logs } = await getState();
  const next: CommandLog = { ...entry, id: crypto.randomUUID(), at: Date.now() };
  await browser.storage.local.set({ logs: withNewestEntry(logs, next) });
}

export async function clearLogs(): Promise<void> {
  await browser.storage.local.set({ logs: [] });
}

export async function setLicense(license?: LicenseCache): Promise<void> {
  await browser.storage.local.set({ license });
}
