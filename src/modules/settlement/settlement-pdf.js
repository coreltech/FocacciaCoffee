
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class SettlementPDF {
    constructor() {
        this.jsPDF = jsPDF;
    }

    async generate(data) {
        if (!this.jsPDF) {
            alert("Librería PDF no cargada.");
            return;
        }

        const doc = new this.jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- HEADER ---
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("INFORME DE LIQUIDACIÓN", pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text("Unidad de Negocio: Focaccia & Coffee", pageWidth / 2, 30, { align: 'center' });

        // --- INFO DEL PERIODO ---
        doc.setTextColor(51, 65, 85); // slate-700
        doc.setFontSize(10);
        doc.text(`Periodo: ${data.period.startDate} al ${data.period.endDate}`, 14, 50);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 55);

        // --- MARCA DE AGUA (MODO BORRADOR) ---
        // Si no está liquidado oficialmente (o siempre por ahora según instrucción)
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(40);
        doc.text("BORRADOR / PROVISORIO", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        doc.setTextColor(51, 65, 85); // Reset color

        // --- ROLES (Box) ---
        const startYRoles = 65;

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setFillColor(248, 250, 252); // slate-50

        // Box 1
        doc.roundedRect(14, startYRoles, 85, 20, 3, 3, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("Responsable Administrativo", 19, startYRoles + 6);
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("Agustín Lugo Arias", 19, startYRoles + 14);

        // Box 2
        doc.roundedRect(110, startYRoles, 85, 20, 3, 3, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Socio Operativo / Inversionista", 115, startYRoles + 6);
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Juan Manuel Márquez", 115, startYRoles + 14);

        // --- RESUMEN FINANCIERO ---
        let currentY = startYRoles + 35;
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("1. Resumen Financiero (Flujo de Caja)", 14, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Concepto', 'Descripción', 'Monto']],
            body: [
                ['(+) Entradas', 'Ventas Cobradas', `$${data.incomes.total.toFixed(2)}`],
                ['(-) Salidas', 'Compras + Gastos Operativos', `$${data.outcomes.total.toFixed(2)}`],
                ['(=) Utilidad Neta', 'Disponible para Reparto', `$${data.balance.netUtility.toFixed(2)}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] },
            columnStyles: {
                0: { fontStyle: 'bold' },
                2: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // --- REPARTICIÓN (La tabla solicitada) ---
        currentY = doc.lastAutoTable.finalY + 20;
        doc.text("2. Resumen de Repartición", 14, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Socio', 'Rol', 'Participación', 'Monto a Liquidar']],
            body: [
                ['Agustín Lugo Arias', 'Gestión y Operación', '50%', `$${data.balance.partnerA.toFixed(2)}`],
                ['Juan Manuel Márquez', 'Socio', '50%', `$${data.balance.partnerB.toFixed(2)}`]
            ],
            foot: [['', 'Fondo de Inversión (20%)', '', `$${data.balance.fund.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] }, // Dark header
            footStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] } // Blue amount
            }
        });

        // --- FIRMAS ---
        const pageHeight = doc.internal.pageSize.height;
        const ySign = pageHeight - 40;

        doc.setDrawColor(148, 163, 184);
        doc.line(30, ySign, 90, ySign); // Line 1
        doc.line(120, ySign, 180, ySign); // Line 2

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Agustín Lugo Arias", 60, ySign + 5, { align: 'center' });
        doc.text("Juan Manuel Márquez", 150, ySign + 5, { align: 'center' });

        // Save
        const filename = `Liquidacion_${data.period.endDate}.pdf`;
        doc.save(filename);
    }
}
