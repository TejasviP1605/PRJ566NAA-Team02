import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite bundles the React app and runs the dev server
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
})
