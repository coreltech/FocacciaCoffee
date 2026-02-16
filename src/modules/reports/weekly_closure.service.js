import { supabase } from '../../core/supabase.js';

export const WeeklyClosureService = {
    async getReportData(startDate, endDate) {
        // 1. Fetch Sales in Date Range
        const { data: sales, error: salesError } = await supabase
            .from('sales_orders')
            .select('*')
            .gte('sale_date', `${startDate}T00:00:00`)
            .lte('sale_date', `${endDate}T23:59:59`);

        if (salesError) throw salesError;

        // 2. Fetch Catalog Costs (v_catalog_costs)
        const { data: costs, error: costsError } = await supabase
            .from('v_catalog_costs')
            .select('*');

        if (costsError) throw costsError;

        // 3. Process Data
        let totalIncome = 0;
        let totalCost = 0;
        let totalPaid = 0;
        let productBreakdown = {};

        sales.forEach(sale => {
            const qty = parseFloat(sale.quantity) || 0;
            const amount = parseFloat(sale.total_amount) || 0;
            const paid = parseFloat(sale.amount_paid_usd || sale.amount_paid || 0); // Prefer USD field

            totalIncome += amount;
            totalPaid += paid;

            // Find Cost
            // v_catalog_costs usually has catalog_id or product_id? 
            // Let's assume catalog_id based on previous context or check.
            // In Migration 49: CREATE VIEW v_catalog_costs AS ... select c.id as catalog_id ...
            const costItem = costs.find(c => c.catalog_id === sale.product_id);
            const unitCost = costItem ? parseFloat(costItem.production_cost_usd || 0) : 0;
            const totalItemCost = qty * unitCost;

            totalCost += totalItemCost;

            // Aggregate by Product
            const pName = sale.product_name || "Desconocido";
            if (!productBreakdown[pName]) {
                productBreakdown[pName] = {
                    name: pName,
                    qty: 0,
                    income: 0,
                    cost: 0
                };
            }
            productBreakdown[pName].qty += qty;
            productBreakdown[pName].income += amount;
            productBreakdown[pName].cost += totalItemCost;
        });

        // 4. Fetch Supply Usage (New Function)
        const { data: usageData, error: usageError } = await supabase
            .rpc('get_period_usage', {
                p_start_date: `${startDate}T00:00:00`,
                p_end_date: `${endDate}T23:59:59`
            });

        if (usageError) console.error("Error fetching usage:", usageError);

        // 5. Calculate Metrics
        const grossProfit = totalIncome - totalCost;
        const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
        const collectionProgress = totalIncome > 0 ? (totalPaid / totalIncome) * 100 : 0;

        // Find Winner
        // "Producto Ganador": El que más utilidad generó (Ventas x Margen).
        // My breakdown calculates income and cost per product, so I can calc margin per product.

        let winner = { name: 'N/A', profit: 0 };
        const breakdownArray = Object.values(productBreakdown).map(p => {
            const profit = p.income - p.cost;
            const margin = p.income > 0 ? (profit / p.income) * 100 : 0;

            if (profit > winner.profit) {
                winner = { name: p.name, profit: profit, margin: margin, income: p.income };
            }

            return { ...p, profit, margin };
        }).sort((a, b) => b.income - a.income);

        return {
            summary: {
                totalIncome,
                totalCost,
                grossProfit,
                profitMargin,
                totalPaid,
                collectionProgress,
                winner
            },
            usage: usageData || [],
            breakdown: breakdownArray
        };
    }
};
