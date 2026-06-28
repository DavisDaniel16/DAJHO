import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'rollup-plugin-obfuscator';
import path from 'path';

// Plugin para prevenir el flash de blanco al aplicar el tema antes de que React monte
function antiFlashPlugin(): Plugin {
  return {
    name: 'anti-flash',
    transformIndexHtml(html) {
      const script = `
    <script>
      (function() {
        var isDark = localStorage.getItem('dajho_darkMode') === 'true';
        var bg = isDark ? '#0f1729' : '#f5f7fa';
        document.write('<style>html,body{background-color:'+bg+' !important;}#root{background-color:'+bg+' !important;}<\\/style>');
        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();
    </script>`;
      return html.replace('</head>', script + '</head>');
    },
  };
}

export default defineConfig({
  plugins: [react(), antiFlashPlugin()],
  base: './',
  build: {
    outDir: 'dist-electron/renderer',
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        obfuscatorPlugin({
          global: true,
          options: {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true,
            shuffleStringArray: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
            target: 'browser',
            transformObjectKeys: false,
            unicodeEscapeSequence: false,
          },
        }),
      ],
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