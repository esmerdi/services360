import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-leaflet') || id.includes('leaflet.markercluster') || id.includes('leaflet')) {
            return 'vendor-map'
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase'
          }

          if (id.includes('react-router-dom')) {
            return 'vendor-router'
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          if (id.includes('react-dom') || id.includes('react')) {
            return 'vendor-react'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
