import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  ssr: {
    noExternal: ['@clerk/clerk-react', 'convex'],
  },
})