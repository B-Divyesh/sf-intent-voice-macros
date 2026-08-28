import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: '.output',
  manifest: {
    name: 'Say the Action',
    short_name: 'Say Action',
    description: 'A small, local-first voice command layer for approved browser actions.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    action: { default_title: 'Say the Action' },
    commands: {
      _execute_action: {
        suggested_key: { default: 'Ctrl+Shift+U', mac: 'Command+Shift+U' }
      }
    }
  },
  zip: { name: 'say-the-action' }
});
