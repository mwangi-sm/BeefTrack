import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Disable automatic HMR and file watching so the browser only updates
  // when the user manually refreshes the page.
  server: {
    hmr: false,
    watch: {
      ignored: ['**/*'],
    },
  },
})
