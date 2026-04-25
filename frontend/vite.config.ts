import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use globe.gl's self-contained UMD build which bundles its own three copy,
      // avoiding Rollup's attempt to resolve three/* subpaths against the top-level three.
      'globe.gl': path.resolve('./node_modules/globe.gl/dist/globe.gl.min.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
