import { supabase } from '../../core/supabase.js';

export const FinancesService = {
    // 1. Get Balance Sheet (Resumen)
    async getBalanceSheet() {
        // Fetch all capital entries
        const { data: capital, error: errCap } = await supabase
            .from('capital_entries')
            .select('*')
            .order('date', { ascending: false });

        if (errCap) throw errCap;

        // Fetch all expenses
        const { data: expenses, error: errExp } = await supabase
            .from('investment_expenses')
            .select('*')
            .order('date', { ascending: false });

        if (errExp) throw errExp;

        // Fetch Sales Revenue (Paid Sales)
        // We want total amount paid from sales.
        // sales_orders has 'amount_paid' column. We should sum it up.
        // Note: This sums ALL time revenue. We might want to filter later, but for "Balance Sheet" (Total Available),
        // we likely want Total In vs Total Out.
        const { data: sales, error: errSales } = await supabase
            .from('sales_orders')
            .select('amount_paid');

        if (errSales) throw errSales;

        // Calculate Totals
        const totalCapital = capital.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
        const totalSalesRevenue = sales.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0);

        const balance = (totalCapital + totalSalesRevenue) - totalExpenses;

        return {
            totalCapital,
            totalExpenses,
            totalSalesRevenue,
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
