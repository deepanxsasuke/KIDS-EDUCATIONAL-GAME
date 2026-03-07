import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        port: 5173,
        host: true,
        allowedHosts: [
            'e4c5-2401-4900-caca-df57-28f9-ba39-5e7b-e6f4.ngrok-free.app'
        ]
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
