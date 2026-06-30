import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Plugin para prevenir el flash de blanco al aplicar el tema antes de que React monte
function antiFlashPlugin(): Plugin {
  return {
    name: 'anti-flash',
    transformIndexHtml(html) {
      const script = `
    <script>
      (function() {
        try {
          var isDark = localStorage.getItem('dajho_darkMode') === 'true';
          var bg = isDark ? '#0f1729' : '#f5f7fa';
          var style = document.createElement('style');
          style.textContent = 'html,body{background-color:'+bg+' !important;}#root{background-color:'+bg+' !important;}';
          document.head.appendChild(style);
          if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch(e) {}
      })();
    </script>`;
      return html.replace('</head>', script + '</head>');
    },
  };
}

export default defineConfig({
  plugins: [react(), antiFlashPlugin()],
  base: './',
  define: {
    __DAJHO_TYPE__: JSON.stringify(process.env.DAJHO_TYPE || 'tienda'),
  },
  build: {
    outDir: 'dist-electron/renderer',
    emptyOutDir: true,
    rollupOptions: {
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
    },
  },
  server: {
    port: 5173,
  },
});