import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                 // listen on 0.0.0.0
    port: 5173,
    strictPort: true,           // don't auto-bump to 5174
    allowedHosts: ['raspberrypi.local', /\.local$/],
    // HMR through Apache on port 80 when accessed via raspberrypi.local
    hmr: {
      protocol: 'ws',
      host: 'raspberrypi.local',
      clientPort: 80
    }
  }
})
