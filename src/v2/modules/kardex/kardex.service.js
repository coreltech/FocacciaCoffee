import { supabase } from '../../../core/supabase.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { PurchasesService } from '../purchases/purchases.service.js';

export const KardexService = {

    /**
     * Obtiene el historial de Kardex cruzando inteligentemente los nombres de los ítems en memoria.
     * @param {Object} filters - startDate, endDate, itemType, itemId 
     */
    async getKardexHistory(filters = {}) {
        try {
            // 1. Iniciar consulta base a la tabla polimórfica
            let query = supabase
                .from('v2_inventory_transactions')
                .select('*')
                .order('created_at', { ascending: false });

            // 2. Aplicar Filtros (si existen)
            if (filters.startDate) {
                query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`);
            }
            if (filters.endDate) {
                query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
            }
            if (filters.itemType) { // 'CATALOG_ITEM' o 'SUPPLY_ITEM'
                query = query.eq('item_type', filters.itemType);
            }
            if (filters.itemId) {
                query = query.eq('item_id', filters.itemId);
            }

            const { data: transactions, error } = await query;
            if (error) throw error;

            if (!transactions || transactions.length === 0) return [];

            // 3. Descargar Diccionarios de Nombres para el cruce rápido en memoria
            const [catalogRes, suppliesRes] = await Promise.all([
                CatalogService.getCatalog(),
                PurchasesService.getSupplies()
            ]);

            // Crear mapas hash (Diccionarios: O(1) búsqueda)
            const catalogMap = new Map((catalogRes || []).map(item => [item.id, item.name]));
            const suppliesMap = new Map((suppliesRes || []).map(item => [item.id, item.name]));

            // 4. Cruzar e inyectar el nombre real a cada fila
            const enrichedHistory = transactions.map(t => {
                let itemName = 'Desconocido';

                if (t.item_type === 'CATALOG_ITEM') {
                    itemName = catalogMap.get(t.item_id) || `Producto [${t.item_id.substring(0, 6)}]`;
                } else if (t.item_type === 'SUPPLY_ITEM') {
                    itemName = suppliesMap.get(t.item_id) || `Insumo [${t.item_id.substring(0, 6)}]`;
                }

                return {
                    ...t,
                    item_name: itemName
                };
            });

            return enrichedHistory;

        } catch (err) {
            console.error('Error fetching Kardex history:', err);
            return [];
        }
    }
};
