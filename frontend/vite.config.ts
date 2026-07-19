import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Absolute base for a root-domain deploy (GitHub Pages user site / custom
  // domain). Real path routes like /outerspace resolve their assets from '/'.
  base: '/',
  // shadcn-style "@/" alias -> src/ (used by the ui components below).
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { host: '127.0.0.1', port: 5173 },
})
