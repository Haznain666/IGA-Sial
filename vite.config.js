import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
