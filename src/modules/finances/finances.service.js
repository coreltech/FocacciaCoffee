import { supabase } from '../../core/supabase.js';

export const FinancesService = {
    // 1. Get Balance Sheet (Resumen)
    async getBalanceSheet(startDate = null, endDate = null) {
        // Fetch ALL capital entries (No DB filter, handle in memory for dual-purpose)
        const { data: capital, error: errCap } = await supabase
            .from('capital_entries')
            .select('*')
            .order('date', { ascending: false });

        if (errCap) throw errCap;

        // Fetch ALL expenses (No DB filter)
        const { data: expenses, error: errExp } = await supabase
            .from('investment_expenses')
            .select('*')
            .order('date', { ascending: false });

        if (errExp) throw errExp;

        // --- GLOBAL CALCULATIONS (All Time) ---
        const totalCapitalGlobal = capital.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpensesGlobal = expenses.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

        // Removed Sales Revenue from assumption based on user request to isolate Investment/Expenses
        const globalBalance = totalCapitalGlobal - totalExpensesGlobal;

        // --- FILTERING (Range) ---
        let filteredCap = capital;
        let filteredExp = expenses;

        if (startDate || endDate) {
            // Partial filter support
            filteredCap = capital.filter(c => {
                const afterStart = !startDate || c.date >= startDate;
                const beforeEnd = !endDate || c.date <= endDate;
                return afterStart && beforeEnd;
            });
            filteredExp = expenses.filter(e => {
                const afterStart = !startDate || e.date >= startDate;
                const beforeEnd = !endDate || e.date <= endDate;
                return afterStart && beforeEnd;
            });
        }

        const totalExpensesRange = filteredExp.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
        const totalCapitalRange = filteredCap.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        return {
            totalCapital: totalCapitalGlobal,  // Keep Global for "Capital Ingresado" card (usually static fund)
            totalCapitalRange,                 // Available if needed

            totalExpensesGlobal,               // Available if needed
            totalExpensesRange,                // For "Total Ejecutado / Gastos" card (Contextual)

            balance: globalBalance,            // For "Capital Disponible" card (Must be actual cash on hand)

            capitalList: filteredCap,
            expensesList: filteredExp
        };
    },

    // 2. Add Capital
    async addCapitalEntry(entry) {
        /* entry: { amount, source, notes, date } */
        const { data, error } = await supabase
            .from('capital_entries')
            .insert([entry])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Register Expense (Invoice)
    async registerExpense(expenseData) {
        /* expenseData: { date, provider, invoice_number, total_amount, items, category } */
        const { data, error } = await supabase
            .from('investment_expenses')
            .insert([expenseData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 4. Delete Entry (Optional, for correction)
    async deleteCapitalEntry(id) {
        return await supabase.from('capital_entries').delete().eq('id', id);
    },

    async deleteExpense(id) {
        return await supabase.from('investment_expenses').delete().eq('id', id);
    }
};
