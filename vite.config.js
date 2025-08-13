// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // ✅ вместо '/' или '/bounce/'
  build: {
    outDir: 'bounce', // ← вот здесь имя выходной папки
    emptyOutDir: true, // очищает перед сборкой
  },
})
