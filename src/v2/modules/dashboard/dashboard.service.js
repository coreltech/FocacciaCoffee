/**
 * Servicio de Dashboard V2 (Refinado)
 * Métricas avanzadas para la toma de decisiones
 */
import { supabase } from '../../../core/supabase.js';

export const DashboardService = {
    /**
     * Obtiene métricas avanzadas y tradicionales para el dashboard
     */
    async getDashboardMetrics() {
        try {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
            const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

            // 1. Promesas concurrentes para datos base (6 consultas)
            const [paymentsRes, ordersRes, pendingRes, stockRes, receivablesRes, topProductsRes] = await Promise.all([
                // 0. Pagos de la semana (Lo cobrado real - Cash Basis)
                supabase.from('v2_order_payments')
                    .select('amount_usd, payment_date')
                    .gte('payment_date', `${startOfWeekStr}T00:00:00`),

                // 1. Total Facturado de la semana (Lo emitido - Accrual Basis)
                supabase.from('v2_orders')
                    .select('total_amount, sale_date')
                    .gte('sale_date', `${startOfWeekStr}T00:00:00`),

                // 2. Pedidos pendientes (Conteo rápido)
                supabase.from('v2_orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Pendiente'),

                // 3. Suministros (para stock bajo)
                supabase.from('v2_supplies')
                    .select('name, stock, min_stock, measurement_unit'),

                // 4. Cuentas por Cobrar (Total balances histórico)
                supabase.from('v2_orders')
                    .select('balance_due')
                    .gt('balance_due', 0),

                // 5. Top Productos (de la semana)
                supabase.from('v2_order_items')
                    .select('product_name, quantity, total_price, v2_orders!inner(sale_date)')
                    .gte('v2_orders.sale_date', `${startOfWeekStr}T00:00:00`)
            ]);

            const weeklyPayments = paymentsRes.data || [];
            const weeklyOrders = ordersRes.data || [];

            // Cálculos básicos
            const collectedWeeklyUSD = weeklyPayments.reduce((sum, p) => sum + parseFloat(p.amount_usd || 0), 0);
            const totalWeeklyUSD = weeklyOrders.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

            // KPI: Ticket Promedio (Basado en facturación/órdenes)
            const avgTicket = weeklyOrders.length > 0 ? totalWeeklyUSD / weeklyOrders.length : 0;

            // KPI: Por Cobrar (Total histórico acumulado)
            const totalReceivables = (receivablesRes.data || []).reduce((acc, r) => acc + parseFloat(r.balance_due || 0), 0);

            // KPI: Stock Crítico
            const lowStockItems = (stockRes.data || []).filter(s => parseFloat(s.stock || 0) < parseFloat(s.min_stock || 0));

            // Análisis: Top 5 Productos
            const productMap = {};
            (topProductsRes.data || []).forEach(item => {
                if (!productMap[item.product_name]) {
                    productMap[item.product_name] = { name: item.product_name, qty: 0, total: 0 };
                }
                productMap[item.product_name].qty += parseFloat(item.quantity || 0);
                productMap[item.product_name].total += parseFloat(item.total_price || 0);
            });

            const topProducts = Object.values(productMap)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Tendencia de 7 días
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7Days.push(d.toISOString().split('T')[0]);
            }

            const salesTrend = last7Days.map(date => {
                const daySales = weeklyOrders.filter(s => s.sale_date && s.sale_date.startsWith(date));
                return {
                    date,
                    label: new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                    total: daySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
                };
            });

            return {
                weeklySales: totalWeeklyUSD,
                collectedSales: collectedWeeklyUSD,
                avgTicket,
                totalReceivables,
                pendingOrders: pendingRes.count || 0,
                lowStockCount: lowStockItems.length,
                lowStockItems: lowStockItems.slice(0, 5),
                salesTrend,
                topProducts
            };

        } catch (error) {
            console.error('Error en DashboardService:', error);
            throw error;
        }
    }
};
