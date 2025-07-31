import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // This line is crucial for deployment on services like Netlify.
  // It ensures all file paths in the final build are relative.
  base: './', 
  plugins: [react()],
})
