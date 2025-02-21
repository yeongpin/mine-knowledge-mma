import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'development' ? '/' : '',
  root: path.join(__dirname, 'src/renderer'),
  publicDir: 'public',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'iife',
      }
    }
  },
  server: {
    port: 2511
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer')
    }
  }
}) 