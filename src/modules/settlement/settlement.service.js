import { supabase } from '../../core/supabase.js';

export const SettlementService = {
    /**
     * Obtiene el resumen de liquidación para un periodo dado.
     * Basado en Flujo de Caja (Cobrado vs Pagado).
     */
    async getPreview(startDate, endDate) {
        // 1. VENTAS (Entradas Reales - Cobrado - Criterio CAJA)
        const salesQuery = supabase
            .from('sales_orders')
            .select('id, sale_date, payment_date, customer_id, customers(name), product_name, amount_paid_usd, total_amount, payment_status, client_name, quantity')
            .gte('payment_date', `${startDate}T00:00:00`)
            .lte('payment_date', `${endDate}T23:59:59`);

        // 2. COMPRAS (Salidas Reales - Insumos)
        const purchasesQuery = supabase
            .from('purchases')
            .select('purchase_date, supplier_id, total_usd, document_number, supplier:suppliers(name)')
            .gte('purchase_date', `${startDate}T00:00:00`)
            .lte('purchase_date', `${endDate}T23:59:59`);

        // 3. GASTOS OPERATIVOS (Salidas Reales - Admin Module)
        const expensesQuery = supabase
            .from('operational_expenses')
            .select('id, amount_usd, category, description, expense_date')
            .gte('expense_date', `${startDate}T00:00:00`)
            .lte('expense_date', `${endDate}T23:59:59`);

        // 4. APORTES DE CAPITAL (Socios)
        const contributionsQuery = supabase
            .from('capital_contributions')
            .select('*')
            .gte('contribution_date', `${startDate}T00:00:00`)
            .lte('contribution_date', `${endDate}T23:59:59`)
            .order('contribution_date', { ascending: false });

        // 5. COSTOS DE PRODUCTOS (Para Rentabilidad Teórica vs Real)
        // Usamos 'sales_prices' directamente, ya que el costo se guarda ahí (costo_unitario_referencia)
        // Eliminamos el filtro de activo para incluir productos históricos/desactivados
        const costsQuery = supabase
            .from('sales_prices')
            .select('id, product_name, costo_unitario_referencia');

        // Execute all queries concurrently
        const [salesRes, purchasesRes, expensesRes, contributionsRes, costsRes] = await Promise.all([
            salesQuery,
            purchasesQuery,
            expensesQuery,
            contributionsQuery,
            costsQuery
        ]);

        // Handle errors
        if (salesRes.error) throw salesRes.error;
        if (purchasesRes.error) throw purchasesRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (contributionsRes.error) throw contributionsRes.error;
        // costsRes might fail if view doesn't exist, handle gracefully
        const productCosts = (costsRes.data || []);
        console.log("📊 [DEBUG] Costos cargados:", productCosts.length, productCosts);

        // Extract data
        const sales = salesRes.data || [];
        const purchases = purchasesRes.data || [];
        const expenses = expensesRes.data || [];
        const contributions = contributionsRes.data || [];

        // --- CÁLCULOS ---

        // A. Entradas & Costos Teóricos
        let totalTheoreticalCost = 0;

        const processedSales = sales.map(s => {
            let amount = parseFloat(s.amount_paid_usd) || 0;
            // Fallback: Si el monto pagado es 0 pero está marcado como Pagado, usamos el total
            if (amount === 0 && ['Pagado', 'paid', 'Paid', 'COMPLETED'].includes(s.payment_status)) {
                amount = parseFloat(s.total_amount) || 0;
            }

            // Calculate Theoretical Cost for this sale
            // Find cost by matching product_id (sales_orders) to id (sales_prices)
            const costItem = productCosts.find(c => c.id === s.product_id);
            const unitCost = costItem ? parseFloat(costItem.costo_unitario_referencia || 0) : 0;

            if (!costItem) {
                console.warn(`⚠️ [DEBUG] No cost found for product_id: ${s.product_id} (${s.product_name || 'Unk'})`);
            } else if (unitCost === 0) {
                console.warn(`⚠️ [DEBUG] Cost is 0 for product: ${costItem.product_name} (ID: ${costItem.id})`);
            }

            const saleCost = unitCost * (parseFloat(s.quantity) || 0);

            totalTheoreticalCost += saleCost;

            return {
                ...s,
                effective_amount: amount,
                theoretical_cost: saleCost,
                unit_cost: unitCost
            };
        });

        // --- GROUPING LOGIC FOR BREAKDOWN TABLE ---
        const productGrouping = {};
        processedSales.forEach(s => {
            if (s.product_id) {
                if (!productGrouping[s.product_id]) {
                    productGrouping[s.product_id] = {
                        id: s.product_id,
                        name: s.product_name || 'Producto Desconocido',
                        quantity: 0,
                        unit_cost: s.unit_cost,
                        total_cost: 0,
                        total_sales: 0
                    };
                }
                productGrouping[s.product_id].quantity += parseFloat(s.quantity) || 0;
                productGrouping[s.product_id].total_cost += s.theoretical_cost;
                productGrouping[s.product_id].total_sales += s.effective_amount;
            }
        });

        // Convert grouping map to array and Sort by Total Cost (Highest first)
        const productBreakdown = Object.values(productGrouping).sort((a, b) => b.total_cost - a.total_cost);

        const totalIn = processedSales.reduce((sum, s) => sum + s.effective_amount, 0);

        // B. Salidas
        const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.total_usd) || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);
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
                count: processedSales.filter(s => s.effective_amount > 0).length // Count only effective sales
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
            profitability: {
                totalSales: totalIn,
                theoreticalCost: totalTheoreticalCost,
                theoreticalProfit: totalIn - totalTheoreticalCost,
                actualCost: totalOut, // Purchases + Expenses
                gap: totalOut - totalTheoreticalCost, // Positive = Spent more than theoretical (Stocking/Waste). Negative = Spent less.
                breakdown: productBreakdown
            },
            details: {
                expensesBreakdown: expenses,
                sales: processedSales.map(s => ({
                    ...s,
                    customer_name: s.customers?.name || s.client_name || 'Cliente Casual',
                    amount_paid_usd: s.effective_amount // Override for display consistency
                })),
                purchasesBreakdown: purchases,
                contributions: contributions // Added contributions to details
            }
        };
    },

    /**
     * Registra un Gasto Rápido (Integración con Finances)
     */
    async registerQuickExpense(expense) {
        // expense: { description, amount, currency, date, category }
        // Mapeamos a la estructura de 'operational_expenses' (Admin Module)

        const payload = {
            expense_date: expense.date,
            description: expense.description,
            amount_usd: expense.amount, // Assumes USD 
            category: expense.category || 'Gasto Rápido'
        };

        const { data, error } = await supabase
            .from('operational_expenses')
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

        // Update expenses (Try to mark as liquidated if column exists)
        // Note: 'settlement_id' column might need to be added to 'operational_expenses'
        try {
            await supabase.from('operational_expenses')
                .update({ settlement_id: settlement.id })
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .is('settlement_id', null);
        } catch (e) {
            console.warn("Could not mark expenses as liquidated (missing column?)", e);
        }

        return settlement;
    }
};
