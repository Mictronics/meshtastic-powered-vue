import { fileURLToPath, URL } from 'node:url'
import { execSync } from "node:child_process";
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import unusedCode from 'vite-plugin-unused-code'
import { visualizer } from "rollup-plugin-visualizer"

let hash = "";
let version = "";
try {
  hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch (error) {
  console.error("Error getting git hash:", error);
  hash = "DEV";
}

try {
  version = execSync("git describe --tags --abbrev=0", {
    encoding: "utf8",
  }).trim();
} catch {
  console.error("Error getting git version.");
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    unusedCode({
      patterns: ['src/**/*.*'],
    }),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: false,
    })
  ],
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('meshtastic-powered-vue'),
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(hash),
    'import.meta.env.VITE_VERSION': JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/webclient/'
})
