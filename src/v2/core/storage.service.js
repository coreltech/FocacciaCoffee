/**
 * Servicio de Almacenamiento (Supabase Storage V2)
 * Maneja la carga de imágenes para el catálogo y otros módulos.
 */
import { supabase } from '../../core/supabase.js';

export const StorageService = {

    BUCKET_NAME: 'product-photos',

    /**
     * Sube un archivo al bucket de catálogo y devuelve la URL pública
     */
    async uploadImage(file, folder = 'products') {
        try {
            // 1. Asegurar nombre único para evitar colisiones
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // 2. Subir a Supabase Storage
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                // Si el error es que el bucket no existe, intentamos crearlo (aunque usualmente requiere admin)
                if (error.message.includes('bucket not found')) {
                    console.warn("Storage bucket not found. Please create 'catalog' bucket in Supabase dashboard.");
                }
                throw error;
            }

            // 3. Obtener URL Pública
            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(filePath);

            return { success: true, url: publicUrlData.publicUrl };
        } catch (err) {
            console.error('Storage Error:', err);
            return { success: false, error: err.message };
        }
    }
};
