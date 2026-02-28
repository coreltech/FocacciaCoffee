/**
 * Servicio de Preventa y Consolidación (Data Access Layer V2)
 */
import { supabase } from '../../../core/supabase.js';

export const PreventaService = {

    /**
     * Obtiene todas las órdenes que son pre-venta y están pendientes
     */
    async getPendingPreorders() {
        try {
            const { data, error } = await supabase
                .from('v2_orders')
                .select(`
                    id, sale_date, delivery_date, total_amount, balance_due, payment_status, status, correlative,
                    v2_customers!customer_id (id, name, phone, address),
                    v2_order_items (id, product_id, product_name, quantity, total_price)
                `)
                .eq('is_preorder', true)
                .eq('status', 'Pendiente')
                .order('delivery_date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('PreventaService Error:', err);
            return [];
        }
    },

    /**
     * Consolida los productos de todas las órdenes pendientes
     */
    async getConsolidatedResume() {
        try {
            const orders = await this.getPendingPreorders();
            const summary = {};

            orders.forEach(order => {
                (order.v2_order_items || []).forEach(item => {
                    const id = item.product_id || item.product_name;
                    if (!summary[id]) {
                        summary[id] = {
                            id: item.product_id,
                            name: item.product_name,
                            total_qty: 0,
                            orders_count: 0,
                            orderIds: []
                        };
                    }
                    summary[id].total_qty += parseFloat(item.quantity) || 0;
                    summary[id].orders_count += 1;
                    if (!summary[id].orderIds.includes(order.id)) {
                        summary[id].orderIds.push(order.id);
                    }
                });
            });

            return Object.values(summary).sort((a, b) => b.total_qty - a.total_qty);
        } catch (err) {
            console.error('PreventaService Consolidation Error:', err);
            return [];
        }
    },

    /**
     * Calcula la lista de insumos totales (Mercado) necesarios para cumplir las órdenes
     * Desglosa recetas y sub-recetas hasta llegar a insumos básicos.
     */
    async getShoppingList() {
        try {
            const orders = await this.getPendingPreorders();

            // 1. Obtener datos maestros para el desglose
            const [catalogRes, recipesRes] = await Promise.all([
                supabase.from('v2_catalog').select('id, name, v2_catalog_composition(quantity, supply_id, recipe_id)'),
                supabase.from('v2_recipes').select('id, name, expected_weight, v2_recipe_items!recipe_id(quantity, supply_id, sub_recipe_id)')
            ]);

            const catalogMap = (catalogRes.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const recipeMap = (recipesRes.data || []).reduce((acc, r) => ({ ...acc, [r.id]: r }), {});

            const totalSupplies = {}; // ID -> { name, qty, unit }

            // Función recursiva para desglosar una receta
            const processRecipe = (recipeId, multiplier) => {
                const recipe = recipeMap[recipeId];
                if (!recipe || !recipe.v2_recipe_items) return;

                const yieldWeight = recipe.expected_weight || 1; // Para normalizar
                const ratio = multiplier / yieldWeight;

                recipe.v2_recipe_items.forEach(item => {
                    if (item.supply_id) {
                        addToSupplies(item.supply_id, item.quantity * ratio);
                    } else if (item.sub_recipe_id) {
                        processRecipe(item.sub_recipe_id, item.quantity * ratio);
                    }
                });
            };

            const addToSupplies = (supplyId, qty) => {
                if (!supplyId) return;
                if (!totalSupplies[supplyId]) {
                    // Si no tenemos el nombre, lo dejamos para el final o lo buscamos
                    totalSupplies[supplyId] = { qty: 0 };
                }
                totalSupplies[supplyId].qty += qty;
            };

            // 2. Procesar cada ítem de cada orden
            for (const order of orders) {
                for (const item of (order.v2_order_items || [])) {
                    const product = catalogMap[item.product_id];
                    if (!product || !product.v2_catalog_composition) continue;

                    const orderQty = parseFloat(item.quantity) || 0;

                    product.v2_catalog_composition.forEach(comp => {
                        const totalNeeded = comp.quantity * orderQty;
                        if (comp.supply_id) {
                            addToSupplies(comp.supply_id, totalNeeded);
                        } else if (comp.recipe_id) {
                            processRecipe(comp.recipe_id, totalNeeded);
                        }
                    });
                }
            }

            // 3. Enriquecer con nombres y unidades de v2_supplies
            const supplyIds = Object.keys(totalSupplies);
            if (supplyIds.length === 0) return [];

            const { data: suppliesData } = await supabase
                .from('v2_supplies')
                .select('id, name, measurement_unit')
                .in('id', supplyIds);

            suppliesData.forEach(s => {
                if (totalSupplies[s.id]) {
                    totalSupplies[s.id].name = s.name;
                    totalSupplies[s.id].unit = s.measurement_unit;
                }
            });

            return Object.values(totalSupplies)
                .filter(s => s.name) // Solo los que encontramos
                .sort((a, b) => a.name.localeCompare(b.name));

        } catch (err) {
            console.error('PreventaService Shopping List Error:', err);
            return [];
        }
    }
};
