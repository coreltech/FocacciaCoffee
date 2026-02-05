export class ReportGenerator {
    constructor() {
        this.loaded = false;
    }

    async loadLib() {
        if (window.jsPDF && typeof window.jsPDF === 'function') {
            this.jsPDF = window.jsPDF;
            return;
        }
        if (window.jspdf && window.jspdf.jsPDF) {
            this.jsPDF = window.jspdf.jsPDF;
            return;
        }

        // Final fallback attempt
        try {
            console.warn("Loading libraries via dynamic import fallback...");
            const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
            this.jsPDF = jsPDF;
            // Try to load autotable
            await import('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm');
        } catch (e) {
            console.error(e);
        }
    }

    async generateInvestorReport(capital, expenses, balance) {
        // ... (legacy method, same logic applicable)
    }

    async generateFullReport(data) {
        await this.loadLib();

        if (!this.jsPDF) {
            alert("Error crítico: La librería PDF no se cargó. Recarga la página.");
            return;
        }

        try {
            const doc = new this.jsPDF();

            // CHECK AUTOTABLE
            if (typeof doc.autoTable !== 'function') {
                console.warn("AutoTable not found on doc instance, checking global plugin...");
                // Sometimes AutoTable is not attached to prototype in certain UMD builds, 
                // but usually it is if window.jsPDF used.
                // If this fails, we might need to rely on simple text or alert the user.
            }

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
