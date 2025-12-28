import { supabase } from '../supabase.js';

export async function getLatestRates() {
    const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return { ves_per_usd: 1, ves_per_eur: 1 }; // Fallback
    return data;
}

/**
 * Convierte cualquier monto a la moneda destino
 * @param {number} amount - Monto original
 * @param {string} from - Moneda origen (USD, EUR, VES)
 * @param {string} to - Moneda destino (USD, EUR, VES)
 */
export async function convert(amount, from, to) {
    if (from === to) return amount;
    const rates = await getLatestRates();

    // 1. Convertir todo a VES (Base)
    let amountInVES;
    if (from === 'VES') amountInVES = amount;
    else if (from === 'USD') amountInVES = amount * rates.ves_per_usd;
    else if (from === 'EUR') amountInVES = amount * rates.ves_per_eur;

    // 2. De VES a la moneda destino
    if (to === 'VES') return amountInVES;
    if (to === 'USD') return amountInVES / rates.ves_per_usd;
    if (to === 'EUR') return amountInVES / rates.ves_per_eur;
}