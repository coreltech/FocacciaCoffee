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

    async getReceivables(page = 0, limit = 50, startDate = null, endDate = null) {
        const start = page * limit;
        const end = start + limit - 1;

        // Correct Logic: Fetch ALL relevant sales to allow filtering in frontend (Paid vs Unpaid)
        // We order by balance_due DESC so debts appear first if mixed, or we can rely on frontend sorting.

        let query = supabase
            .from('sales_orders')
            .select('*, customers(name, phone)', { count: 'exact' });
        // Removed .gt('balance_due', 0) to include SOLVENT customers
        // Removed .neq('payment_status', 'Pagado') 

        if (startDate) {
            const finalEnd = endDate || startDate;
            query = query
                .gte('sale_date', `${startDate}T00:00:00`)
                .lte('sale_date', `${finalEnd}T23:59:59`);
        } else {
            // If no date, maybe we only want Debt? 
            // "Cuentas por Cobrar" implies debts. 
            // But the user wants to see "Solvencias" too.
            // If no date is passed, we probably should load EVERYTHING? Or maybe just debts + recent solvencies?
            // For now, let's load everything but limited by pagination.
            // Default to "Show me debts" if no date? 
            // Actually, the view passes dates or defaults to today.
        }

        const { data, count, error } = await query
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
                sale_date: finalDate
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

        // --- NEW: WEEKLY RESERVATION LOGIC (Pre-order) ---
        // If delivery_date is in the future (> Today), we treat it as a "Pre-order".
        // We bypass the atomic stock check because the items will be produced later (on Thursday/Friday).

        let isPreorder = false;
        if (saleData.delivery_date) {
            const delivery = new Date(saleData.delivery_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Delivery must be strictly after today (tomorrow onwards)
            // Parsing YYYY-MM-DD correctly
            const dParts = saleData.delivery_date.split('-');
            const deliveryDate = new Date(dParts[0], dParts[1] - 1, dParts[2]);

            if (deliveryDate > today) {
                isPreorder = true;
            }
        }

        if (isPreorder) {
            console.log("🚀 Pre-order detected. Bypassing stock check (Direct Insert).");
            const payload = {
                product_id: saleData.product_id,
                product_name: saleData.product_name,
                quantity: saleData.quantity,
                total_amount: saleData.total_amount,
                amount_paid: saleData.amount_paid,
                balance_due: (saleData.total_amount - saleData.amount_paid),
                payment_status: saleData.payment_status,
                payment_details: saleData.payment_details,
                customer_id: saleData.customer_id,
                delivery_date: saleData.delivery_date,
                sale_date: new Date().toISOString() // Recorded today
            };

            const { data: insData, error: insError } = await supabase
                .from('sales_orders')
                .insert([payload])
                .select()
                .single();

            if (insError) throw insError;
            return { success: true, new_sale_id: insData.id, message: "Reserva registrada (Producción pendiente)" };
        }

        // --- NORMAL FLOW (Immediate Stock Deduction via Client-Side Logic) ---
        // FALLBACK: Bypassing strict checks to prevent business stoppage.

        let currentStock = 0;
        let newStock = 0;
        let stockCheckFailed = false;

        // 1. Check & Lock Stock (Soft Check)
        // If this fails, we LOG it but DO NOT STOP the sale.
        try {
            if (saleData.product_id) {
                const { data: prodData, error: prodError } = await supabase
                    .from('sales_prices')
                    .select('stock_disponible')
                    .eq('id', saleData.product_id)
                    .single();

                if (prodError || !prodData) {
                    console.warn("⚠️ Stock Check Warning: Product not found or error. Assuming infinite stock.", prodError);
                    stockCheckFailed = true;
                } else {
                    currentStock = parseFloat(prodData.stock_disponible || 0);

                    // Only block if we truly know stock < quantity
                    if (currentStock < saleData.quantity) {
                        // Even here, maybe we should allow it?
                        // User said "Product not found" error, not "Insufficient Stock".
                        // So let's keep strictness ONLY if we successfully found the product.
                        throw new Error(`STOCK_INSUFICIENTE: Stock actual: ${currentStock}, Solicitado: ${saleData.quantity}`);
                    }
                }
            } else {
                // Manual sale or missing ID
                stockCheckFailed = true;
            }
        } catch (e) {
            if (e.message.includes('STOCK_INSUFICIENTE')) {
                throw e; // Respect genuine stock limits
            }
            console.warn("⚠️ Stock Check Exception bypassed:", e);
            stockCheckFailed = true;
        }

        // 2. Deduct Stock (Only if we successfully checked it)
        if (!stockCheckFailed && saleData.product_id) {
            newStock = currentStock - saleData.quantity;
            const { error: stockUpdError } = await supabase
                .from('sales_prices')
                .update({ stock_disponible: newStock })
                .eq('id', saleData.product_id);

            if (stockUpdError) {
                console.error("⚠️ Error deducting stock (sale will proceed):", stockUpdError);
            }
        }

        // 3. Insert Sale
        const v_order_group_id = crypto.randomUUID();

        const payload = {
            sale_date: new Date().toISOString(),
            delivery_date: saleData.delivery_date || null,
            customer_id: saleData.customer_id,
            total_amount: saleData.total_amount,
            amount_paid: saleData.amount_paid,
            balance_due: (saleData.total_amount - saleData.amount_paid),
            payment_status: saleData.payment_status,
            payment_details: { ...saleData.payment_details, order_group: v_order_group_id, is_preorder: false },
            product_id: saleData.product_id,
            product_name: saleData.product_name,
            quantity: saleData.quantity
        };

        const { data: insData, error: insError } = await supabase
            .from('sales_orders')
            .insert([payload])
            .select()
            .single();

        if (insError) {
            // CRITICAL: If insert fails, we really can't do anything.
            // Try to rollback stock if we deducted it?
            if (!stockCheckFailed && saleData.product_id) {
                await supabase.from('sales_prices').update({ stock_disponible: currentStock }).eq('id', saleData.product_id);
            }
            console.error("Sale Insert Failed:", insError);
            throw new Error("Error guardando venta: " + insError.message);
        }

        // 4. Log Transaction
        if (saleData.product_id) {
            await supabase.from('inventory_transactions').insert([{
                product_id: saleData.product_id,
                transaction_type: 'VENTA MOSTRADOR',
                quantity: saleData.quantity,
                old_stock: currentStock,
                new_stock: (!stockCheckFailed ? newStock : currentStock),
                reference_id: insData.id,
                reason: stockCheckFailed ? 'Venta (Stock Check Failed)' : 'Venta directa'
            }]);
        }

        return { success: true, sale_id: insData.id };
    },

    async deleteSale(saleId) {
        return await supabase.from('sales_orders').delete().eq('id', saleId);
    },

    async confirmPendingPayment(saleId, amount) {
        // Legacy method, now forwards to partial with full amount? 
        // Or we keep it for "Mark as Paid" quick actions.
        // Let's update it to set full payment.
        return await supabase.from('sales_orders')
            .update({
                payment_status: 'Pagado',
                amount_paid: amount,
                amount_paid_usd: amount,
                balance_due: 0,
                payment_date: new Date().toISOString() // Set Cash Flow Date
            })
            .eq('id', saleId);
    },

    async registerPartialPayment(saleId, amountUSD, currentRate) {
        // 1. Get current sale data
        const { data: sale, error } = await supabase.from('sales_orders').select('total_amount, amount_paid_usd').eq('id', saleId).single();
        if (error) throw error;

        // 2. Calculate new totals
        const previousPaid = parseFloat(sale.amount_paid_usd || 0);
        const newPaid = previousPaid + amountUSD;
        let balance = sale.total_amount - newPaid;

        // Precision fix
        if (balance < 0.01) balance = 0;

        const status = balance === 0 ? 'Pagado' : 'Pendiente';

        // 3. Update
        const updatePayload = {
            amount_paid_usd: newPaid,
            balance_due: balance,
            payment_status: status
        };

        if (status === 'Pagado') {
            updatePayload.payment_date = new Date().toISOString();
        }

        const { data, error: updateError } = await supabase.from('sales_orders')
            .update(updatePayload)
            .eq('id', saleId)
            .select()
            .single();

        if (updateError) throw updateError;
        return data;
    },

    async registerCustomer({ name, phone, email, address }) {
        // 1. Check if exists by Name or Phone (if provided)
        let query = supabase.from('customers').select('*');

        // Build OR condition carefully
        const conditions = [`name.eq.${name}`];
        if (phone && phone.trim().length > 0) {
            conditions.push(`phone.eq.${phone}`);
        }

        query = query.or(conditions.join(','));

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
    },

    async getUpcomingReservations() {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('sales_orders')
            .select('delivery_date, product_name, quantity, payment_status, customers(name)')
            .gte('delivery_date', today)
            .order('delivery_date', { ascending: true });

        if (error) throw error;

        // Aggregate by Date -> Product
        const grouped = {};

        data.forEach(item => {
            const date = item.delivery_date;
            if (!date) return; // Should not happen given the query, but safety first

            if (!grouped[date]) grouped[date] = { items: {}, details: [] };

            // Count Totals
            const prod = item.product_name || "Producto Desconocido";
            if (!grouped[date].items[prod]) grouped[date].items[prod] = 0;
            // Force number conversation to avoid string concatenation or nulls
            const qty = parseFloat(item.quantity) || 0;
            grouped[date].items[prod] += qty;

            // Keep track of individual orders for detail view if needed later
            grouped[date].details.push({
                customer: item.customers?.name || "Cliente Genérico",
                product: prod,
                qty: item.quantity,
                status: item.payment_status
            });
        });

        return grouped;
    }
};
