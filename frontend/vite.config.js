import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://aakar26-bughunter-kaizen.onrender.com/',
        changeOrigin: true
      }
    }
  }
})
