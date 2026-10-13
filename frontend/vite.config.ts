import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
import dotenv from 'dotenv'
dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss()
  ],
  server: {
    proxy: {
      "/api": {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  define: {
        // eslint-disable-next-line no-undef
        "NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        // eslint-disable-next-line no-undef
        "DEV_BASE_URL": JSON.stringify(process.env.DEV_BASE_URL),
        // eslint-disable-next-line no-undef
        "PROD_BASE_URL": JSON.stringify(process.env.PROD_BASE_URL),
      },
})
