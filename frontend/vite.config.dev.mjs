// frontend/vite.config.dev.mjs
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  envDir: '../',
  server: {
    host: '0.0.0.0', // Allows access from other Docker containers
    port: 3000,
    strictPort: true, // Exit if port 3000 is already in use

    // ADDED: This is the correct fix for the "Host not allowed" error.
    // The leading dot acts as a wildcard, allowing 'momentum.local' AND 'agb.momentum.local', etc.
    allowedHosts: ['.momentum.local', '.localhost'],

    // ADDED: Best practice for Docker to ensure Hot Module Replacement (HMR) works through Caddy.
    hmr: {
      clientPort: 443
    },
    watch: {
      usePolling: true // Helps detect file changes inside Docker
    },

  },

});