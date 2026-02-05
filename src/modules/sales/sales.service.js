import { supabase } from '../../core/supabase.js';
import { getGlobalRates } from '../settings/settings.service.js';

export const SalesService = {
    async getData(selectedDate, page = 0, limit = 50, filterBy = 'sale_date') {
        const start = page * limit;
        const end = start + limit - 1;

        // Base query for sales list
        let salesQuery = supabase.from('sales_orders')
            .select('*, customers(name)', { count: 'exact' });

        // Apply Date Filter based on mode
        if (filterBy === 'delivery_date') {
            salesQuery = salesQuery.eq('delivery_date', selectedDate);
        } else {
            // Default: sale_date
            salesQuery = salesQuery
                .gte('sale_date', `${selectedDate}T00:00:00`)
                .lte('sale_date', `${selectedDate}T23:59:59`);
        }

        // Ordering: if delivery view, maybe order by created_at? 
        // Default decending by sale date usually fine.
        salesQuery = salesQuery
            .order('sale_date', { ascending: false })
            .range(start, end);

        // Daily Stats Query (Needs to match filter? Usually summary is "Money entering TODAY")
        // NOTE: The summary logic in Controller calculates "Money IN". 
        // If we filter by Delivery Date, the money "IN" today might be different from the sales displayed.
        // Standard practice: Summary always shows TODAY'S Cash Flow (sale_date = today).
        // The list might show future deliveries.
        // Let's keep stats fixed on SALE DATE (Today's cash) to avoid confusion about "Caja".

        const [rates, catalog, customers, sales, stats] = await Promise.all([
            getGlobalRates(),
            supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name'),
            supabase.from('customers').select('*').order('name'),
            salesQuery,
            // Stats always for SELECTED DATE (usually today) regarding CASH FLOW
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
            customer_id,
            delivery_date // YYYY-MM-DD
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
            p_customer_id: saleData.customer_id,
            p_product_name: saleData.product_name,
            p_delivery_date: saleData.delivery_date || null
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
        return await supabase.from('sales_orders').delete().eq('id', saleId);
    },

    async confirmPendingPayment(saleId, amount) {
        return await supabase.from('sales_orders')
            .update({ payment_status: 'Pagado', amount_paid: amount, balance_due: 0 })
            .eq('id', saleId);
    },

    async registerCustomer({ name, phone, email }) {
        // 1. Check if exists by Name or Phone
        let query = supabase.from('customers').select('*').or(`name.eq.${name},phone.eq.${phone}`);
        const { data: existing } = await query;

        if (existing && existing.length > 0) {
            // Return the first match if found, don't create new
            return existing[0];
            // Alternatively throw error: throw new Error("El cliente ya existe");
        }

        const { data, error } = await supabase
            .from('customers')
            .insert([{ name, phone, email }])
            .select()
            .single();

        if (error) {
            console.error("DB Create Customer Error:", error);
            throw new Error("No se pudo crear el cliente.");
        }
        return data;
    },

    async updateCustomer(id, { name, phone, email }) {
        const { data, error } = await supabase
            .from('customers')
            .update({ name, phone, email })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCustomer(id) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
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
