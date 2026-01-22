import { supabase } from '../../core/supabase.js';
import { SettingsService } from '../settings/settings.service.js';

/**
 * Servicio para gestión de compras
 */
class PurchasesServiceImpl {

    /**
     * Obtiene todas las compras
     */
    async getAll() {
        const { data, error } = await supabase
            .from('purchases')
            .select(`
                *,
                supplier:suppliers(name),
                location:supplier_locations(address, city)
            `)
            .order('purchase_date', { ascending: false });

        if (error) {
            console.error('Error obteniendo compras:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Obtiene una compra por ID con sus items
     */
    async getById(id) {
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .select(`
                *,
                supplier:suppliers(name, tax_id),
                location:supplier_locations(address, city, state)
            `)
            .eq('id', id)
            .single();

        if (purchaseError) {
            console.error('Error obteniendo compra:', purchaseError);
            throw purchaseError;
        }

        // Obtener items de la compra
        const { data: items, error: itemsError } = await supabase
            .from('purchase_items')
            .select(`
                *,
                supply:supplies(name, unit)
            `)
            .eq('purchase_id', id);

        if (itemsError) {
            console.error('Error obteniendo items:', itemsError);
        }

        return {
            ...purchase,
            items: items || []
        };
    }

    /**
     * Crea una nueva compra con sus items
     */
    async create(purchaseData) {
        // Obtener tasa BCV actual si no se proporciona
        let bcvRate = purchaseData.bcv_rate;
        if (!bcvRate) {
            const rates = await SettingsService.getGlobalRates();
            bcvRate = rates.tasa_usd_ves;
        }

        // Calcular totales
        const totalUsd = purchaseData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_price_usd);
        }, 0);

        const totalBs = totalUsd * bcvRate;

        console.log('🛠️ [Service] Creating Purchase:', { ...purchaseData, calculatedTotalUsd: totalUsd });

        // Crear la compra
        const purchaseInsertPayload = {
            supplier_id: purchaseData.supplier_id,
            location_id: purchaseData.location_id,
            document_type: purchaseData.document_type,
            document_number: purchaseData.document_number,
            purchase_date: purchaseData.purchase_date || new Date().toISOString(),
            bcv_rate: bcvRate,
            total_usd: totalUsd,
            total_bs: totalBs,
            notes: purchaseData.notes
        };

        console.log("Dato enviado a DB:", purchaseInsertPayload.document_type);

        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([purchaseInsertPayload])
            .select()
            .single();

        if (purchaseError) {
            console.error('Error creando compra:', purchaseError);
            throw purchaseError;
        }

        // Crear los items
        const itemsToInsert = purchaseData.items.map(item => ({
            purchase_id: purchase.id,
            supply_id: item.supply_id,
            brand_description: item.brand_description,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            subtotal_usd: item.quantity * item.unit_price_usd,
            unit_price_ves: item.unit_price_usd * bcvRate,
            subtotal_ves: (item.quantity * item.unit_price_usd) * bcvRate,
            total_item_ves: (item.quantity * item.unit_price_usd) * bcvRate
        }));

        const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creando items:', itemsError);
            // Intentar eliminar la compra si falló la creación de items
            await supabase.from('purchases').delete().eq('id', purchase.id);
            throw itemsError;
        }

        return purchase;
    }

    /**
     * Actualiza una compra existente
     */
    async update(id, purchaseData) {
        // Calcular totales nuevos
        const totalUsd = purchaseData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_price_usd);
        }, 0);

        const totalBs = totalUsd * purchaseData.bcv_rate;

        console.log('🛠️ [Service] Updating Purchase:', { id, ...purchaseData, calculatedTotalUsd: totalUsd });

        // 1. Actualizar cabecera de la compra
        const purchaseUpdatePayload = {
            supplier_id: purchaseData.supplier_id,
            location_id: purchaseData.location_id,
            document_type: purchaseData.document_type,
            document_number: purchaseData.document_number,
            purchase_date: purchaseData.purchase_date,
            bcv_rate: purchaseData.bcv_rate,
            total_usd: totalUsd,
            total_bs: totalBs,
            notes: purchaseData.notes
        };

        console.log("Dato enviado a DB (Update):", purchaseUpdatePayload.document_type);

        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .update(purchaseUpdatePayload)
            .eq('id', id)
            .select()
            .single();

        if (purchaseError) {
            console.error('Error actualizando compra:', purchaseError);
            throw purchaseError;
        }

        // 2. Gestionar Items: Borrar anteriores y crear nuevos
        // (El trigger manejará el ajuste de stock al borrar y al insertar)
        // Nota: Idealmente deberíamos comparar y actualizar solo diferencias, 
        // pero borrar e insertar es más seguro para integridad con los triggers actuales.

        // borrar items anteriores
        const { error: deleteError } = await supabase
            .from('purchase_items')
            .delete()
            .eq('purchase_id', id);

        if (deleteError) {
            console.error('Error borrando items antiguos:', deleteError);
            throw deleteError;
        }

        // Insertar items actualizados
        const itemsToInsert = purchaseData.items.map(item => ({
            purchase_id: id,
            supply_id: item.supply_id,
            brand_description: item.brand_description,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            subtotal_usd: item.quantity * item.unit_price_usd,
            unit_price_ves: item.unit_price_usd * purchaseData.bcv_rate,
            subtotal_ves: (item.quantity * item.unit_price_usd) * purchaseData.bcv_rate,
            total_item_ves: (item.quantity * item.unit_price_usd) * purchaseData.bcv_rate
        }));

        const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error insertando nuevos items:', itemsError);
            throw itemsError;
        }

        return purchase;
    }

    /**
     * Obtiene todos los supplies disponibles
     */
    async getSupplies() {
        const { data, error } = await supabase
            .from('supplies')
            .select('id, name, unit, current_stock, unit_cost, equivalence, purchase_unit')
            .order('name');

        if (error) {
            console.error('Error obteniendo supplies:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Obtiene el historial de compras de un supply específico
     */
    async getSupplyPurchaseHistory(supplyId) {
        const { data, error } = await supabase
            .from('purchase_items')
            .select(`
                *,
                purchase:purchases(
                    purchase_date,
                    supplier:suppliers(name),
                    bcv_rate
                )
            `)
            .eq('supply_id', supplyId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error obteniendo historial:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Obtiene estadísticas de compras
     */
    async getStats(startDate, endDate) {
        let query = supabase
            .from('purchases')
            .select('total_usd, total_bs, purchase_date');

        if (startDate) {
            query = query.gte('purchase_date', startDate);
        }
        if (endDate) {
            query = query.lte('purchase_date', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }

        const totalUsd = data.reduce((sum, p) => sum + parseFloat(p.total_usd || 0), 0);
        const totalBs = data.reduce((sum, p) => sum + parseFloat(p.total_bs || 0), 0);
        const count = data.length;

        return {
            totalUsd,
            totalBs,
            count,
            averageUsd: count > 0 ? totalUsd / count : 0
        };
    }
}

export const PurchasesService = new PurchasesServiceImpl();
