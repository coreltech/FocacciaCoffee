/**
 * Servicio de Reportes V2
 */
import { supabase } from '../../../core/supabase.js';

export const ReportsService = {
    /**
     * Resumen Financiero Consolidado
     */
    async getFinancialSummary(startDate, endDate) {
        try {
            const [salesRes, purchasesRes, expensesRes] = await Promise.all([
                supabase.from('v2_order_payments')
                    .select('amount_usd')
                    .gte('payment_date', `${startDate}T00:00:00`)
                    .lte('payment_date', `${endDate}T23:59:59`),

                supabase.from('v2_purchases')
                    .select('total_usd')
                    .gte('purchase_date', startDate)
                    .lte('purchase_date', endDate),

                supabase.from('v2_operational_expenses')
                    .select('amount')
                    .gte('expense_date', `${startDate}T00:00:00`)
                    .lte('expense_date', `${endDate}T23:59:59`)
            ]);

            const incomes = (salesRes.data || []).reduce((acc, p) => acc + parseFloat(p.amount_usd), 0);
            const purchases = (purchasesRes.data || []).reduce((acc, p) => acc + parseFloat(p.total_usd), 0);
            const expenses = (expensesRes.data || []).reduce((acc, e) => acc + parseFloat(e.amount), 0);

            return {
                incomes,
                outcomes: purchases + expenses,
                purchases,
                expenses,
                netUtility: incomes - (purchases + expenses)
            };

        } catch (error) {
            console.error('Error en ReportsService:', error);
            throw error;
        }
    }
};
