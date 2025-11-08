import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es', // Use ES modules in workers for better performance
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          parsers: ['fflate', '@plist/plist', 'app-info-parser'],
          viz: ['@nivo/treemap'],
          tables: ['@tanstack/react-table', '@tanstack/react-virtual'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['comlink'],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
