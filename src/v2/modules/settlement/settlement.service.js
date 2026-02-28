/**
 * Servicio de Liquidación V2
 * Basado en Criterio de Caja (Flujo Real de Efectivo)
 */
import { supabase } from '../../../core/supabase.js';

export const SettlementService = {
    /**
     * Obtiene la vista previa de una liquidación
     */
    async getPreview(startDate, endDate) {
        try {
            // 1. VENTAS (Ingresos - v2_order_payments)
            // Criterio de Caja: Se cuenta lo cobrado en el periodo, sin importar cuando se emitió la factura
            let salesQuery = supabase
                .from('v2_order_payments')
                .select('*, v2_orders(*, v2_customers(name))')
                .gte('payment_date', `${startDate}T00:00:00`)
                .lte('payment_date', `${endDate}T23:59:59`);

            // 2. COMPRAS (Egresos Insumos - v2_purchases)
            let purchasesQuery = supabase
                .from('v2_purchases')
                .select('*, v2_suppliers(name), v2_purchase_items(*)')
                .gte('purchase_date', startDate)
                .lte('purchase_date', endDate);

            // 3. GASTOS OPERATIVOS (Egresos Varios - v2_operational_expenses)
            let expensesQuery = supabase
                .from('v2_operational_expenses')
                .select('*')
                .gte('expense_date', `${startDate}T00:00:00`)
                .lte('expense_date', `${endDate}T23:59:59`);

            // 4. APORTES DE CAPITAL (v2_capital_contributions)
            let contributionsQuery = supabase
                .from('v2_capital_contributions')
                .select('*')
                .gte('contribution_date', `${startDate}T00:00:00`)
                .lte('contribution_date', `${endDate}T23:59:59`);

            const [salesRes, purchasesRes, expensesRes, contributionsRes] = await Promise.all([
                salesQuery,
                purchasesQuery,
                expensesQuery,
                contributionsQuery
            ]);

            if (salesRes.error) throw salesRes.error;
            if (purchasesRes.error) throw purchasesRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (contributionsRes.error) throw contributionsRes.error;

            const sales = salesRes.data || [];
            const purchases = purchasesRes.data || [];
            const expenses = expensesRes.data || [];
            const contributions = contributionsRes.data || [];

            // --- Cálculos ---
            const totalIncomes = sales.reduce((sum, s) => sum + parseFloat(s.amount_usd || 0), 0);
            const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_usd || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

            const totalOutcomes = totalPurchases + totalExpenses;
            const netUtility = totalIncomes - totalOutcomes;

            // Distribución (20% Fondo, 80% Socios - Regla del umbral de $20)
            let fund = 0;
            let partnerA = 0;
            let partnerB = 0;

            if (netUtility > 0) {
                if (netUtility < 20) {
                    fund = netUtility;
                } else {
                    fund = netUtility * 0.20;
                    const distributable = netUtility - fund;
                    partnerA = distributable / 2;
                    partnerB = distributable / 2;
                }
            }

            return {
                success: true,
                period: { startDate, endDate },
                totals: {
                    incomes: totalIncomes,
                    purchases: totalPurchases,
                    expenses: totalExpenses,
                    outcomes: totalOutcomes,
                    netUtility
                },
                distribution: {
                    fund,
                    partnerA,
                    partnerB
                },
                details: {
                    sales,
                    purchases,
                    expenses,
                    contributions
                }
            };

        } catch (error) {
            console.error('Error en SettlementService.getPreview:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Ejecuta la liquidación definitiva
     */
    async liquidate(previewData) {
        try {
            const { period, totals, distribution } = previewData;

            // 1. Crear el registro maestro de liquidación
            const { data: settlement, error: sErr } = await supabase
                .from('v2_settlements')
                .insert([{
                    start_date: period.startDate,
                    end_date: period.endDate,
                    total_income: totals.incomes,
                    total_outcome: totals.outcomes,
                    net_utility: totals.netUtility,
                    fund_amount: distribution.fund,
                    partner_a_amount: distribution.partnerA,
                    partner_b_amount: distribution.partnerB
                }])
                .select()
                .single();

            if (sErr) throw sErr;

            const settlementId = settlement.id;

            // 2. Marcar registros como liquidados (en paralelo para velocidad)
            const updates = [
                // Pagos de Ventas (Cash Basis)
                supabase.from('v2_order_payments')
                    .update({ settlement_id: settlementId })
                    .gte('payment_date', `${period.startDate}T00:00:00`)
                    .lte('payment_date', `${period.endDate}T23:59:59`)
                    .is('settlement_id', null),

                // Compras
                supabase.from('v2_purchases')
                    .update({ settlement_id: settlementId })
                    .gte('purchase_date', period.startDate)
                    .lte('purchase_date', period.endDate)
                    .is('settlement_id', null),

                // Gastos
                supabase.from('v2_operational_expenses')
                    .update({ settlement_id: settlementId })
                    .gte('expense_date', `${period.startDate}T00:00:00`)
                    .lte('expense_date', `${period.endDate}T23:59:59`)
                    .is('settlement_id', null),

                // Aportes
                supabase.from('v2_capital_contributions')
                    .update({ settlement_id: settlementId })
                    .gte('contribution_date', `${period.startDate}T00:00:00`)
                    .lte('contribution_date', `${period.endDate}T23:59:59`)
                    .is('settlement_id', null)
            ];

            await Promise.all(updates);

            return { success: true, settlement };
        } catch (error) {
            console.error('Error en SettlementService.liquidate:', error);
            return { success: false, error: error.message };
        }
    }
};
