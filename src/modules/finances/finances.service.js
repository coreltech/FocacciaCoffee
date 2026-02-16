import { supabase } from '../../core/supabase.js';

export const FinancesService = {
    // 1. Get Balance Sheet (Resumen)
    async getBalanceSheet(startDate = null, endDate = null) {
        // Fetch all capital entries (Optional: Apply filter here too if needed, but request specified expenses)
        let queryCap = supabase
            .from('capital_entries')
            .select('*')
            .order('date', { ascending: false });

        if (startDate && endDate) {
            queryCap = queryCap.gte('date', startDate).lte('date', endDate);
        }

        const { data: capital, error: errCap } = await queryCap;

        if (errCap) throw errCap;

        // Fetch expenses with filter
        let queryExp = supabase
            .from('investment_expenses')
            .select('*')
            .order('date', { ascending: false });

        if (startDate && endDate) {
            queryExp = queryExp.gte('date', startDate).lte('date', endDate);
        }

        const { data: expenses, error: errExp } = await queryExp;

        if (errExp) throw errExp;

        // Calculate Totals
        const totalCapital = capital.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);

        // Removed Sales Revenue from assumption based on user request to isolate Investment/Expenses
        const balance = totalCapital - totalExpenses;

        return {
            totalCapital,
            totalExpenses,
            balance,
            capitalList: capital,
            expensesList: expenses
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
