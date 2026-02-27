/**
 * Servicio de Tesorería V2 (Gastos Operativos y Aportes de Capital)
 */
import { supabase } from '../../../core/supabase.js';
import { Store } from '../../core/store.js';

export const TreasuryService = {
    /**
     * Obtiene el listado combinado de Gastos y Aportes del mes actual (o rango de fechas)
     */
    async getRecords(startDate, endDate) {
        try {
            // 1. Obtener Gastos (Salidas)
            let expensesQuery = supabase
                .from('v2_operational_expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (startDate && endDate) {
                expensesQuery = expensesQuery.gte('expense_date', `${startDate}T00:00:00`).lte('expense_date', `${endDate}T23:59:59`);
            }

            // 2. Obtener Aportes (Entradas)
            let contributionsQuery = supabase
                .from('v2_capital_contributions')
                .select('*')
                .order('contribution_date', { ascending: false });

            if (startDate && endDate) {
                contributionsQuery = contributionsQuery.gte('contribution_date', `${startDate}T00:00:00`).lte('contribution_date', `${endDate}T23:59:59`);
            }

            const [expRes, contRes] = await Promise.all([expensesQuery, contributionsQuery]);

            if (expRes.error) throw expRes.error;
            if (contRes.error) throw contRes.error;

            return {
                success: true,
                expenses: expRes.data || [],
                contributions: contRes.data || []
            };
        } catch (error) {
            console.error('Error obteniendo registros de tesorería:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Registra un nuevo Gasto Operativo
     */
    async createExpense(expenseData) {
        try {
            // Usar tasa pasada o fallback del Store
            const rate = expenseData.rate || (Store.get('rates')?.usd_to_ves) || 1;

            const payload = {
                expense_date: expenseData.date,
                description: expenseData.description,
                category: expenseData.category,
                beneficiary: expenseData.beneficiary,
                amount: parseFloat(expenseData.amount), // Siempre guardamos en USD
                reference_rate: rate,
                settlement_id: null // Nulo hasta la liquidación
            };

            const { data, error } = await supabase
                .from('v2_operational_expenses')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error guardando gasto:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Registra un nuevo Aporte de Capital
     */
    async createContribution(contributionData) {
        try {
            // Usar tasa pasada o fallback del Store
            const rate = contributionData.rate || (Store.get('rates')?.usd_to_ves) || 1;

            const payload = {
                contribution_date: contributionData.date,
                partner_name: contributionData.partner_name,
                description: contributionData.description,
                beneficiary: contributionData.beneficiary,
                amount: parseFloat(contributionData.amount), // Siempre guardamos en USD
                reference_rate: rate,
                settlement_id: null // Nulo hasta devolverlo en liquidación
            };

            const { data, error } = await supabase
                .from('v2_capital_contributions')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error guardando aporte:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Elimina un registro de tesorería (Gasto o Aporte)
     * Tipo: 'EXPENSE' o 'CONTRIBUTION'
     */
    async deleteRecord(id, type) {
        try {
            const table = type === 'EXPENSE' ? 'v2_operational_expenses' : 'v2_capital_contributions';

            // Seguridad vital: Validar que no haya sido liquidado antes de borrar!
            const { data: recordCheck, error: checkErr } = await supabase
                .from(table)
                .select('settlement_id')
                .eq('id', id)
                .single();

            if (checkErr) throw checkErr;
            if (recordCheck.settlement_id !== null) {
                throw new Error("No se puede eliminar porque ya pertenece a una Liquidación cerrada.");
            }

            const { error } = await supabase.from(table).delete().eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error eliminando registro:', error);
            return { success: false, error: error.message };
        }
    }
};
