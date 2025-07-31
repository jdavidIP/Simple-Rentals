import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '%VITE_GOOGLE_MAPS_API_KEY%',
          process.env.VITE_GOOGLE_MAPS_API_KEY || ''
        );
      }
    }
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js'
  }
});
