import { defineConfig } from 'vite'

export default defineConfig({
  base: '/vote-2026/',
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
})
