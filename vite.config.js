import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/aps-admin-panel/',
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
})
