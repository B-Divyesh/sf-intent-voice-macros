import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'site',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: '../dist/site',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'site/index.html'),
        privacy: resolve(__dirname, 'site/privacy/index.html'),
        terms: resolve(__dirname, 'site/terms/index.html'),
        notFound: resolve(__dirname, 'site/404.html')
      }
    }
  }
});
