/**
 * Servicio de Producción (Data Access Layer V2)
 * Maneja el registro de horneado, descuento de inventario y pedidos pendientes con Precisión Quirúrgica.
 */
import { supabase } from '../../../core/supabase.js';

export const ProductionService = {

    /**
     * Obtiene los datos necesarios para el Dashboard de Producción V2
     */
    async getProductionData() {
        try {
            console.log("[ProductionService] Iniciando carga de datos V2...");

            // 1. Catálogo
            const { data: catalog, error: catErr } = await supabase.from('v2_catalog').select('*').eq('is_active', true).order('name');
            if (catErr) { console.error("Error en V2_CATALOG:", catErr); throw new Error(`Catalogo: ${catErr.message}`); }

            // 2. Recetas (Consulta completa para habilitar escalado quirúrgico)
            const recipeSelect = `
                id, name, expected_weight, stock,
                v2_recipe_items!recipe_id (
                    id, quantity, percentage, is_base, supply_id, sub_recipe_id,
                    v2_supplies (id, name, last_price, measurement_unit)
                )
            `;
            const { data: recipes, error: recErr } = await supabase.from('v2_recipes').select(recipeSelect).order('name');
            if (recErr) { console.error("Error en V2_RECIPES:", recErr); throw new Error(`Recetas: ${recErr.message}`); }

            // 3. Logs
            const { data: logs, error: logErr } = await supabase.from('v2_production_logs').select('*').order('production_date', { ascending: false }).limit(20);
            if (logErr) { console.error("Error en V2_LOGS:", logErr); throw new Error(`Logs: ${logErr.message}`); }

            // 4. Pendientes
            const pending = await this.getPendingOrdersSummary();

            console.log("[ProductionService] Carga exitosa:", { catalog: catalog.length, recipes: recipes.length });

            return {
                catalog: catalog || [],
                recipes: recipes || [],
                logs: logs || [],
                shoppingList: pending || []
            };
        } catch (err) {
            console.error('Service V2 Fatal Error:', err);
            return { error: err.message, catalog: [], recipes: [], logs: [], shoppingList: [] };
        }
    },

    async getPendingOrdersSummary() {
        try {
            const { data: orders, error } = await supabase
                .from('v2_orders')
                .select(`id, v2_order_items (id, product_id, product_name, quantity)`)
                .eq('is_preorder', true)
                .eq('status', 'Pendiente');

            if (error) throw error;

            const summary = orders.reduce((acc, order) => {
                if (!order.v2_order_items) return acc;
                order.v2_order_items.forEach(item => {
                    const id = item.product_id || item.product_name;
                    if (!acc[id]) acc[id] = { name: item.product_name, total: 0, orderIds: [] };
                    acc[id].total += parseFloat(item.quantity) || 0;
                    if (!acc[id].orderIds.includes(order.id)) acc[id].orderIds.push(order.id);
                });
                return acc;
            }, {});

            return Object.entries(summary).map(([id, info]) => ({
                id: id.length > 20 ? id : '',
                name: info.name,
                pending: info.total,
                orderIds: info.orderIds // Nueva propiedadvital
            }));
        } catch (err) {
            console.error('Pending Orders Error:', err);
            return [];
        }
    },

    async registerQuirurgico(prodData) {
        try {
            const { data, error } = await supabase.rpc('v2_rpc_registrar_produccion_quirurgica', {
                p_catalog_id: prodData.catalogId || null,
                p_recipe_id: prodData.recipeId || null,
                p_actual_qty: prodData.actualQty,
                p_expected_qty: prodData.expectedQty,
                p_total_cost: prodData.totalCost || 0,
                p_overrides: prodData.overrides || [],
                p_order_ids: prodData.orderIds || null, // Nuevo
                p_is_fulfilling_order: prodData.isFulfillingOrder || false // Nuevo
            });
            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async deleteLog(logId) {
        try {
            const { error } = await supabase.from('v2_production_logs').delete().eq('id', logId);
            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};
