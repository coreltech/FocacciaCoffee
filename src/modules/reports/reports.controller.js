import { SalesService } from '../sales/sales.service.js';
import { ReportsView } from './reports.view.js';
import { Toast } from '../../ui/toast.js';

export async function loadReports() {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div style="text-align:center; padding:50px; color:#64748b;">Cargando Dashboard...</div>';

    // Default: Last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    loadData(sStr, eStr, container);
}

async function loadData(start, end, container) {
    try {
        // Reuse SalesService to get data
        // We fetch ALL sales in range to compute metrics locally
        // Optimization: For huge datasets, this should be done in backend (RPC). 
        // For now, client-side aggression is fine for < 10k records.
        const { sales } = await SalesService.getData(start, end, 0, 10000, 'sale_date');

        const kpis = calculateKPIs(sales);
        const charts = prepareCharts(sales);

        ReportsView.renderDashboard(container, {
            period: { start, end },
            kpis,
            charts
        });

        bindEvents(container);
    } catch (err) {
        console.error("Dashboard Error:", err);
        container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error cargando reporte: ${err.message}</div>`;
    }
}

function calculateKPIs(sales) {
    let totalSales = 0;
    let collected = 0;
    let pending = 0;
    let pendingCount = 0;

    sales.forEach(s => {
        const total = parseFloat(s.total_amount) || 0;
        const paid = parseFloat(s.amount_paid_usd || s.amount_paid) || 0;
        const bal = parseFloat(s.balance_due) || 0;

        totalSales += total;

        // Logic: if balance <= 0.01, it's fully paid (collected = total)
        // Logic 2: Actually tracking real "collected" vs "credit"
        // Let's rely on amount_paid which tracks valid payments
        collected += paid;

        if (bal > 0.01) {
            pending += bal;
            pendingCount++;
        }
    });

    return {
        totalSales,
        collected,
        pending,
        pendingCount,
        totalOrders: sales.length,
        avgTicket: sales.length > 0 ? totalSales / sales.length : 0
    };
}

function prepareCharts(sales) {
    // 1. Top Products
    const prodMap = {};
    // 2. Payment Methods
    const payMap = {};
    // 3. Trend
    const trendMap = {};

    sales.forEach(s => {
        // Products
        const pName = s.product_name || 'Otros';
        prodMap[pName] = (prodMap[pName] || 0) + s.total_amount;

        // Methods (This needs complex parsing if JSON, but usually we have 'payment_methods' or logic)
        // If s.payment_details exists and has items
        if (s.payment_details && s.payment_details.items) {
            s.payment_details.items.forEach(pi => {
                const method = pi.method || 'Otros';
                payMap[method] = (payMap[method] || 0) + (pi.amount_native || 0); // Warning: Mixing currencies in labels? 
                // Better to use USD equivalent for chart if possible.
                // Assuming amount in USD for simplicity or just count frequency?
                // Let's count occurrence for now OR amount if we trust conversion
            });
        }

        // Trend
        const date = s.sale_date.split('T')[0];
        trendMap[date] = (trendMap[date] || 0) + s.total_amount;
    });

    // Sort Products
    const sortedProds = Object.entries(prodMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5

    return {
        products: {
            labels: sortedProds.map(x => x[0]),
            values: sortedProds.map(x => x[1])
        },
        payments: {
            labels: Object.keys(payMap),
            values: Object.values(payMap)
        },
        trend: {
            labels: Object.keys(trendMap).sort(),
            values: Object.keys(trendMap).sort().map(k => trendMap[k])
        }
    };
}

function bindEvents(container) {
    const btnRef = document.getElementById('btn-refresh-rep');
    const sInput = document.getElementById('rep-date-start');
    const eInput = document.getElementById('rep-date-end');
    const btnExp = document.getElementById('btn-export-excel');

    if (btnRef) {
        btnRef.onclick = () => {
            loadData(sInput.value, eInput.value, container);
        };
    }

    if (btnExp) {
        btnExp.onclick = async () => {
            const { sales } = await SalesService.getData(sInput.value, eInput.value, 0, 10000, 'sale_date');
            exportExcel(sales);
        };
    }
}

function exportExcel(sales) {
    if (!window.XLSX) return alert("Error: Librería Excel no disponible.");

    const rows = sales.map(s => ({
        ID: s.id,
        Fecha: s.sale_date.split('T')[0],
        Cliente: s.customers?.name || 'Cliente Casual',
        Producto: s.product_name,
        Total: s.total_amount,
        Pagado: s.amount_paid_usd || s.amount_paid,
        Deuda: s.balance_due,
        Estado: s.payment_status
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `Reporte_Ventas_${new Date().getTime()}.xlsx`);
}
