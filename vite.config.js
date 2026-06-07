import { defineConfig } from 'vite';
import aiApiProxy from './vite-plugin-ai-proxy.js';

export default defineConfig({
  plugins: [aiApiProxy()],
  server: {
    allowedHosts: true
  }
});
