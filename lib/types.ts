export const ACTION_KINDS = ['click', 'focus', 'scroll-top', 'scroll-bottom', 'navigate'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

export type Macro = {
  id: string;
  site: string;
  phrase: string;
  label: string;
  kind: ActionKind;
  selector?: string;
  url?: string;
  confirm: boolean;
  createdAt: number;
};

export type CommandLog = {
  id: string;
  site: string;
  phrase: string;
  label?: string;
  result: 'ran' | 'cancelled' | 'not-found' | 'error';
  at: number;
};

export type LicenseCache = {
  token: string;
  valid: boolean;
  checkedAt: number;
  reason?: string;
};

export type StoredState = {
  macros: Macro[];
  logs: CommandLog[];
  license?: LicenseCache;
};

export type PageActionMessage =
  | { type: 'inspect'; macro: Macro }
  | { type: 'execute'; macro: Macro };

export type PageActionResponse = {
  ok: boolean;
  requiresConfirmation?: boolean;
  detail: string;
};
