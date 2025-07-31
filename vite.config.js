import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // FIX: This tells Vite to use relative paths for the build.
  base: './', 
  plugins: [react()],
})
