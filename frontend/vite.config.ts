import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Wails utilise le dossier dist pour l'embed
  build: {
    outDir: 'dist',
  },
})
