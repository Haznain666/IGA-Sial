import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from /IGA-Sial/, so CI sets BASE_PATH.
  // Local dev and any root-domain host (e.g. Hostinger) leave it unset.
  base: process.env.BASE_PATH || '/',
  // This is a Vite app but the project's env vars use the NEXT_PUBLIC_ prefix,
  // so both prefixes are exposed to client code via import.meta.env.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
