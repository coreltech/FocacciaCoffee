import { supabase } from '../../core/supabase.js';
import { getGlobalRates } from '../settings/settings.service.js';

export const AdminService = {
    async getRates() {
        return await getGlobalRates();
    },

    async getAssets() {
        const { data } = await supabase.from('assets_inventory').select('*').order('purchase_date', { ascending: false });
        return data || [];
    },

    async getExpenses() {
        const { data } = await supabase.from('operational_expenses').select('*').order('expense_date', { ascending: false }).limit(20);
        return data || [];
    },

    async saveAsset(asset) {
        const { error } = await supabase.from('assets_inventory').insert([asset]);
        if (error) throw error;
    },

    async saveExpense(expense) {
        const { error } = await supabase.from('operational_expenses').insert([expense]);
        if (error) throw error;
    },

    async deleteExpense(id) {
        const { error } = await supabase.from('operational_expenses').delete().eq('id', id);
        if (error) throw error;
    },

    // --- CAPITAL CONTRIBUTIONS ---
    async getContributions() {
        const { data } = await supabase.from('capital_contributions').select('*').order('contribution_date', { ascending: false }).limit(50);
        return data || [];
    },

    async saveContribution(contribution) {
        const { error } = await supabase.from('capital_contributions').insert([contribution]);
        if (error) throw error;
    },

    async deleteContribution(id) {
        const { error } = await supabase.from('capital_contributions').delete().eq('id', id);
        if (error) throw error;
    }
};
