import { supabase } from '../../core/supabase.js';

/**
 * Servicio para gestión de proveedores y sus ubicaciones
 */
class SuppliersServiceImpl {

    /**
     * Obtiene todos los proveedores
     */
    async getAll() {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error obteniendo proveedores:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Obtiene un proveedor por ID con sus locations
     */
    async getById(id) {
        const { data: supplier, error: supplierError } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (supplierError) {
            console.error('Error obteniendo proveedor:', supplierError);
            throw supplierError;
        }

        // Obtener locations del proveedor
        const { data: locations, error: locationsError } = await supabase
            .from('supplier_locations')
            .select('*')
            .eq('supplier_id', id)
            .order('is_main', { ascending: false });

        if (locationsError) {
            console.error('Error obteniendo locations:', locationsError);
        }

        return {
            ...supplier,
            locations: locations || []
        };
    }

    /**
     * Crea un nuevo proveedor
     */
    async create(supplierData) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([{
                name: supplierData.name,
                tax_id: supplierData.tax_id
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creando proveedor:', error);
            throw error;
        }

        return data;
    }

    /**
     * Actualiza un proveedor
     */
    async update(id, supplierData) {
        const { data, error } = await supabase
            .from('suppliers')
            .update({
                name: supplierData.name,
                tax_id: supplierData.tax_id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando proveedor:', error);
            throw error;
        }

        return data;
    }

    /**
     * Elimina un proveedor (solo si no tiene compras)
     */
    async delete(id) {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando proveedor:', error);
            throw error;
        }
    }

    /**
     * Obtiene las locations de un proveedor
     */
    async getLocations(supplierId) {
        const { data, error } = await supabase
            .from('supplier_locations')
            .select('*')
            .eq('supplier_id', supplierId)
            .order('is_main', { ascending: false });

        if (error) {
            console.error('Error obteniendo locations:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Crea una nueva location para un proveedor
     */
    async createLocation(locationData) {
        const { data, error } = await supabase
            .from('supplier_locations')
            .insert([{
                supplier_id: locationData.supplier_id,
                location_name: locationData.location_name,
                address: locationData.address,
                city: locationData.city,
                state: locationData.state,
                postal_code: locationData.postal_code,
                is_main: locationData.is_main || false
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creando location:', error);
            throw error;
        }

        return data;
    }

    /**
     * Actualiza una location
     */
    async updateLocation(id, locationData) {
        const { data, error } = await supabase
            .from('supplier_locations')
            .update({
                location_name: locationData.location_name,
                address: locationData.address,
                city: locationData.city,
                state: locationData.state,
                postal_code: locationData.postal_code,
                is_main: locationData.is_main
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando location:', error);
            throw error;
        }

        return data;
    }

    /**
     * Elimina una location
     */
    async deleteLocation(id) {
        const { error } = await supabase
            .from('supplier_locations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando location:', error);
            throw error;
        }
    }

    /**
     * Busca proveedores por nombre o tax_id
     */
    async search(query) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .or(`name.ilike.%${query}%,tax_id.ilike.%${query}%`)
            .order('name');

        if (error) {
            console.error('Error buscando proveedores:', error);
            throw error;
        }

        return data || [];
    }
}

export const SuppliersService = new SuppliersServiceImpl();
