import { supabase } from '../../../core/supabase.js';

export const PurchasesService = {

    // ==========================================
    // PROVEEDORES (v2_suppliers)
    // ==========================================

    async getSuppliers() {
        try {
            const { data, error } = await supabase
                .from('v2_suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Service V2 Error fetching suppliers:', err);
            return [];
        }
    },

    async getSupplies() {
        try {
            const { data, error } = await supabase
                .from('v2_supplies')
                .select('id, name, measurement_unit')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Service V2 Error fetching supplies:', err);
            return [];
        }
    },

    async saveSupplier(supplierData) {
        try {
            let res;
            if (supplierData.id) {
                // Update
                res = await supabase
                    .from('v2_suppliers')
                    .update({
                        name: supplierData.name,
                        contact_info: supplierData.contact_info,
                        notes: supplierData.notes
                    })
                    .eq('id', supplierData.id)
                    .select();
            } else {
                // Insert
                res = await supabase
                    .from('v2_suppliers')
                    .insert([{
                        name: supplierData.name,
                        contact_info: supplierData.contact_info,
                        notes: supplierData.notes
                    }])
                    .select();
            }

            if (res.error) throw res.error;
            return { success: true, data: res.data[0] };
        } catch (err) {
            console.error('Service V2 Error saving supplier:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteSupplier(id) {
        try {
            const { error } = await supabase
                .from('v2_suppliers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // ==========================================
    // COMPRAS E INGRESO A INVENTARIO
    // ==========================================

    async getPurchases(startDate, endDate) {
        try {
            let query = supabase
                .from('v2_purchases')
                .select(`
                    *,
                    supplier:v2_suppliers(name),
                    items:v2_purchase_items(
                        *,
                        supply:v2_supplies(name, measurement_unit)
                    )
                `)
                .order('purchase_date', { ascending: false });

            if (startDate) query = query.gte('purchase_date', startDate);
            if (endDate) query = query.lte('purchase_date', endDate);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Service V2 Error fetching purchases:', err);
            return [];
        }
    },

    async registerPurchase(purchaseData) {
        const { supplier_id, purchase_date, document_type, document_number, total_usd, total_bs, items } = purchaseData;

        try {
            // 1. Crear Cabecera
            const { data: orderData, error: orderErr } = await supabase
                .from('v2_purchases')
                .insert([{
                    supplier_id,
                    purchase_date,
                    document_type,
                    document_number,
                    total_usd,
                    total_bs,
                    status: 'Procesada'
                }])
                .select()
                .single();

            if (orderErr) throw orderErr;
            const newPurchaseId = orderData.id;

            // 2. Crear Items e Inyectar Inventario
            const itemsPayload = [];
            const kardexPayload = [];

            for (const item of items) {
                // Preparar Detalle
                itemsPayload.push({
                    purchase_id: newPurchaseId,
                    supply_id: item.supply_id,
                    quantity: item.qty,
                    unit_price_usd: item.price,
                    subtotal_usd: item.total
                });

                // Obtener stock actual para el Kardex
                const { data: supData } = await supabase.from('v2_supplies').select('stock').eq('id', item.supply_id).single();
                const oldStock = supData?.stock || 0;
                const newStock = oldStock + parseFloat(item.qty);

                // Actualizar Insumo
                const { error: updErr } = await supabase
                    .from('v2_supplies')
                    .update({
                        stock: newStock,
                        last_price: item.price // Actualizamos el último precio de compra para recalcular recetas!
                    })
                    .eq('id', item.supply_id);

                if (updErr) throw updErr;

                // Preparar Kardex
                kardexPayload.push({
                    reference_id: newPurchaseId,
                    item_type: 'SUPPLY_ITEM',
                    item_id: item.supply_id,
                    transaction_type: 'PURCHASE',
                    quantity: item.qty,
                    old_stock: oldStock,
                    new_stock: newStock,
                    reason: `Ingreso por ${document_type} ${document_number || ''}`
                });
            }

            // Insertar Detalles
            const { error: itemsErr } = await supabase.from('v2_purchase_items').insert(itemsPayload);
            if (itemsErr) throw itemsErr;

            // Insertar Kardex
            const { error: kardexErr } = await supabase.from('v2_inventory_transactions').insert(kardexPayload);
            if (kardexErr) throw kardexErr;

            return { success: true };
        } catch (err) {
            console.error('Service V2 Error registering purchase:', err);
            return { success: false, error: err.message };
        }
    }
};
