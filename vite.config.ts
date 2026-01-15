import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
    plugins: [
        react(),
        crx({ manifest }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@shared': resolve(__dirname, 'src/shared'),
            '@popup': resolve(__dirname, 'src/popup'),
            '@content': resolve(__dirname, 'src/content'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/index.html'),
            },
        },
        outDir: 'dist',
        sourcemap: true,
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
});
