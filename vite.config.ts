import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), sentryVitePlugin({
    org: "stas-6t",
    project: "javascript-react"
  })],

  server: {
    host: true,
    port: 5173
  },

  build: {
    sourcemap: true
  }
})
