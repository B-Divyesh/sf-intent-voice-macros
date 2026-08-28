import { browser } from 'wxt/browser';
import { matchMacro } from '../../lib/core';
import { addLog, getState } from '../../lib/storage';
import { commandLimit } from '../../lib/license';
import type { Macro, PageActionResponse } from '../../lib/types';
import './style.css';

type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEvent = Event & { results: ArrayLike<RecognitionResult> };
type RecognitionInstance = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => RecognitionInstance;

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const listen = $('#listen') as HTMLButtonElement;
const listenLabel = $('#listen-label');
const phraseInput = $('#phrase') as HTMLInputElement;
const status = $('#status');
const commands = $('#commands');
const empty = $('#empty') as HTMLElement;
const siteBadge = $('#site-badge');
const count = $('#count');
const dialog = $('#confirm-dialog') as HTMLDialogElement;
const confirmCopy = $('#confirm-copy');
let site = '';
let siteMacros: Macro[] = [];
let activeTabId: number | undefined;
let recognition: RecognitionInstance | undefined;
let isListening = false;
let pendingMacro: Macro | undefined;

function setStatus(message: string, tone: 'normal' | 'error' | 'success' = 'normal') {
  status.textContent = message;
  status.className = `status ${tone}`;
}

function updateListening(next: boolean) {
  isListening = next;
  listen.setAttribute('aria-pressed', String(next));
  listen.classList.toggle('is-listening', next);
  listenLabel.textContent = next ? 'Listening—press to stop' : 'Press to talk';
}

async function sendToPage(type: 'inspect' | 'execute', macro: Macro): Promise<PageActionResponse> {
  if (!activeTabId) throw new Error('Open a regular webpage to run a command.');
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId: activeTabId },
      func: performPageAction,
      args: [type, macro]
    });
    if (!injection?.result) throw new Error('The page did not return an action result.');
    return injection.result;
  } catch {
    throw new Error('This page does not allow extensions. Try the command on a regular website.');
  }
}

function performPageAction(type: 'inspect' | 'execute', macro: Macro): PageActionResponse {
  const target = macro.selector ? (() => { try { return document.querySelector(macro.selector!); } catch { return null; } })() : null;
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
  if (macro.kind === 'navigate' && safeUrl) { location.assign(safeUrl.href); return { ok: true, detail }; }
  if (macro.kind === 'scroll-top' || macro.kind === 'scroll-bottom') {
    window.scrollTo({ top: macro.kind === 'scroll-top' ? 0 : document.documentElement.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    return { ok: true, detail };
  }
  const element = target as HTMLElement;
  element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (macro.kind === 'focus') element.focus(); else element.click();
  return { ok: true, detail };
}

async function execute(macro: Macro) {
  const result = await sendToPage('execute', macro);
  if (!result.ok) throw new Error(result.detail);
  await addLog({ site, phrase: macro.phrase, label: macro.label, result: 'ran' });
  setStatus(`Done: ${result.detail}.`, 'success');
}

async function handlePhrase(raw: string) {
  const macro = matchMacro(raw, siteMacros);
  if (!macro) {
    await addLog({ site, phrase: raw, result: 'not-found' });
    setStatus(`No exact match for “${raw}”. Choose an allowed phrase below.`, 'error');
    return;
  }
  phraseInput.value = macro.phrase;
  try {
    const inspection = await sendToPage('inspect', macro);
    if (!inspection.ok) throw new Error(inspection.detail);
    if (inspection.requiresConfirmation) {
      pendingMacro = macro;
      confirmCopy.textContent = `“${macro.phrase}” will ${inspection.detail} on ${site}.`;
      dialog.showModal();
      ($('#cancel-action') as HTMLButtonElement).focus();
      setStatus('Waiting for your confirmation.');
      return;
    }
    await execute(macro);
  } catch (error) {
    await addLog({ site, phrase: raw, label: macro.label, result: 'error' });
    setStatus(error instanceof Error ? error.message : 'The action could not run.', 'error');
  }
}

function setupRecognition() {
  const SpeechRecognition = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    listen.disabled = true;
    listenLabel.textContent = 'Voice unavailable';
    setStatus('This browser does not offer speech recognition here. Type a phrase instead.', 'error');
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  if ('processLocally' in recognition) recognition.processLocally = true;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (transcript) {
      phraseInput.value = transcript;
      setStatus(`Heard: “${transcript}”. Checking your allowed phrases…`);
      void handlePhrase(transcript);
    }
  };
  recognition.onerror = (event) => {
    const detail = event.error === 'not-allowed' ? 'Microphone access was not allowed. You can type the phrase instead.' : 'I could not hear a command. Try again or type it.';
    setStatus(detail, 'error');
    updateListening(false);
  };
  recognition.onend = () => updateListening(false);
}

function render() {
  commands.replaceChildren(...siteMacros.map((macro) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'command-item';
    button.innerHTML = `<span class="phrase"></span><span class="action-label"></span>`;
    button.querySelector('.phrase')!.textContent = `“${macro.phrase}”`;
    button.querySelector('.action-label')!.textContent = macro.label;
    button.addEventListener('click', () => void handlePhrase(macro.phrase));
    item.append(button);
    return item;
  }));
  empty.hidden = siteMacros.length > 0;
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  try { site = tab?.url ? new URL(tab.url).hostname : ''; } catch { site = ''; }
  siteBadge.textContent = site || 'Unavailable page';
  const state = await getState();
  siteMacros = state.macros.filter((macro) => macro.site === site);
  count.textContent = `${siteMacros.length} / ${commandLimit(state.license)}`;
  render();
  setupRecognition();
  ($('#offline') as HTMLElement).hidden = navigator.onLine;
  if (!site) {
    listen.disabled = true;
    phraseInput.disabled = true;
    setStatus('Open a regular website, then reopen Say the Action.', 'error');
  }
}

listen.addEventListener('click', () => {
  if (!recognition) return;
  if (isListening) {
    recognition.stop();
    updateListening(false);
    setStatus('Stopped listening.');
  } else {
    try {
      recognition.start();
      updateListening(true);
      setStatus('Listening for one approved phrase…');
    } catch {
      setStatus('The microphone is already starting. Try again in a moment.', 'error');
    }
  }
});

$('#command-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const phrase = phraseInput.value.trim();
  if (phrase) void handlePhrase(phrase);
});

dialog.addEventListener('close', () => {
  if (!pendingMacro) return;
  const macro = pendingMacro;
  pendingMacro = undefined;
  if (dialog.returnValue === 'confirm') void execute(macro).catch((error) => setStatus(error.message, 'error'));
  else {
    void addLog({ site, phrase: macro.phrase, label: macro.label, result: 'cancelled' });
    setStatus('Cancelled. Nothing happened.');
  }
});

$('#manage').addEventListener('click', () => void browser.runtime.openOptionsPage());
addEventListener('online', () => { ($('#offline') as HTMLElement).hidden = true; });
addEventListener('offline', () => { ($('#offline') as HTMLElement).hidden = false; });
void init();
