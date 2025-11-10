import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
          vendor: ['vue', 'pinia'],
          parsers: ['fflate', '@plist/plist', 'app-info-parser'],
          viz: ['@nivo/treemap'],
          virtual: ['@tanstack/virtual-core'],
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
