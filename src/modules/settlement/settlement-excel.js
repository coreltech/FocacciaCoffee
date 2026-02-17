
export class SettlementExcel {
    generate(data) {
        if (!window.XLSX) {
            alert("Librería Excel no cargada.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // --- 1. HOJA RESUMEN ---
        const summaryData = [
            ["REPORTE PROVISORIO - PERIODO DE PRUEBA ENERO/FEBRERO 2026"],
            [""],
            ["RESUMEN DE LIQUIDACIÓN DE PERIODO"],
            ["Periodo:", `${data.period.startDate} al ${data.period.endDate}`],
            ["Generado:", new Date().toLocaleString()],
            [""],
            ["CONCEPTO", "MONTO (USD)"],
            ["(+) Total Ventas (Cobradas)", data.incomes.total],
            ["(-) Total Compras + Gastos", data.outcomes.total],
            ["(=) Utilidad Neta", data.balance.netUtility],
            [""],
            ["DISTRIBUCIÓN"],
            ["Fondo de Inversión (20%)", data.balance.fund],
            ["Socio A (Agustín Lugo)", data.balance.partnerA],
            ["Socio B (Juan Manuel Márquez)", data.balance.partnerB],
            [""],
            ["Nota:", "Montos expresados en Dólares Americanos (USD)."]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

        // --- 2. Hojas de Detalle ---
        // Necesitamos detalles de Ventas y Gastos en 'data'.
        // Actualmente SettlementService.getPreview devuelve 'expensesBreakdown' pero NO 'salesBreakdown'.
        // Necesitamos actualizar el Service para devolver 'sales' list.

        // Simulación temporal si no hay datos detallados (El controller deberá asegurarse de pasarlos)
        // Pero el user pidió "Lista de todos los pedidos incluidos".
        // Voy a asumir que data.details.sales y data.details.expenses existen.
        // Si no, updatearé el Service en el siguiente paso.

        const salesHeader = [["ID", "Fecha", "Cliente", "Producto", "Monto Cobrado (USD)"]];
        const salesRows = (data.details?.sales || []).map(s => [
            s.id,
            s.sale_date,
            s.customer_name || 'Cliente Casual',
            s.product_name,
            s.amount_paid_usd
        ]);

        const wsSales = XLSX.utils.aoa_to_sheet([...salesHeader, ...salesRows]);
        XLSX.utils.book_append_sheet(wb, wsSales, "Ventas Detalladas");


        const expHeader = [["Fecha", "Descripción", "Categoría", "Monto (USD)"]];
        const expRows = (data.details?.expensesBreakdown || []).map(e => [
            e.expense_date,
            e.description,
            e.category,
            e.amount_usd
        ]);

        // Agregar Compras también si están separadas
        // data.outcomes.purchases es un total. 
        // El service debería devolver la lista de compras también.

        const wsExp = XLSX.utils.aoa_to_sheet([...expHeader, ...expRows]);
        XLSX.utils.book_append_sheet(wb, wsExp, "Gastos Operativos");

        // --- 4. Hoja de Compras ---
        const purchHeader = [["Fecha", "Proveedor", "Documento", "Total (USD)"]];
        const purchRows = (data.details?.purchasesBreakdown || []).map(p => [
            p.purchase_date,
            p.supplier?.name || 'Desconocido',
            p.document_number || '-',
            p.total_usd
        ]);
        const wsPurch = XLSX.utils.aoa_to_sheet([...purchHeader, ...purchRows]);
        XLSX.utils.book_append_sheet(wb, wsPurch, "Compras (Insumos)");

        // --- 5. Hoja de Aportes ---
        const contribHeader = [["Fecha", "Socio", "Descripción", "Monto (USD)"]];
        const contribRows = (data.details?.contributions || []).map(c => [
            c.contribution_date,
            c.partner_name,
            c.description,
            c.amount
        ]);
        const wsContrib = XLSX.utils.aoa_to_sheet([...contribHeader, ...contribRows]);
        XLSX.utils.book_append_sheet(wb, wsContrib, "Aportes de Capital");

        // --- DESCARGAR ---
        XLSX.writeFile(wb, `Liquidacion_Excel_${data.period.endDate}.xlsx`);
    }
}
