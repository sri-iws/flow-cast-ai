import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5155,
    watch: {
      ignored: ['**/.venv/**']
    },
    proxy: {
      '/api': 'https://flow-cast-ai.onrender.com'
    }
  }
});
