/**
 * Servicio de Ventas y Punto de Venta (Data Access Layer V2)
 */
import { supabase } from '../../../core/supabase.js';
import { SettingsService } from '../settings/settings.service.js';

export const SalesService = {

    /**
     * Obtiene datos iniciales para el POS (Tasas, Catálogo con Stock, Clientes)
     */
    async getDailyData() {
        const [rates, catalog, customers] = await Promise.all([
            SettingsService.getRates(),
            supabase.from('v2_catalog').select('*').eq('is_active', true).order('name'),
            supabase.from('v2_customers').select('*').order('name')
        ]);

        return {
            rates,
            catalog: catalog.data || [],
            customers: customers.data || []
        };
    },

    /**
     * Registra una venta atómica (Deducción de Stock + Transacción + Orden)
     * V2 utiliza lógica cliente-side segura con transacciones manuales coordinadas
     */
    async registerSale(saleData) {
        /*
        saleData: {
            items: [{ id, name, qty, price, total }],
            payment: { methods: [], totalPaidUSD, status, balance },
            customer: { id, name },
            saleDate: ISOString,
            deliveryDate: yyyy-mm-dd (opcional)
        }
        */
        const { items, payment, customer, saleDate, deliveryDate, isPreorder } = saleData;

        try {
            const isEncargo = isPreorder || !!deliveryDate;

            // 1. Validar Stock Crítico (Solo para Venta Directa)
            if (!isEncargo) {
                for (const item of items) {
                    if (item.id) {
                        const { data: p } = await supabase.from('v2_catalog').select('stock, name').eq('id', item.id).single();
                        if (p && p.stock < item.qty) {
                            throw new Error(`Stock insuficiente para ${p.name}. Disponible: ${p.stock}`);
                        }
                    }
                }
            }

            // 2. Insertar Cabecera de Orden (v2_orders)
            // Generar correlativo amigable
            const timestampStr = Date.now().toString().slice(-6);
            const correlative = `V2-${timestampStr}`;

            const orderPayload = {
                correlative,
                sale_date: saleDate || new Date().toISOString(),
                delivery_date: deliveryDate || null,
                customer_id: customer?.id || null,
                total_amount: payment.totalCartUSD,
                amount_paid: payment.totalPaidUSD,
                balance_due: (payment.status === 'Pagado') ? 0 : payment.balance,
                payment_status: payment.status,
                payment_methods: payment.methods,
                is_preorder: isEncargo,
                status: isEncargo ? 'Pendiente' : 'Completada'
            };

            const { data: order, error: ordErr } = await supabase.from('v2_orders').insert([orderPayload]).select().single();
            if (ordErr) throw ordErr;

            const orderId = order.id;

            // 3. Procesar Líneas de Productos (v2_order_items) y Kardex
            const itemsPayload = [];

            for (const item of items) {
                // Preparar item para v2_order_items
                itemsPayload.push({
                    order_id: orderId,
                    product_id: item.id || null,
                    product_name: item.name,
                    quantity: item.qty,
                    unit_price: item.price,
                    total_price: item.total
                });

                // Descontar Stock y registrar Kardex si es producto del catálogo
                if (item.id && !isEncargo) {
                    const { data: currentP } = await supabase.from('v2_catalog').select('stock').eq('id', item.id).single();
                    const oldStock = currentP?.stock || 0;
                    const newStock = oldStock - item.qty;

                    await supabase.from('v2_catalog').update({ stock: newStock }).eq('id', item.id);

                    await supabase.from('v2_inventory_transactions').insert([{
                        item_type: 'CATALOG_ITEM',
                        item_id: item.id,
                        reference_id: orderId,
                        transaction_type: 'SALE',
                        quantity: item.qty,
                        old_stock: oldStock,
                        new_stock: newStock,
                        reason: 'Venta Directa V2'
                    }]);
                } else if (item.id && isEncargo) {
                    await supabase.from('v2_inventory_transactions').insert([{
                        item_type: 'CATALOG_ITEM',
                        item_id: item.id,
                        reference_id: orderId,
                        transaction_type: 'SALE_RESERVED',
                        quantity: item.qty,
                        old_stock: 0,
                        new_stock: 0,
                        reason: `Encargo programado para ${deliveryDate}`
                    }]);
                }
            }

            // Insertar todas las líneas de una vez
            const { error: itemsErr } = await supabase.from('v2_order_items').insert(itemsPayload);
            if (itemsErr) throw itemsErr;

            return { success: true };
        } catch (err) {
            console.error('POS Service Error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Reutilizamos lógica de reconstrucción histórica (migrada aquí)
     */
    async createHistoricalOrder(orderData) {
        try {
            // Nota: Este método migrado ahora debe adaptarse al v2_orders si se usa
            const { data, error } = await supabase
                .from('v2_orders')
                .insert([{
                    total_amount: orderData.totalPrice,
                    sale_date: orderData.saleDate,
                    status: 'Completada',
                    payment_status: 'Pagado',
                    amount_paid: orderData.totalPrice,
                    balance_due: 0,
                    correlative: `HIST-${Date.now().toString().slice(-6)}`
                }]);

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async getSalesHistory(limit = 20) {
        const { data, error } = await supabase
            .from('v2_orders')
            .select('*, v2_order_items(product_name, quantity, total_price), v2_customers(name)')
            .order('sale_date', { ascending: false })
            .limit(limit);
        return error ? [] : data;
    },

    async deleteOrder(id) {
        const { error } = await supabase.from('v2_orders').delete().eq('id', id);
        return { success: !error, error: error?.message };
    },

    async createCustomer(data) {
        const { CustomersService } = await import('../customers/customers.service.js');
        return await CustomersService.createCustomer(data);
    }
};
