import { browser } from 'wxt/browser';
import { normalizePhrase, safeNavigationUrl } from '../../lib/core';
import { ACTION_KINDS, type ActionKind, type Macro } from '../../lib/types';
import { clearLogs, getState, setLicense, setMacros } from '../../lib/storage';
import { canUsePaid, CHECKOUT_URL, shouldVerify, verifyLicense } from '../../lib/license';
import './style.css';

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const form = $('#macro-form') as HTMLFormElement;
const kind = $('#kind') as HTMLSelectElement;
const siteInput = $('#site') as HTMLInputElement;
const status = $('#status');
const groups = $('#macro-groups');
const empty = $('#empty') as HTMLElement;
const dialog = $('#delete-dialog') as HTMLDialogElement;
let state = await getState();
let pendingDelete: Macro | undefined;

function announce(message: string, error = false) {
  status.textContent = message;
  status.className = error ? 'status error' : 'status';
}

function limit(): number { return canUsePaid(state.license) ? 10 : 5; }

function updateFields() {
  const needsSelector = ['click', 'focus'].includes(kind.value);
  ($('#selector-field') as HTMLElement).hidden = !needsSelector;
  ($('#selector') as HTMLInputElement).required = needsSelector;
  ($('#url-field') as HTMLElement).hidden = kind.value !== 'navigate';
  ($('#url') as HTMLInputElement).required = kind.value === 'navigate';
}

function renderMacros() {
  const bySite = new Map<string, Macro[]>();
  for (const macro of state.macros) bySite.set(macro.site, [...(bySite.get(macro.site) ?? []), macro]);
  groups.replaceChildren(...[...bySite.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([site, macros]) => {
    const section = document.createElement('section');
    section.className = 'site-group';
    const heading = document.createElement('div');
    heading.className = 'site-heading';
    const h3 = document.createElement('h3');
    h3.textContent = site;
    const badge = document.createElement('span');
    badge.textContent = `${macros.length} / ${limit()}`;
    heading.append(h3, badge);
    const list = document.createElement('ul');
    list.className = 'macro-list';
    for (const macro of macros) {
      const li = document.createElement('li');
      li.className = 'macro-card';
      const copy = document.createElement('div');
      const phrase = document.createElement('strong');
      phrase.textContent = `“${macro.phrase}”`;
      const detail = document.createElement('span');
      detail.textContent = `${macro.label} · ${macro.kind}${macro.confirm ? ' · asks first' : ''}`;
      copy.append(phrase, detail);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete command ${macro.phrase}`);
      remove.addEventListener('click', () => {
        pendingDelete = macro;
        $('#delete-copy').textContent = `“${macro.phrase}” will no longer be allowed on ${macro.site}.`;
        dialog.showModal();
        (dialog.querySelector('[value="cancel"]') as HTMLButtonElement).focus();
      });
      li.append(copy, remove);
      list.append(li);
    }
    section.append(heading, list);
    return section;
  }));
  empty.hidden = state.macros.length > 0;
  $('#limit-copy').textContent = `${canUsePaid(state.license) ? 'Unlocked' : 'Free plan'}: ${limit()} per website`;
}

function renderLogs() {
  const list = $('#logs');
  list.replaceChildren(...state.logs.slice(0, 20).map((log) => {
    const item = document.createElement('li');
    const time = document.createElement('time');
    time.dateTime = new Date(log.at).toISOString();
    time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(log.at);
    const text = document.createElement('span');
    text.textContent = `${log.phrase || 'Empty phrase'} · ${log.result} · ${log.site || 'unknown site'}`;
    item.append(text, time);
    return item;
  }));
  ($('#logs-empty') as HTMLElement).hidden = state.logs.length > 0;
}

function renderLicense() {
  const unlocked = canUsePaid(state.license);
  $('#license-state').innerHTML = unlocked
    ? '<strong>Unlocked: 10 commands per website.</strong>'
    : state.license?.reason
      ? `<strong>License no longer active.</strong> <span>${state.license.reason.replaceAll('_', ' ')}.</span>`
      : '<strong>Free plan active.</strong>';
  ($('#buy') as HTMLAnchorElement).href = CHECKOUT_URL;
  ($('#buy') as HTMLElement).hidden = unlocked;
}

async function refresh() {
  state = await getState();
  renderMacros();
  renderLogs();
  renderLicense();
}

async function suggestSite() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('http')) siteInput.value = new URL(tab.url).hostname;
  } catch { /* Manual entry remains available. */ }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const site = String(data.get('site')).trim().toLocaleLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  const phrase = normalizePhrase(String(data.get('phrase')));
  const actionKind = String(data.get('kind')) as ActionKind;
  const selector = String(data.get('selector') ?? '').trim();
  const url = String(data.get('url') ?? '').trim();
  if (!site || site.includes(' ') || !site.includes('.')) return announce('Enter a hostname such as example.com.', true);
  if (!phrase) return announce('Enter the exact phrase you want to say.', true);
  if (!ACTION_KINDS.includes(actionKind)) return announce('Choose a supported browser action.', true);
  if (['click', 'focus'].includes(actionKind)) {
    try { document.querySelector(selector); } catch { return announce('That CSS selector is not valid. Copy a selector such as #search or button.save.', true); }
    if (!selector) return announce('This action needs a CSS selector.', true);
  }
  if (actionKind === 'navigate' && !safeNavigationUrl(url, site)) return announce('Navigation URLs must use HTTPS or HTTP and stay on the same hostname.', true);
  const existing = state.macros.filter((macro) => macro.site === site);
  if (existing.length >= limit()) return announce(`This website already has ${limit()} commands. Delete one${limit() === 5 ? ' or unlock more room' : ''}.`, true);
  if (existing.some((macro) => normalizePhrase(macro.phrase) === phrase)) return announce('That phrase is already in use on this website.', true);
  const macro: Macro = {
    id: crypto.randomUUID(), site, phrase,
    label: String(data.get('label')).trim(),
    kind: actionKind, selector: selector || undefined, url: url || undefined,
    confirm: data.get('confirm') === 'on' || actionKind === 'navigate',
    createdAt: Date.now()
  };
  await setMacros([...state.macros, macro]);
  form.reset();
  siteInput.value = site;
  ($('#confirm') as HTMLInputElement).checked = true;
  updateFields();
  await refresh();
  announce(`Added “${macro.phrase}” for ${site}.`);
});

kind.addEventListener('change', updateFields);
dialog.addEventListener('close', async () => {
  if (dialog.returnValue !== 'confirm' || !pendingDelete) { pendingDelete = undefined; return; }
  const deleted = pendingDelete;
  pendingDelete = undefined;
  await setMacros(state.macros.filter((macro) => macro.id !== deleted.id));
  await refresh();
  announce(`Deleted “${deleted.phrase}”.`);
});

$('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), macros: state.macros, logs: state.logs }, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `say-the-action-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  announce('Exported your commands and local activity log.');
});

$('#clear-logs').addEventListener('click', async () => {
  await clearLogs();
  await refresh();
  announce('Cleared the local activity log.');
});

$('#license-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = ($('#license-token') as HTMLInputElement).value.trim();
  if (!token) return announce('Paste your license token first.', true);
  announce('Checking the license…');
  try {
    await setLicense(await verifyLicense(token));
    await refresh();
    announce(canUsePaid(state.license) ? 'License verified. Ten commands per website are unlocked.' : 'That license is not active. Check the token or buy a new license.', !canUsePaid(state.license));
  } catch (error) { announce(error instanceof Error ? error.message : 'Could not check the license.', true); }
});

addEventListener('online', () => { ($('#offline') as HTMLElement).hidden = true; });
addEventListener('offline', () => { ($('#offline') as HTMLElement).hidden = false; });
($('#offline') as HTMLElement).hidden = navigator.onLine;
updateFields();
await suggestSite();
await refresh();
if (shouldVerify(state.license) && navigator.onLine && state.license) {
  try { await setLicense(await verifyLicense(state.license.token)); await refresh(); } catch { /* Cached verdict preserves first paint. */ }
}
