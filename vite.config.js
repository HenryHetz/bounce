// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // ✅ вместо '/' или '/bounce/'
  esbuild: {
    // drop: ['console', 'debugger'], // выкинуть console.* и debugger в билде
  },
  build: {
    outDir: 'bounce', // ← вот здесь имя выходной папки
    emptyOutDir: true, // очищает перед сборкой
    sourcemap: false, // не таскать карты в прод
    minify: 'esbuild', // по умолчанию так и есть
  },
})
