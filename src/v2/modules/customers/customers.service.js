/**
 * Servicio de Clientes (Data Access Layer V2)
 */
import { supabase } from '../../../core/supabase.js';

export const CustomersService = {

    /**
     * Obtiene todos los clientes
     */
    async getCustomers() {
        try {
            const { data, error } = await supabase
                .from('v2_customers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Service V2 Error fetching customers:', err);
            return [];
        }
    },

    /**
     * Crea un nuevo cliente
     */
    async createCustomer(customerData) {
        try {
            const { data, error } = await supabase
                .from('v2_customers')
                .insert([{
                    name: customerData.name.trim(),
                    phone: customerData.phone || '',
                    address: customerData.address || '',
                    email: customerData.email || ''
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Service V2 Error creating customer:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Actualiza un cliente
     */
    async updateCustomer(id, customerData) {
        try {
            const { error } = await supabase
                .from('v2_customers')
                .update({
                    name: customerData.name.trim(),
                    phone: customerData.phone,
                    address: customerData.address,
                    email: customerData.email
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Service V2 Error updating customer:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Elimina un cliente
     */
    async deleteCustomer(id) {
        try {
            const { error } = await supabase
                .from('v2_customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Service V2 Error deleting customer:', err);
            return { success: false, error: err.message };
        }
    }
};
