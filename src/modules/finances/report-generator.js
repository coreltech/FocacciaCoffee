export class ReportGenerator {
    constructor() {
        this.loaded = false;
    }

    async loadLib() {
        // 1. Try Global (CDN from index.html)
        if (window.jspdf && window.jspdf.jsPDF) {
            this.jsPDF = window.jspdf.jsPDF;
            return;
        }

        // 2. Try Dynamic Import (Fallback)
        try {
            const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
            const { default: autoTable } = await import('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm');
            this.jsPDF = jsPDF;
            this.autoTable = autoTable;
        } catch (e) {
            console.error("Failed to load PDF libs", e);
            alert("Error cargando librería de PDF. Verifique su conexión.");
        }
    }

    async generateInvestorReport(capital, expenses, balance) {
        await this.loadLib();
        if (!this.jsPDF) return;

        const doc = new this.jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-VE');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Reporte de Gestión de Capital", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Focaccia Plus & Coffee - Generado el ${dateStr}`, 14, 28);

        // Summary Card
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 35, 180, 25, 'F');

        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text("Capital Ingresado", 20, 42);
        doc.text("Total Gastos", 80, 42);
        doc.text("Disponible", 140, 42);

        doc.setFontSize(14);
        doc.setTextColor(22, 101, 52); // Green
        doc.text(`$${capital.toFixed(2)}`, 20, 50);

        doc.setTextColor(185, 28, 28); // Red
        doc.text(`$${expenses.toFixed(2)}`, 80, 50);

        doc.setTextColor(37, 99, 235); // Blue
        doc.text(`$${balance.toFixed(2)}`, 140, 50);

        // Details Table
        const tableData = expenses > 0 ? this.expensesToTable(expenses) : []; // Wait, need list

        // This method needs the LIST of expenses, not just the total.
        // Refactoring to accept data object.
    }

    async generateFullReport(data) {
        await this.loadLib();
        if (!this.jsPDF) return;

        const doc = new this.jsPDF();
        const { capitalList, expensesList, totalCapital, totalExpenses, balance } = data;

        // 1. Header
        doc.setFontSize(22);
        doc.text("Reporte de Inversión y Gastos", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 26);

        // 2. Summary
        doc.autoTable({
            startY: 35,
            head: [['Capital Total', 'Total Gastos (Ejecutado)', 'Capital Disponible']],
            body: [[
                `$${totalCapital.toFixed(2)}`,
                `$${totalExpenses.toFixed(2)}`,
                `$${balance.toFixed(2)}`
            ]],
            theme: 'plain',
            styles: { fontSize: 12, halign: 'center', cellPadding: 5 },
            columnStyles: {
                0: { textColor: [22, 163, 74] },
                1: { textColor: [220, 38, 38] },
                2: { textColor: [37, 99, 235], fontStyle: 'bold' }
            }
        });

        // 3. Capital Entries
        doc.text("Detalle de Ingresos (Capital)", 14, doc.lastAutoTable.finalY + 15);

        const capRows = capitalList.map(c => [
            c.date,
            c.source,
            c.notes || '-',
            `$${parseFloat(c.amount).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Fecha', 'Fuente', 'Notas', 'Monto']],
            body: capRows,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        // 4. Expenses
        doc.text("Detalle de Gastos (Facturas)", 14, doc.lastAutoTable.finalY + 15);

        const expRows = expensesList.map(e => [
            e.date,
            e.provider || 'N/A',
            e.invoice_number || '-',
            // Flatten items description
            (e.items || []).map(i => `${i.description} (${i.quantity})`).join(', '),
            `$${parseFloat(e.total_amount).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Fecha', 'Proveedor', 'Factura', 'Detalles', 'Total']],
            body: expRows,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Pag ' + i + ' / ' + pageCount, 190, 290, { align: 'right' });
        }

        doc.save(`Reporte_Capital_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}
