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
    }
};
