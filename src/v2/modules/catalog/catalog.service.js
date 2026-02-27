/**
 * Servicio de Catálogo de Productos (Data Access Layer V2)
 * Maneja los productos terminados (Panes, Bebidas) disponibles para venta.
 */
import { supabase } from '../../../core/supabase.js';

export const CatalogService = {

    /**
     * Obtiene todos los productos del catálogo
     */
    async getCatalog() {
        try {
            const { data, error } = await supabase
                .from('v2_catalog')
                .select(`
                    *,
                    composition:v2_catalog_composition(
                        quantity,
                        recipe_id,
                        supply_id
                    )
                `)
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Service V2 Error fetching catalog:', err);
            return [];
        }
    },

    /**
   * Crea un nuevo producto terminado en el catálogo y su composición (BOM)
   */
    async createProduct(productData, compositionItems = []) {
        try {
            // 1. Guardar Producto
            const { data, error } = await supabase
                .from('v2_catalog')
                .insert([{
                    name: productData.product_name.trim(), // mapeado v1 form -> v2 DB
                    category: productData.pos_category,
                    price: parseFloat(productData.price_usd) || 0,
                    stock: parseFloat(productData.stock_disponible) || 0,
                    image_url: productData.image_url || '',
                    is_active: true // Por defecto
                }])
                .select();

            if (error) throw error;

            const newProductId = data[0].id;

            // 2. Guardar Composición (Masas, Empaques, Adornos)
            if (compositionItems.length > 0) {
                const payload = compositionItems.map(item => ({
                    catalog_id: newProductId,
                    recipe_id: item.recipe_id || null,
                    supply_id: item.supply_id || null,
                    quantity: item.quantity
                }));
                const { error: compError } = await supabase
                    .from('v2_catalog_composition')
                    .insert(payload);
                if (compError) throw compError;
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Service V2 Error creating product:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Actualiza un producto y su composición
     */
    async updateProduct(id, productData, compositionItems = []) {
        try {
            // 1. Actualizar Cabecera
            const { error: updateError } = await supabase
                .from('v2_catalog')
                .update({
                    name: productData.product_name.trim(),
                    category: productData.pos_category,
                    price: parseFloat(productData.price_usd) || 0,
                    stock: parseFloat(productData.stock_disponible) || 0,
                    image_url: productData.image_url
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. Limpiar y Re-insertar Composición (BOM)
            // Borramos lo anterior
            const { error: delError } = await supabase
                .from('v2_catalog_composition')
                .delete()
                .eq('catalog_id', id);

            if (delError) throw delError;

            // Insertamos lo nuevo
            if (compositionItems.length > 0) {
                const payload = compositionItems.map(item => ({
                    catalog_id: id,
                    recipe_id: item.recipe_id || null,
                    supply_id: item.supply_id || null,
                    quantity: item.quantity
                }));
                const { error: compError } = await supabase
                    .from('v2_catalog_composition')
                    .insert(payload);
                if (compError) throw compError;
            }

            return { success: true };
        } catch (err) {
            console.error('Service V2 Error updating product:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Obtiene la composición técnica de un producto
     */
    async getComposition(catalogId) {
        try {
            const { data, error } = await supabase
                .from('v2_catalog_composition')
                .select(`
                    id, quantity, recipe_id, supply_id,
                    v2_recipes (name),
                    v2_supplies (name, measurement_unit, last_price)
                `)
                .eq('catalog_id', catalogId);

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Service V2 Error fetching composition:', err);
            return [];
        }
    },

    /**
     * Actualiza el stock de vitrina de un producto
     */
    async updateStock(id, newStock) {
        try {
            const { error } = await supabase
                .from('v2_catalog')
                .update({ stock: newStock })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Desactiva un producto del catálogo (Soft Delete preventivo)
     */
    async deactivateProduct(id) {
        try {
            const { error } = await supabase
                .from('v2_catalog')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};
