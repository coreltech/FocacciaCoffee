import { supabase } from '../../core/supabase.js';
import { getGlobalRates } from '../settings/settings.service.js';

export const SalesService = {
    async getData(selectedDate, page = 0, limit = 50) {
        const start = page * limit;
        const end = start + limit - 1;

        // Parallel fetch for speed
        const [rates, catalog, customers, sales, stats] = await Promise.all([
            getGlobalRates(),
            supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name'),
            supabase.from('customers').select('*').order('name'),
            supabase.from('sales_orders')
                .select('*, customers(name)', { count: 'exact' })
                .gte('sale_date', `${selectedDate}T00:00:00`)
                .lte('sale_date', `${selectedDate}T23:59:59`)
                .order('sale_date', { ascending: false })
                .range(start, end),
            // Fetch stats (all items for the day) - Lightweight query
            supabase.from('sales_orders')
                .select('total_amount, balance_due, payment_status, payment_details')
                .gte('sale_date', `${selectedDate}T00:00:00`)
                .lte('sale_date', `${selectedDate}T23:59:59`)
        ]);

        return {
            rates,
            catalog: catalog.data || [],
            customers: customers.data || [],
            sales: sales.data || [],
            totalCount: sales.count || 0,
            dailyStats: stats.data || []
        };
    },

    async registerSale(saleData) {
        /* 
          saleData expectation:
          {
            product_id, // ID from catalog
            product_name, // Backup name
            quantity,
            total_amount,
            amount_paid,
            payment_status,
            payment_details, // JSON array
            customer_id
          }
        */

        // Call the Atomic RPC function created in SQL Phase
        const { data, error } = await supabase.rpc('registrar_venta_atomica', {
            p_product_id: saleData.product_id,
            p_quantity: saleData.quantity,
            p_total_amount: saleData.total_amount,
            p_amount_paid: saleData.amount_paid,
            p_payment_status: saleData.payment_status,
            p_payment_details: saleData.payment_details,
            p_payment_details: saleData.payment_details,
            p_customer_id: saleData.customer_id,
            p_product_name: saleData.product_name,
            p_delivery_date: saleData.delivery_date || null // New Param
        });

        if (error) {
            console.error("Supabase RPC Error:", error);
            throw error;
        }
        if (!data.success) {
            console.error("RPC Business Logic Error:", data);
            throw new Error(data.message || data.error || 'Error registrando venta');
        }

        return data;
    },

    async deleteSale(saleId) {
        // NOTE: Deleting a sale should ideally reverse the stock movement via another RPC or Trigger.
        // For now, we keep the simple delete, BUT be aware this might cause stock desync if we don't handle the "reverse" logic.
        // Given the scope, we will stick to the requested Delete but warn.
        // Actually, Phase 1 didn't explicitly ask for Delete RPC, so we keep standard delete for now.
        // However, since we have a Kardex, we should technically add a "VOID" transaction.
        // Let's stick to basic delete for this refactor step unless the user asked for it.
        return await supabase.from('sales_orders').delete().eq('id', saleId);
    },

    async confirmPendingPayment(saleId, amount) {
        return await supabase.from('sales_orders')
            .update({ payment_status: 'Pagado', amount_paid: amount, balance_due: 0 })
            .eq('id', saleId);
    },

    async registerCustomer({ name, phone, email }) {
        const { data, error } = await supabase
            .from('customers')
            .insert([{ name, phone, email }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    subscribeToSales(onUpdate) {
        return supabase
            .channel('sales_realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sales_orders'
            }, payload => {
                onUpdate(payload);
            })
            .subscribe();
    }
};
