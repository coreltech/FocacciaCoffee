/**
 * Servicio de Suministros (Data Access Layer V2)
 * Encapsula todo el CRUD de Materia Prima en Supabase.
 */
import { supabase } from '../../../core/supabase.js';

export const SuppliesService = {

    /**
     * Obtiene todos los suministros activos ordenados alfabéticamente
     */
    async getSupplies() {
        try {
            const { data, error } = await supabase
                .from('v2_supplies')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Service V2 Error fetching supplies:', err);
            return [];
        }
    },

    /**
     * Crea un nuevo suministro (Materia Prima)
     * Especial para la V2: Incluye validación métrica estricta
     */
    async createSupply(supplyData) {
        try {
            const { data, error } = await supabase
                .from('v2_supplies')
                .insert([{
                    name: supplyData.name.trim(),
                    category: supplyData.category,
                    measurement_unit: supplyData.measurement_unit, // vital para fórmula panadera (kg, l, un)
                    stock: parseFloat(supplyData.stock) || 0,
                    min_stock: parseFloat(supplyData.stock_min_units) || 0, // mapeo de form v1
                    last_price: parseFloat(supplyData.last_purchase_price) || 0, // En dólares
                    supplier_name: supplyData.supplier_name || ''
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Service V2 Error creating supply:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Actualiza un suministro existente
     */
    async updateSupply(id, supplyData) {
        try {
            const { data, error } = await supabase
                .from('v2_supplies')
                .update({
                    name: supplyData.name.trim(),
                    category: supplyData.category,
                    measurement_unit: supplyData.measurement_unit,
                    stock: parseFloat(supplyData.stock) || 0,
                    min_stock: parseFloat(supplyData.stock_min_units) || 0,
                    last_price: parseFloat(supplyData.last_purchase_price) || 0,
                    supplier_name: supplyData.supplier_name || ''
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Service V2 Error updating supply:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Elimina un suministro (o podría ser "soft delete" dependiendo de base de datos)
     */
    async deleteSupply(id) {
        try {
            const { error } = await supabase
                .from('v2_supplies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Service V2 Error deleting supply:', err);
            return { success: false, error: err.message };
        }
    }
};
