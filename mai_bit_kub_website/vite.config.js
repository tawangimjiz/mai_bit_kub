import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/mai_bit_kub",
  server: {
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // ปิด DevTools notification
  devTools: {
    enabled: false
  }
})
