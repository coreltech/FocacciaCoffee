import { supabase } from '../../core/supabase.js';

export const SettlementService = {
    /**
     * Obtiene el resumen de liquidación para un periodo dado.
     * Basado en Flujo de Caja (Cobrado vs Pagado).
     */
    async getPreview(startDate, endDate) {
        // 1. VENTAS (Entradas Reales - Cobrado)
        // Buscamos ventas que tengan pagos en ese rango de FECHA DE VENTA? 
        // Ojo: Si es Flujo de Caja, deberíamos buscar por fecha de PAGO.
        // Pero el sistema actual registra 'sale_date'. 
        // Asumiremos que sale_date es la fecha relevante para el ejercicio, 
        // o si queremos ser estrictos, solo sumamos lo "Pagado" de las ventas de ese periodo.
        // El usuario dijo: "Entradas: SUM(amount_paid_usd) de la tabla sales_orders". (Implica filtro por fecha de venta).

        const { data: sales, error: errSales } = await supabase
            .from('sales_orders')
            .select('id, sale_date, customer_name, product_name, amount_paid_usd, payment_status')
            .gte('sale_date', `${startDate}T00:00:00`)
            .lte('sale_date', `${endDate}T23:59:59`)
            // Excluir lo ya liquidado si existe la columna (Aun no existe, lo preparamos)
            // .is('settlement_id', null)
            ;

        if (errSales) throw errSales;

        // 2. COMPRAS (Salidas Reales - Insumos)
        const { data: purchases, error: errPurchases } = await supabase
            .from('purchases')
            .select('purchase_date, supplier_id, total_usd')
            .gte('purchase_date', startDate)
            .lte('purchase_date', endDate)
            // .is('settlement_id', null)
            ;

        if (errPurchases) throw errPurchases;

        // 3. GASTOS OPERATIVOS (Salidas Reales)
        const { data: expenses, error: errExp } = await supabase
            .from('investment_expenses')
            .select('total_amount, category') // total_amount is USD
            .gte('date', startDate)
            .lte('date', endDate)
            // .is('settlement_id', null)
            ;

        if (errExp) throw errExp;

        // --- CÁLCULOS ---

        // A. Entradas
        const totalIn = sales.reduce((sum, s) => sum + (parseFloat(s.amount_paid_usd) || 0), 0);

        // B. Salidas
        const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.total_usd) || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.total_amount) || 0), 0);
        const totalOut = totalPurchases + totalExpenses;

        // C. Utilidad Neta
        const netUtility = totalIn - totalOut;

        // D. Distribución
        // Fondo 20%
        // Si la utilidad es negativa, no hay fondo ni reparto.
        let fund = 0;
        let distributable = 0;
        let partnerA = 0;
        let partnerB = 0;

        if (netUtility > 0) {
            fund = netUtility * 0.20;
            distributable = netUtility - fund;

            // REGLA DE UMBRAL MINIMO ($20)
            if (distributable < 20) {
                // Si es menor a 20, todo va al fondo
                fund += distributable;
                distributable = 0;
                partnerA = 0;
                partnerB = 0;
            } else {
                partnerA = distributable / 2;
                partnerB = distributable / 2;
            }
        }

        return {
            period: { startDate, endDate },
            incomes: {
                total: totalIn,
                count: sales.length
            },
            outcomes: {
                total: totalOut,
                purchases: totalPurchases,
                expenses: totalExpenses
            },
            balance: {
                netUtility,
                fund,
                partnerA,
                partnerB
            },
            details: {
                expensesBreakdown: expenses,
                sales: sales, // For Excel Export
                purchases: purchases // For Excel Export
            }
        };
    },

    /**
     * Registra un Gasto Rápido (Integración con Finances)
     */
    async registerQuickExpense(expense) {
        // expense: { description, amount, currency, date, category }
        // Mapeamos a la estructura de 'investment_expenses'
        // provider -> description
        // total_amount -> amount (converted if needed)

        const payload = {
            date: expense.date,
            provider: expense.description,
            total_amount: expense.amount, // Assumes USD for simplicity or converted in frontend
            category: expense.category || 'General',
            invoice_number: 'N/A-QUICK'
        };

        const { data, error } = await supabase
            .from('investment_expenses')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Cierra el periodo (Liquidar)
     * Requiere que las columnas settlement_id existan.
     */
    async liquidate(startDate, endDate, summaryData) {
        // 1. Crear registro en tabla settlements
        const { data: settlement, error: sErr } = await supabase
            .from('settlements')
            .insert({
                start_date: startDate,
                end_date: endDate,
                total_income: summaryData.incomes.total,
                total_outcome: summaryData.outcomes.total,
                net_utility: summaryData.balance.netUtility,
                fund_amount: summaryData.balance.fund,
                partner_a_amount: summaryData.balance.partnerA,
                partner_b_amount: summaryData.balance.partnerB
            })
            .select()
            .single();

        if (sErr) throw sErr;

        // 2. Marcar registros
        // Update sales
        await supabase.from('sales_orders')
            .update({ settlement_id: settlement.id })
            .gte('sale_date', `${startDate}T00:00:00`)
            .lte('sale_date', `${endDate}T23:59:59`)
            .is('settlement_id', null);

        // Update purchases
        await supabase.from('purchases')
            .update({ settlement_id: settlement.id })
            .gte('purchase_date', startDate)
            .lte('purchase_date', endDate)
            .is('settlement_id', null);

        // Update expenses
        await supabase.from('investment_expenses')
            .update({ settlement_id: settlement.id })
            .gte('date', startDate)
            .lte('date', endDate)
            .is('settlement_id', null);

        return settlement;
    }
};
