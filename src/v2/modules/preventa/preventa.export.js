/**
 * Utilidad de Exportación para Preventa (PDF y Excel)
 */
import { Formatter } from '../../core/formatter.js';

export const PreventaExporter = {

    /**
     * Exporta a Excel (.xlsx) usando SheetJS
     */
    exportToExcel(data, type) {
        if (!window.XLSX) {
            alert("La librería de Excel no está cargada. Por favor, refresque la página.");
            return;
        }

        const wb = XLSX.utils.book_new();
        let sheetName = "";
        let aoa = [];

        if (type === 'orders') {
            sheetName = "Pedidos_Detallados";
            aoa = [
                ["REPORTE DE PEDIDOS PENDIENTES (PRE-VENTA)"],
                ["Generado:", new Date().toLocaleString()],
                [""],
                ["Fecha Entrega", "Cliente", "Correlativo", "Detalle de Productos", "Monto Total ($)"]
            ];

            data.forEach(o => {
                const itemsStr = (o.v2_order_items || []).map(i => `${i.quantity}x ${i.product_name}`).join(", ");
                aoa.push([
                    o.delivery_date || "S/F",
                    o.v2_customers?.name || "Cliente Genérico",
                    o.correlative || o.id.slice(0, 5),
                    itemsStr,
                    o.total_amount
                ]);
            });
        }
        else if (type === 'production') {
            sheetName = "Resumen_Produccion";
            aoa = [
                ["HOJA DE TRABAJO - RESUMEN DE PRODUCCIÓN"],
                ["Generado:", new Date().toLocaleString()],
                [""],
                ["Producto", "Cantidad Total (Unidades)"]
            ];
            data.forEach(i => aoa.push([i.name, i.total_qty]));
        }
        else if (type === 'market') {
            sheetName = "Lista_de_Mercado";
            aoa = [
                ["LISTA DE COMPRAS / MERCADO (INSUMOS TOTALES)"],
                ["Este reporte es referencial basado en las recetas de los pedidos pendientes."],
                ["Generado:", new Date().toLocaleString()],
                [""],
                ["Ingrediente / Insumo", "Cantidad Necesaria", "Unidad"]
            ];
            data.forEach(s => aoa.push([s.name, s.qty, s.unit || "un/gr/ml"]));
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Ajustar anchos de columnas (aproximado)
        const wscols = aoa[aoa.length - 1].map(() => ({ wch: 25 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `Preventa_${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    },

    /**
     * Exporta a PDF usando jsPDF y AutoTable
     */
    exportToPDF(data, type) {
        if (!window.jspdf) {
            alert("La librería PDF no está cargada. Por favor, refresque la página.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleString();

        // Estilos base
        doc.setFontSize(18);
        doc.setTextColor(40);

        let title = "";
        let headers = [];
        let rows = [];

        if (type === 'orders') {
            title = "Reporte de Pedidos Pendientes";
            headers = [["Entrega", "Cliente", "Detalle", "Total ($)"]];
            rows = data.map(o => [
                o.delivery_date || "S/F",
                o.v2_customers?.name || "Cliente Genérico",
                (o.v2_order_items || []).map(i => `${i.quantity}x ${i.product_name}`).join("\n"),
                Formatter.formatNumber(o.total_amount)
            ]);
        }
        else if (type === 'production') {
            title = "Hoja de Trabajo - Producción Consolidada";
            headers = [["Producto", "Cantidad a Hornear"]];
            rows = data.map(i => [i.name, i.total_qty]);
        }
        else if (type === 'market') {
            title = "Lista de Mercado (Insumos Totales)";
            headers = [["Ingrediente", "Cantidad", "Unidad"]];
            rows = data.map(s => [s.name, Formatter.formatNumber(s.qty), s.unit || "un"]);
        }

        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado: ${dateStr}`, 14, 30);

        doc.autoTable({
            startY: 35,
            head: headers,
            body: rows,
            theme: 'striped',
            headStyles: { fillStyle: [59, 130, 246] }, // Azul primario
            styles: { fontSize: 9, cellPadding: 3 },
            didDrawPage: (data) => {
                // Pie de página
                doc.setFontSize(8);
                doc.text(`Focaccia Plus and Coffee - Página ${data.pageNumber}`, 14, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Preventa_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};
