import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// SPA + PWA (installable บนมือถือ + iPad) — ดู deploy-plan.md sec.2-3
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'ลุยเควส (LuiQuest)',
        short_name: 'ลุยเควส',
        description: 'อยากเก่งอะไร ลุยเลย — วันละเควส',
        lang: 'th',
        // สีแบรนด์จริง (ชมพูอ่อนเหมือนพื้นแอพ) — ของเดิม #0f172a เป็นสีดำน้ำเงินที่ติดมาจาก scaffold
        // background_color = สีจอ splash ตอนเปิดแอพที่ติดตั้งไว้ ถ้าปล่อยเป็นดำจะแฟลชดำก่อนเข้าแอพชมพูทุกครั้ง
        theme_color: '#FDF2F8',
        background_color: '#FDF2F8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
