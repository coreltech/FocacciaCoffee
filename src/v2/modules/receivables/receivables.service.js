/**
 * Servicio de Ventas y Cobranzas (Data Access Layer)
 */
import { supabase } from '../../../core/supabase.js';

export const ReceivablesService = {

    /**
     * Obtiene todas las ventas/órdenes con detalles del cliente y pagos
     */
    async getOrders() {
        try {
            const { data, error } = await supabase
                .from('v2_orders')
                .select(`
                    id, sale_date, delivery_date, 
                    total_amount, amount_paid, balance_due, payment_status,
                    payment_methods, is_preorder, status, correlative,
                    v2_customers!customer_id (id, name, address, phone),
                    v2_order_items (quantity, product_name)
                `)
                .order('sale_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Service Error fetching orders:', err);
            return [];
        }
    },

    /**
     * Registra un pago/abono a una orden existente
     */
    async registerPayment(orderId, usdAmount, method, originalAmount) {
        try {
            // 1. Obtener la orden actual
            const { data: order, error: fetchErr } = await supabase
                .from('v2_orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (fetchErr) throw fetchErr;
            if (!order) throw new Error('Orden no encontrada');

            // 2. Calcular nuevos totales
            const currentPaid = parseFloat(order.amount_paid || 0);
            const amountToAdd = parseFloat(usdAmount);
            const newPaid = currentPaid + amountToAdd;
            const totalAmount = parseFloat(order.total_amount);

            // Limitamos a que no pague más del total (aunque el input HTML también lo limite)
            const finalPaid = Math.min(newPaid, totalAmount);
            const newBalance = totalAmount - finalPaid;
            const newStatus = (newBalance <= 0.0005) ? 'Pagado' : 'Pendiente';

            // 3. Actualizar métodos de pago en el JSON
            const details = order.payment_methods || [];
            details.push({
                method: method,
                amount: originalAmount || usdAmount, // Guardamos el monto en la moneda original para referencia
                usd: usdAmount,                      // Siempre guardamos el equivalente USD para balances
                date: new Date().toISOString()
            });

            // 4. Guardar en Supabase
            const { error: updateErr } = await supabase
                .from('v2_orders')
                .update({
                    amount_paid: finalPaid,
                    balance_due: newBalance,
                    payment_status: newStatus,
                    payment_methods: details
                })
                .eq('id', orderId);

            if (updateErr) throw updateErr;
            return { success: true };

        } catch (err) {
            console.error('Service Error registering payment:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Elimina permanentemente una transacción de ventas
     */
    async deleteOrder(orderId) {
        try {
            const { error } = await supabase
                .from('v2_orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Service Error deleting order:', err);
            return { success: false, error: err.message };
        }
    }
};
