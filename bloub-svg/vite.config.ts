import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/unitool-svg-editor/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  build: {
    outDir: '../public/unitool-svg-editor',
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
})
