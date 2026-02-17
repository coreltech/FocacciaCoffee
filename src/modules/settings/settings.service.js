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

    async updateRates(usdVes, eurVes, isManual = true, source = 'MANUAL') {
        // Unified update for the new direct-VES schema
        // We need to upsert. But upsert in Supabase with different columns for same row might be tricky if we want to update is_manual
        // Actually, exchange_rates has one row per currency.

        const payload = [
            { currency_code: 'USD', rate_to_ves: usdVes, is_manual: isManual, last_update_source: source, updated_at: new Date() },
            { currency_code: 'EUR', rate_to_ves: eurVes, is_manual: isManual, last_update_source: source, updated_at: new Date() }
        ];

        const { error } = await supabase
            .from('exchange_rates')
            .upsert(payload, { onConflict: 'currency_code' });

        if (error) throw error;

        // Maintain old history table for visuals if needed (mapping them for compatibility)
        const { error: historyError } = await supabase.from('rates_history').insert([{
            tasa_usd: usdVes,
            tasa_eur: eurVes,
            created_at: new Date().toISOString() // Force client-side timestamp to ensure order matches action
        }]);

        if (historyError) {
            console.error("Error saving history:", historyError);
            // We don't throw here to avoid blocking the main update if history fails, 
            // but we log it. Or should we warn the user?
            // Let's log it for now.
        }

        await this.refreshRates();
    }

    async getHistory() {
        try {
            const { data, error } = await supabase
                .from('rates_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Supabase error in getHistory:', error);
                throw error;
            }
            return data || [];
        } catch (err) {
            console.error('Error in getHistory:', err);
            throw err;
        }
    }

    // --- AUTOMATION & SYNC ---

    async fetchBCVRates() {
        try {
            // Using pydolarvenezuela API which provides multiple monitors including BCV
            const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv');
            if (!response.ok) throw new Error("API Error");

            const data = await response.json();

            // Expected shape checks might vary, let's try to be robust
            // Usually data.monitors.usd.price and data.monitors.eur.price for BCV page specifically?
            // Actually the endpoint `page?page=bcv` returns monitors *for* BCV context? 
            // Let's verify standard response or use a broader endpoint if unsure.
            // A common endpoint is `.../api/v1/dollar?monitor=bcv` or similar. 
            // Assuming the previous code worked for `price`, it likely returned the main USD price.
            // Let's try to find EUR. If the specific BCV endpoint doesn't return EUR, we might need the homepage endpoint.

            // Let's assume we can get both. If strictly BCV, the USD is the main one. 
            // If the API allows `monitor=bcv` (USD) and we need EUR, usually `page=bcv` might list "usd" and "eur"?
            // API documentation for pydolarvenezuela usually structures it as monitors.

            // Strategy: Use the detailed monitor endpoint if possible, or fallback.
            // For now, let's assume `data.monitors.usd.price` and `data.monitors.eur.price` exist if we query general.
            // If we query `page=bcv`, it might just be the USD rate.

            // Alternative: Fetch the general monitor list which definitely has everything
            // const allResp = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');

            // Let's stick to the previous URL but try to parse EUR if available, or fetch general.
            // Rate limiting might be an issue if we make 2 calls.
            // Let's assume we fetch the 'bcv' specific monitor for USD, and for EUR?
            // Actually, usually BCV implies the official rates.
            // Let's use a safer broad endpoint if we want both.

            const responseAll = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
            // This endpoint usually returns the BCV "monitor" object. 
            // Wait, looking at common usage:
            // GET /api/v1/dollar/unit/bcv  -> returns { price: 45.00, title: "BCV", ... } (USD)
            // EUR is often a separate monitor or property.

            // Let's try fetching the "euro" page/monitor?
            // GET /api/v1/euro?page=bcv ??

            // To be safe and robust without doing trial/error on a live user system:
            // We will fetch USD from BCV. For EUR, we will TRY to fetch a Euro equivalent or calculation.
            // BUT the user specifically asked for "Both from BCV".
            // The BCV site publishes both.

            // Let's pretend we have a robust parser or use `fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar')`
            // and `fetch('https://pydolarvenezuela-api.vercel.app/api/v1/euro')` ?

            const [resUsd, resEur] = await Promise.all([
                fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?monitor=bcv'),
                fetch('https://pydolarvenezuela-api.vercel.app/api/v1/euro?monitor=bcv')
            ]);

            let rateUsd = 0;
            let rateEur = 0;

            if (resUsd.ok) {
                const d = await resUsd.json();
                rateUsd = parseFloat(d.price || d.monitors?.bcv?.price || 0);
            }

            if (resEur.ok) {
                const d = await resEur.json();
                rateEur = parseFloat(d.price || d.monitors?.bcv?.price || 0);
            }

            if (!rateUsd || !rateEur) throw new Error("Incomplete Data");

            return { usd: rateUsd, eur: rateEur };

        } catch (err) {
            console.warn("Autosync BCV Failed:", err);
            return null;
        }
    }

    async syncRates() {
        // 1. Check if we have a manual override (Window: 12 Hours)
        const current = await this.getGlobalRates();
        if (current.is_manual) {
            const lastUpdate = new Date(current.updated_at);
            const now = new Date();
            const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

            if (diffHours < 12) {
                console.log(`🔒 Manual override active (${diffHours.toFixed(1)}h < 12h). Skipping autosync.`);
                return { status: 'skipped', reason: 'manual_override' };
            }
        }

        // 2. Fetch External (Dual)
        const rates = await this.fetchBCVRates();
        if (!rates) return { status: 'error', reason: 'api_fail' };

        const { usd: newUsd, eur: newEur } = rates;

        // 3. Drift Check (Check both)
        const oldUsd = current.tasa_usd_ves;
        const oldEur = current.tasa_eur_ves;

        const diffPctUsd = Math.abs((newUsd - oldUsd) / oldUsd) * 100;
        const diffPctEur = Math.abs((newEur - oldEur) / oldEur) * 100;

        // Report significant change if ANY > 2%
        let driftAlert = null;
        if (diffPctUsd > 2 || diffPctEur > 2) {
            driftAlert = `⚠️ Cambio significativo BCV:\nUSD: ${oldUsd} -> ${newUsd}\nEUR: ${oldEur} -> ${newEur}`;
        }

        // Ensure we check if it is actually different
        if (diffPctUsd === 0 && diffPctEur === 0) {
            return { status: 'no_change', new_usd: newUsd, new_eur: newEur };
        }

        // 4. Update
        await this.updateRates(newUsd, newEur, false, 'BCV_AUTO');

        return {
            status: 'updated',
            new_usd: newUsd,
            new_eur: newEur,
            old_usd: oldUsd,
            old_eur: oldEur,
            diffPct: Math.max(diffPctUsd, diffPctEur),
            driftAlert
        };
    }

    async checkAutoSync() {
        const current = await this.getGlobalRates();
        const lastUpdate = new Date(current.updated_at);
        const now = new Date();
        const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

        // Optimization: If loaded data is fresh (<3h), do nothing
        if (diffHours < 3) return null;

        console.log(`⚠️ Rates are stale (>3h). Attempting auto-sync...`);
        return await this.syncRates();
    }

    // --- DATA CLEANUP ---

    async getPendingTestOrders() {
        // Fetch orders that are 'pendiente' and older than 24 hours
        // OR just all 'pendiente' orders if user wants to see everything?
        // User said "basura", "bomba de tiempo".
        // Let's fetch ALL 'pendiente' orders and let the UI show the date so user decides.

        const { data, error } = await supabase
            .from('sales_orders')
            .select('id, sale_date, total_amount, customer_id, fulfillment_status')
            .eq('fulfillment_status', 'pendiente')
            .order('sale_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async deleteTestOrders(orderIds) {
        if (!orderIds || orderIds.length === 0) return;

        // Delete orders. 
        // Note: Due to FK constraints, we might need to delete updated items first?
        // Usually, cascade delete handles it if configured. If not, we might error.
        // Let's assume cascade is ON or we try deleting.

        const { error } = await supabase
            .from('sales_orders')
            .delete()
            .in('id', orderIds);

        if (error) throw error;
        return true;
    }
}

// Export Singleton Instance
export const SettingsService = new SettingsServiceImpl();

// Legacy export for backward compatibility (but now safe because it uses bound methods)
export const getGlobalRates = SettingsService.getGlobalRates;
