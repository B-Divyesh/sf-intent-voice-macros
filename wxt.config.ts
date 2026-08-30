import { defineConfig } from 'wxt';

const actionHarness = process.env.WXT_ACTION_HARNESS === '1';

export default defineConfig({
  srcDir: '.',
  outDir: actionHarness ? '.output-test' : '.output',
  manifest: {
    name: 'Say the Action',
    short_name: 'Say Action',
    description: 'Run approved browser actions by voice or typing with exact phrases and safety confirmations.',
    version: '1.0.1',
    permissions: ['storage', 'activeTab', 'scripting'],
    ...(actionHarness ? { host_permissions: ['http://127.0.0.1/*'] } : {}),
    action: { default_title: 'Say the Action' },
    commands: {
      _execute_action: {
        suggested_key: { default: 'Ctrl+Shift+U', mac: 'Command+Shift+U' }
      }
    }
  },
  zip: { name: 'say-the-action' }
});
