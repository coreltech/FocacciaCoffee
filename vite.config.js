import { defineConfig } from 'vite';
import path from 'path';

// Base path for assets
base: '',
    // Puerto del servidor de desarrollo
    server: {
    port: 3000,
        open: true, // Abre el navegador automáticamente
            host: true // Permite acceso desde la red local
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
