import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    // Base path for assets
    base: './', // Cambiado a relativo para mejor compatibilidad en despliegues estáticos

    // Puerto del servidor de desarrollo
    server: {
        port: 3000,
        open: true,
        host: true
    },

    // Configuración de build para producción
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                login: path.resolve(__dirname, 'login.html'),
                legacy: path.resolve(__dirname, 'index_v1.html')
            }
        }
    },

    // Alias para imports más limpios
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@modules': path.resolve(__dirname, './src/modules'),
            '@ui': path.resolve(__dirname, './src/ui')
        }
    },

    // Optimización de dependencias
    optimizeDeps: {
        include: ['@supabase/supabase-js']
    }
});
