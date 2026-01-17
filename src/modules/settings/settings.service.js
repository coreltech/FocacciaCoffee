import { supabase } from '../../core/supabase.js';

class SettingsServiceImpl {
    constructor() {
        this.cachedRates = null;
        this.subscribers = [];
        this.initPromise = null;

        // Bind methods to ensure 'this' context is preserved even if destructured
        this.getGlobalRates = this.getGlobalRates.bind(this);
        this.refreshRates = this.refreshRates.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.notifySubscribers = this.notifySubscribers.bind(this);
        this.updateRates = this.updateRates.bind(this);
        this.getHistory = this.getHistory.bind(this);
    }

    /**
     * Initializes the service by performing the first fetch.
     * Returns a promise that resolves when rates are ready.
     * Safe to call multiple times.
     */
    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.refreshRates().then(rates => {
            console.log("✅ SettingsService Initialized", rates);
            return rates;
        }).catch(err => {
            console.error("❌ Stats Init Failed", err);
            // Fallback to emergency if offline
            this.cachedRates = { tasa_usd_ves: 321.0323, tasa_eur_ves: 375.31 };
            return this.cachedRates;
        });

        return this.initPromise;
    }

    async getGlobalRates() {
        // If never initialized, try to init (Guard)
        if (!this.cachedRates && !this.initPromise) {
            await this.init();
        } else if (this.initPromise) {
            await this.initPromise;
        }

        return this.cachedRates || { tasa_usd_ves: 321.0323, tasa_eur_ves: 375.31 };
    }

    async refreshRates() {
        // Fetch from the NEW modern exchange_rates table (Direct VES rates)
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('currency_code, rate_to_ves');

        if (error) {
            console.error("Error obteniendo tasas:", error);
            const fallback = { tasa_usd_ves: 43.50, tasa_eur_ves: 46.80 };
            return this.cachedRates || fallback;
        }

        // Standardized mapped data (Now everything is relative to VES)
        const usdRate = data.find(r => r.currency_code === 'USD')?.rate_to_ves || 43.50;
        const eurRate = data.find(r => r.currency_code === 'EUR')?.rate_to_ves || 46.80;

        const mappedData = {
            tasa_usd_ves: usdRate,
            tasa_eur_ves: eurRate,
            updated_at: new Date().toISOString()
        };

        const hasChanged = !this.cachedRates ||
            this.cachedRates.tasa_usd_ves !== mappedData.tasa_usd_ves ||
            this.cachedRates.tasa_eur_ves !== mappedData.tasa_eur_ves;

        this.cachedRates = mappedData;

        if (hasChanged) {
            this.notifySubscribers(mappedData);
        }

        return mappedData;
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        // Immediately notify with current data if available
        if (this.cachedRates) callback(this.cachedRates);
    }

    notifySubscribers(data) {
        this.subscribers.forEach(cb => {
            try { cb(data); } catch (e) { console.error(e); }
        });
    }

    async updateRates(usdVes, eurVes) {
        // Unified update for the new direct-VES schema
        const payload = [
            { currency_code: 'USD', rate_to_ves: usdVes },
            { currency_code: 'EUR', rate_to_ves: eurVes }
        ];

        const { error } = await supabase
            .from('exchange_rates')
            .upsert(payload, { onConflict: 'currency_code' });

        if (error) throw error;

        // Maintain old history table for visuals if needed (mapping them for compatibility)
        await supabase.from('rates_history').insert([{
            tasa_usd: usdVes,
            tasa_eur: eurVes
        }]);

        await this.refreshRates();
    }

    async getHistory() {
        try {
            const { data, error } = await supabase
                .from('rates_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Supabase error in getHistory:', error);
                throw error;
            }

            console.log('History fetched:', data);
            return data || [];
        } catch (err) {
            console.error('Error in getHistory:', err);
            throw err;
        }
    }
}

// Export Singleton Instance
export const SettingsService = new SettingsServiceImpl();

// Legacy export for backward compatibility (but now safe because it uses bound methods)
export const getGlobalRates = SettingsService.getGlobalRates;
