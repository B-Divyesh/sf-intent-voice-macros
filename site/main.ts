import { BILLING_BASE, PRODUCT_SLUG, readLicenseVerdict } from '../lib/billing';
import './style.css';

const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const CACHE_KEY = `${LICENSE_KEY}:verdict`;
const DEMO_KEY = `demo:${PRODUCT_SLUG}:workspace`;
const DAY = 86_400_000;
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const isDemo = new URL(location.href).searchParams.get('demo') === '1';

type RecognitionResult = { 0: { transcript: string } };
type RecognitionEvent = Event & { results: ArrayLike<RecognitionResult> };
type Recognition = EventTarget & { lang: string; continuous: boolean; interimResults: boolean; processLocally?: boolean; start(): void; stop(): void; onresult: ((event: RecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionCtor = new () => Recognition;
type SampleCommand = { phrase: string; label: string; kind: 'focus' | 'scroll' | 'delete' };
type DemoLog = { phrase: string; result: 'ran' | 'cancelled' | 'not-found' };
type DemoState = { commands: SampleCommand[]; logs: DemoLog[]; draftPresent: boolean };

const sampleCommands: SampleCommand[] = [
  { phrase: 'focus ticket search', label: 'Focus the ticket search field', kind: 'focus' },
  { phrase: 'scroll to activity', label: 'Show recent demo activity', kind: 'scroll' },
  { phrase: 'delete draft reply', label: 'Delete the sample draft reply', kind: 'delete' }
];

function freshDemo(): DemoState {
  return {
    commands: sampleCommands,
    logs: [
      { phrase: 'focus ticket search', result: 'ran' },
      { phrase: 'delete draft reply', result: 'cancelled' }
    ],
    draftPresent: true
  };
}

function readDemo(): DemoState {
  if (!isDemo) return freshDemo();
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_KEY) ?? 'null') as Partial<DemoState> | null;
    if (saved && Array.isArray(saved.commands) && Array.isArray(saved.logs) && typeof saved.draftPresent === 'boolean') {
      return saved as DemoState;
    }
  } catch { /* Replace unreadable demo data with the sample. */ }
  const state = freshDemo();
  localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  return state;
}

let demoState = readDemo();
let pendingCommand: SampleCommand | undefined;

function saveDemo() {
  if (isDemo) localStorage.setItem(DEMO_KEY, JSON.stringify(demoState));
}

function normalizePhrase(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

function renderDemo() {
  const list = $('#sample-commands');
  list.replaceChildren(...demoState.commands.map((command) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '<strong></strong><span></span>';
    button.querySelector('strong')!.textContent = `“${command.phrase}”`;
    button.querySelector('span')!.textContent = command.label;
    button.addEventListener('click', () => {
      ($('#demo-input') as HTMLInputElement).value = command.phrase;
      runPhrase(command.phrase);
    });
    item.append(button);
    return item;
  }));
  const log = $('#demo-log');
  log.replaceChildren(...demoState.logs.slice(0, 5).map((entry) => {
    const item = document.createElement('li');
    item.textContent = `“${entry.phrase}” — ${entry.result}`;
    return item;
  }));
  ($('#sample-draft') as HTMLElement).hidden = !demoState.draftPresent;
}

function addDemoLog(phrase: string, result: DemoLog['result']) {
  demoState.logs = [{ phrase, result }, ...demoState.logs].slice(0, 100);
  saveDemo();
  renderDemo();
}

const heard = $('#heard');
const matched = $('#matched');
const allowed = $('#allowed');
const demoStatus = $('#demo-status');
const actionDialog = $('#action-dialog') as HTMLDialogElement;

function setFlow(phrase: string, matchedText: string, actionText: string, active: boolean) {
  heard.textContent = phrase || '—';
  matched.textContent = matchedText;
  allowed.textContent = actionText;
  matched.closest('div')?.classList.toggle('active', active);
  allowed.closest('div')?.classList.toggle('active', active);
}

function executeSample(command: SampleCommand) {
  if (command.kind === 'focus') {
    ($('#sample-search') as HTMLInputElement).focus();
  } else if (command.kind === 'scroll') {
    $('#demo-log').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  } else {
    ($('#sample-delete') as HTMLButtonElement).click();
  }
  addDemoLog(command.phrase, 'ran');
  setFlow(command.phrase, 'Exact phrase', command.label, true);
  demoStatus.textContent = `Done: ${command.label}.`;
}

function runPhrase(raw: string) {
  const phrase = normalizePhrase(raw);
  const command = demoState.commands.find((item) => item.phrase === phrase);
  if (!command) {
    addDemoLog(phrase || 'empty phrase', 'not-found');
    setFlow(phrase, 'No match', 'Nothing ran', false);
    demoStatus.textContent = 'No approved phrase matched. Nothing ran.';
    return;
  }
  if (command.kind === 'delete') {
    pendingCommand = command;
    setFlow(phrase, 'Exact phrase', 'Waiting for confirmation', true);
    $('#action-dialog-copy').textContent = `“${command.phrase}” will delete the sample draft on support.example.`;
    actionDialog.showModal();
    ($('#cancel-sample-action') as HTMLButtonElement).focus();
    demoStatus.textContent = 'Waiting for your confirmation.';
    return;
  }
  executeSample(command);
}

$('#sample-delete').addEventListener('click', () => {
  demoState.draftPresent = false;
  saveDemo();
  renderDemo();
});

$('#demo-form').addEventListener('submit', (event) => {
  event.preventDefault();
  runPhrase(($('#demo-input') as HTMLInputElement).value);
});

actionDialog.addEventListener('close', () => {
  if (!pendingCommand) return;
  const command = pendingCommand;
  pendingCommand = undefined;
  if (actionDialog.returnValue === 'confirm') executeSample(command);
  else {
    addDemoLog(command.phrase, 'cancelled');
    setFlow(command.phrase, 'Exact phrase', 'Cancelled', true);
    demoStatus.textContent = 'Cancelled. The sample draft is still here.';
  }
});

if (isDemo) {
  document.body.classList.add('is-demo');
  ($('#demo-banner') as HTMLElement).hidden = false;
  document.title = 'Demo — Say the Action';
  ($('#canonical') as HTMLLinkElement).href = 'https://intent-voice-macros.sociobot.in/?demo=1';
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    ($(selector) as HTMLMetaElement).content = 'Demo — Say the Action';
  }
  ($('meta[property="og:url"]') as HTMLMetaElement).content = 'https://intent-voice-macros.sociobot.in/?demo=1';
}

$('#reset-demo').addEventListener('click', () => {
  localStorage.removeItem(DEMO_KEY);
  demoState = freshDemo();
  saveDemo();
  renderDemo();
  setFlow('', 'Waiting', 'Nothing ran', false);
  demoStatus.textContent = 'Demo reset to three sample commands.';
  ($('#demo-input') as HTMLInputElement).value = 'focus ticket search';
  ($('#demo-input') as HTMLInputElement).focus();
});

$('#start-real').addEventListener('click', () => localStorage.removeItem(DEMO_KEY));

async function verify(token: string) {
  const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  const body = await readLicenseVerdict(response);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...body, checkedAt: Date.now() }));
  $('#license-status').textContent = body.valid
    ? 'License verified. Paste this token in the extension settings for 25 commands per site.'
    : `License not active: ${(body.reason ?? 'invalid').replaceAll('_', ' ')}.`;
}

const currentUrl = new URL(location.href);
const licenseFromUrl = currentUrl.searchParams.get('license');
if (licenseFromUrl) {
  if (!isDemo) localStorage.setItem(LICENSE_KEY, licenseFromUrl);
  currentUrl.searchParams.delete('license');
  history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
}

if (!isDemo) {
  const token = localStorage.getItem(LICENSE_KEY);
  if (token) {
    ($('#license') as HTMLInputElement).value = token;
    let cache: { valid?: boolean; checkedAt?: number } = {};
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as typeof cache; } catch { /* Verify below. */ }
    if (cache.valid) $('#license-status').textContent = 'Saved license found. Paste it in the extension settings for 25 commands per site.';
    if (!cache.checkedAt || Date.now() - cache.checkedAt > DAY) {
      void verify(token).catch((error) => { $('#license-status').textContent = error instanceof Error ? error.message : 'License verification is unavailable.'; });
    }
  }
}

$('#restore-button').addEventListener('click', () => {
  const form = $('#restore-form') as HTMLFormElement;
  form.hidden = false;
  ($('#license') as HTMLInputElement).focus();
});

$('#restore-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = ($('#license') as HTMLInputElement).value.trim();
  if (!value) { $('#license-status').textContent = 'Paste your license token first.'; return; }
  if (isDemo) {
    $('#license-status').textContent = 'Leave the demo before restoring a real license.';
    return;
  }
  localStorage.setItem(LICENSE_KEY, value);
  $('#license-status').textContent = 'Checking license…';
  void verify(value).catch((error) => { $('#license-status').textContent = error instanceof Error ? error.message : 'License verification is unavailable.'; });
});

const RecognitionClass = (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;
const listen = $('#demo-listen') as HTMLButtonElement;
let recognition: Recognition | undefined;
let listening = false;
function setListening(value: boolean) {
  listening = value;
  listen.setAttribute('aria-pressed', String(value));
  listen.classList.toggle('listening', value);
  listen.querySelector('span:last-child')!.textContent = value ? 'Listening—press to stop' : 'Press to talk';
}
if (RecognitionClass) {
  recognition = new RecognitionClass();
  recognition.lang = navigator.language;
  recognition.continuous = false;
  recognition.interimResults = false;
  if ('processLocally' in recognition) recognition.processLocally = true;
  recognition.onresult = (event) => {
    const phrase = event.results[0]?.[0]?.transcript ?? '';
    ($('#demo-input') as HTMLInputElement).value = phrase;
    runPhrase(phrase);
  };
  recognition.onerror = () => {
    demoStatus.textContent = 'Voice recognition was unavailable. Type the phrase instead.';
    setListening(false);
  };
  recognition.onend = () => setListening(false);
}
listen.addEventListener('click', () => {
  if (!recognition) {
    demoStatus.textContent = 'Voice recognition is unavailable here. Type the phrase instead.';
    ($('#demo-input') as HTMLInputElement).focus();
    return;
  }
  if (listening) {
    recognition.stop();
    setListening(false);
  } else {
    try {
      recognition.start();
      setListening(true);
      demoStatus.textContent = 'Listening for one approved phrase…';
    } catch { demoStatus.textContent = 'The microphone is already starting.'; }
  }
});

const offline = $('#offline') as HTMLElement;
const updateOnline = () => { offline.hidden = navigator.onLine; };
addEventListener('online', updateOnline);
addEventListener('offline', updateOnline);
updateOnline();
renderDemo();

const canUseServiceWorker = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && canUseServiceWorker) void navigator.serviceWorker.register('/sw.js');
