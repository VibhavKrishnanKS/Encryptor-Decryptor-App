import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Encryptor-Decryptor-App/', // Required for GitHub Pages
})
