import { defineConfig } from 'vite';
import aiApiProxy from './vite-plugin-ai-proxy.js';

export default defineConfig({
  plugins: [aiApiProxy()],
  server: {
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});
