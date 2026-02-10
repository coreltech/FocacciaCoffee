import { supabase } from '../../core/supabase.js';
import { getGlobalRates } from '../settings/settings.service.js';

export const SalesService = {
    async getData(startDate, endDate = null, page = 0, limit = 50, filterBy = 'sale_date') {
        const start = page * limit;
        const resultLimit = start + limit - 1;

        // Base query for sales list
        let salesQuery = supabase.from('sales_orders')
            .select('*, customers(name)', { count: 'exact' });

        // TEMPORARY DEBUG: Check columns
        supabase.from('sales_orders').select('*').limit(1).then(console.log);

        // Apply Date Filter based on mode
        if (filterBy === 'delivery_date') {
            // For delivery date, we might want a single date or range too.
            // If endDate is provided, use range.
            if (endDate) {
                salesQuery = salesQuery
                    .gte('delivery_date', startDate)
                    .lte('delivery_date', endDate);
            } else {
                salesQuery = salesQuery.eq('delivery_date', startDate);
            }
        } else {
            // Default: sale_date
            // Handles both single date (startDate to startDate 23:59) and Range (startDate to endDate 23:59)
            const finalEnd = endDate ? endDate : startDate;

            salesQuery = salesQuery
                .gte('sale_date', `${startDate}T00:00:00`)
                .lte('sale_date', `${finalEnd}T23:59:59`);
        }

        salesQuery = salesQuery
            .order('sale_date', { ascending: false })
            .range(start, resultLimit);

        // Stats Query always for the specific range of Sale Date (Cash Flow)
        const finalEndStats = endDate ? endDate : startDate;

        const [rates, catalog, customers, sales, stats] = await Promise.all([
            getGlobalRates(),
            supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name'),
            supabase.from('customers').select('*').order('name'),
            salesQuery,
            supabase.from('sales_orders')
                .select('total_amount, balance_due, payment_status, payment_details')
                .gte('sale_date', `${startDate}T00:00:00`)
                .lte('sale_date', `${finalEndStats}T23:59:59`)
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

    async getReceivables(page = 0, limit = 50) {
        const start = page * limit;
        const end = start + limit - 1;

        const { data, count, error } = await supabase
            .from('sales_orders')
            .select('*, customers(name, phone)', { count: 'exact' })
            .gt('balance_due', 0)
            .neq('payment_status', 'Pagado')
            .order('sale_date', { ascending: true }) // Oldest debt first
            .range(start, end);

        if (error) throw error;
        return { sales: data, totalCount: count };
    },

    async registerSale(saleData) {
        /* 
          saleData expectation:
          {
            product_id, 
            product_name, 
            quantity,
            total_amount,
            amount_paid,
            payment_status,
            payment_details, 
            customer_id,
            delivery_date,
            sale_date // Custom backdate (optional)
          }
        */

        // Call the Atomic RPC function created in SQL Phase
        // Note: RPC uses NOW() for sale_date. We will patch it if saleData.sale_date is present.
        // Detect if Backdated (Sale Date < Today)
        const todayStr = new Date().toLocaleDateString('en-CA');
        const isBackdated = saleData.sale_date && saleData.sale_date.split('T')[0] < todayStr;

        if (isBackdated) {
            console.log("📅 Backdated sale detected. Bypassing stock check (Direct Insert).");

            // Calculate fields derived in RPC
            const balanceDue = saleData.total_amount - saleData.amount_paid;
            // Append time to sale_date if not present, to avoid T00:00:00 confusion?
            // saleData.sale_date comes as YYYY-MM-DD usually from controller default, 
            // but might be used as is. Let's ensure it has a time or default to 12:00.
            const finalDate = saleData.sale_date.includes('T')
                ? saleData.sale_date
                : `${saleData.sale_date}T${new Date().toLocaleTimeString('en-GB')}`; // Current time, selected date

            const payload = {
                product_id: saleData.product_id,
                product_name: saleData.product_name,
                quantity: saleData.quantity,
                total_amount: saleData.total_amount,
                amount_paid: saleData.amount_paid,
                balance_due: balanceDue,
                payment_status: saleData.payment_status,
                payment_details: saleData.payment_details,
                customer_id: saleData.customer_id,
                delivery_date: saleData.delivery_date || null,
                sale_date: finalDate,
                created_by: saleData.payment_details?.seller_info?.id || null // Track seller if present
            };

            const { data: insData, error: insError } = await supabase
                .from('sales_orders')
                .insert([payload])
                .select()
                .single();

            if (insError) {
                console.error("Direct Insert Error:", insError);
                throw insError;
            }

            return { success: true, new_sale_id: insData.id, message: "Venta histórica registrada (Sin impactar stock actual)" };
        }

        // --- NORMAL FLOW (Future/Today) -> Use RPC with Locking & Stock Check ---
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

    async registerCustomer({ name, phone, email, address }) {
        // 1. Check if exists by Name or Phone
        let query = supabase.from('customers').select('*').or(`name.eq.${name},phone.eq.${phone}`);
        const { data: existing } = await query;

        if (existing && existing.length > 0) {
            // Return the first match. Optionally update address if provided? 
            // Let's keep it simple: return existing. User can edit if needed.
            return existing[0];
        }

        const { data, error } = await supabase
            .from('customers')
            .insert([{ name, phone, email, address }])
            .select()
            .single();

        if (error) {
            console.error("DB Create Customer Error:", error);
            throw new Error("No se pudo crear el cliente.");
        }
        return data;
    },

    async updateCustomer(id, { name, phone, email, address }) {
        const { data, error } = await supabase
            .from('customers')
            .update({ name, phone, email, address })
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
