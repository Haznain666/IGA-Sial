import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from /IGA-Sial/, so CI sets BASE_PATH.
  // Local dev and any root-domain host (e.g. Hostinger) leave it unset.
  base: process.env.BASE_PATH || '/',
  // Browser-side env vars must use the VITE_ prefix in a Vite app.
  envPrefix: ['VITE_'],
  server: {
    port: 5180,
    host: true,
    strictPort: false,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
