import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel ko shant karne ke liye hum warning limit badha rahe hain
    chunkSizeWarningLimit: 2000, 
  }
})