/**
 * Servicio de Tasas y Configuración (Data Access Layer)
 * Único archivo autorizado para tocar la tabla Supabase de configuración en este módulo.
 */
import { supabase } from '../../../core/supabase.js';

export const SettingsService = {

    /**
     * Obtiene la tasa actual
     */
    async getRates() {
        try {
            // Asumimos estructura existente: id=1 es dolar, etc. o leemos 'settings_rates'
            // Adaptado según BD Focaccia: la tabla se llama 'settings_rates' normalmente.
            const { data, error } = await supabase
                .from('v2_settings_rates')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;
            return data; // { usd_to_ves: 40.50, eur_to_usd: 1.10, is_manual: false ... }
        } catch (err) {
            console.error('Service V2 Error fetching rates:', err);
            return null;
        }
    },

    /**
     * Actualiza la tasa manual
     */
    async updateManualRates(usdToVes, eurToUsd) {
        try {
            const { data, error } = await supabase
                .from('v2_settings_rates')
                .update({
                    usd_to_ves: usdToVes,
                    eur_to_usd: eurToUsd,
                    is_manual: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1)
                .select();

            if (error) throw error;

            // Historización opcional si existe la tabla
            await supabase.from('v2_rates_history').insert([{
                usd_to_ves: usdToVes, eur_to_usd: eurToUsd, is_manual: true, updated_by: 'V2_System'
            }]);

            return { success: true, data };
        } catch (err) {
            console.error('Service V2 Error updating rates:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Obtiene el historial de tasas
     */
    async getRatesHistory(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('v2_rates_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (err) {
            return [];
        }
    },

    /**
     * Sincroniza las tasas oficiales del BCV en tiempo real usando DolarAPI
     */
    async syncBCVRates() {
        try {
            // Hacemos las peticiones en paralelo (concurrencia) para que sea instantáneo
            const [usdRes, eurRes] = await Promise.all([
                fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
                fetch('https://ve.dolarapi.com/v1/euros/oficial')
            ]);

            if (!usdRes.ok || !eurRes.ok) {
                throw new Error("No se pudo conectar con DolarAPI. BCV inalcanzable temporalmente.");
            }

            const usdData = await usdRes.json();
            const eurData = await eurRes.json();

            // Los valores vienen en Bs. Necesitamos:
            // 1. Dólar en Bs (Directo)
            const usdToVes = usdData.promedio;

            // 2. Euro en Dólares (Matemática cruzada para facturas Focaccia)
            // Si 1 EUR = 42 Bs, y 1 USD = 40 Bs ---> 1 EUR = (42 / 40) USD
            const eurToUsd = eurData.promedio / usdData.promedio;

            return {
                success: true,
                usdRate: usdToVes.toFixed(4),
                eurRate: eurToUsd.toFixed(4) // 4 decimales para mayor precisión en compras internacionales
            };

        } catch (err) {
            console.error('Error sincronizando BCV:', err);
            return { success: false, error: err.message };
        }
    }
};
