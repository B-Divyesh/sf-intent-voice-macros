import './style.css';

const PRODUCT = 'intent-voice-macros';
const BILLING_BASE = 'https://pilot-api.sociobot.in/api/v1';
const KEY = `sb_license:${PRODUCT}`;
const CACHE_KEY = `${KEY}:verdict`;
const DAY = 86_400_000;
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

type RecognitionResult = { 0: { transcript: string } };
type RecognitionEvent = Event & { results: ArrayLike<RecognitionResult> };
type Recognition = EventTarget & { lang: string; continuous: boolean; interimResults: boolean; processLocally?: boolean; start(): void; stop(): void; onresult: ((event: RecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionCtor = new () => Recognition;

const licenseFromUrl = new URL(location.href).searchParams.get('license');
if (licenseFromUrl) {
  localStorage.setItem(KEY, licenseFromUrl);
  const url = new URL(location.href);
  url.searchParams.delete('license');
  history.replaceState({}, '', url);
}

async function verify(token: string) {
  const result = await fetch(`${BILLING_BASE}/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
  if (!result.ok) throw new Error('License verification is unavailable. Try again when online.');
  const body = await result.json() as { valid: boolean; reason?: string };
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...body, checkedAt: Date.now() }));
  const message = body.valid ? 'License verified. Paste this same token in the extension settings to unlock 10 commands per site.' : `License not active: ${(body.reason ?? 'invalid').replaceAll('_', ' ')}.`;
  $('#license-status').textContent = message;
}

const token = localStorage.getItem(KEY);
if (token) {
  ($('#license') as HTMLInputElement).value = token;
  let cache: { valid?: boolean; checkedAt?: number } = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}'); } catch { /* Verify below. */ }
  if (cache.valid) $('#license-status').textContent = 'Saved license found. Paste it in the extension settings to unlock 10 commands per site.';
  if (!cache.checkedAt || Date.now() - cache.checkedAt > DAY) void verify(token).catch((error) => { $('#license-status').textContent = error.message; });
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
  localStorage.setItem(KEY, value);
  $('#license-status').textContent = 'Checking license…';
  void verify(value).catch((error) => { $('#license-status').textContent = error.message; });
});

const demoInput = $('#demo-input') as HTMLInputElement;
const heard = $('#heard');
const matched = $('#matched');
const allowed = $('#allowed');
const demoStatus = $('#demo-status');

function checkDemo(phrase: string) {
  heard.textContent = phrase || '—';
  const exact = phrase.trim().toLocaleLowerCase().replace(/[.!?]+$/, '') === 'focus search';
  matched.textContent = exact ? 'Exact phrase' : 'No match';
  allowed.textContent = exact ? 'Focus #search' : 'Nothing ran';
  matched.closest('div')?.classList.toggle('active', exact);
  allowed.closest('div')?.classList.toggle('active', exact);
  demoStatus.textContent = exact ? 'Matched “focus search”. In the extension, the approved search field would receive focus.' : 'No approved phrase matched. Nothing ran.';
}

$('#demo-form').addEventListener('submit', (event) => { event.preventDefault(); checkDemo(demoInput.value); });

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
  recognition.onresult = (event) => { const phrase = event.results[0]?.[0]?.transcript ?? ''; demoInput.value = phrase; checkDemo(phrase); };
  recognition.onerror = () => { demoStatus.textContent = 'Voice recognition was unavailable. Type the phrase instead.'; setListening(false); };
  recognition.onend = () => setListening(false);
} else {
  listen.title = 'Voice recognition is unavailable in this browser; typed preview still works.';
}
listen.addEventListener('click', () => {
  if (!recognition) { demoStatus.textContent = 'This browser does not provide speech recognition here. Type the phrase instead.'; demoInput.focus(); return; }
  if (listening) { recognition.stop(); setListening(false); }
  else { try { recognition.start(); setListening(true); demoStatus.textContent = 'Listening for one phrase…'; } catch { demoStatus.textContent = 'The microphone is already starting.'; } }
});

const offline = $('#offline') as HTMLElement;
const updateOnline = () => { offline.hidden = navigator.onLine; };
addEventListener('online', updateOnline);
addEventListener('offline', updateOnline);
updateOnline();
if ('serviceWorker' in navigator && location.protocol === 'https:') void navigator.serviceWorker.register('/sw.js');
