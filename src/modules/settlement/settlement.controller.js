
import { SettlementView } from './settlement.view.js?v=fixed_4';
import { SettlementService } from './settlement.service.js?v=fixed_4';
import { SettlementPDF } from './settlement-pdf.js?v=fixed_4';
import { SettlementExcel } from './settlement-excel.js?v=fixed_4';
import { Toast } from '../../ui/toast.js';

let currentSummary = null;

export async function loadSettlement() {
    const container = document.getElementById('app-content');
    SettlementView.render(container);
    bindEvents();
}

function bindEvents() {
    // 1. Calculate Preview
    document.getElementById('btn-calc-preview').onclick = async () => {
        const start = document.getElementById('settlement-start').value;
        const end = document.getElementById('settlement-end').value;

        if (!start || !end) return Toast.show("Selecciona fechas", "error");

        try {
            document.getElementById('btn-calc-preview').innerText = "Calculando...";
            currentSummary = await SettlementService.getPreview(start, end);
            SettlementView.updatePreview(currentSummary);
            document.getElementById('btn-download-pdf').style.display = 'inline-block';
            document.getElementById('btn-download-excel').style.display = 'inline-block';
        } catch (err) {
            console.error(err);
            Toast.show("Error: " + (err.message || "Calculando liquidación"), "error");
        } finally {
            document.getElementById('btn-calc-preview').innerText = "📊 Calcular Vista Previa";
        }
    };

    // 1.5 View Details (Delegation)
    document.getElementById('preview-area').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.id === 'btn-view-purchases') {
            if (!currentSummary || !currentSummary.details) {
                console.warn('No details available');
                return;
            }
            SettlementView.renderDetailsModal("Detalle de Compras (Insumos)", currentSummary.details.purchasesBreakdown || [], 'purchase');
        }
        if (btn.id === 'btn-view-expenses') {
            if (!currentSummary || !currentSummary.details) {
                console.warn('No details available');
                return;
            }
            SettlementView.renderDetailsModal("Gastos Operativos", currentSummary.details.expensesBreakdown || [], 'expense');
        }
        if (btn.id === 'btn-view-sales') {
            if (!currentSummary || !currentSummary.details) {
                console.warn('No details available');
                return;
            }
            SettlementView.renderDetailsModal("Detalle de Ventas (Cobrado)", currentSummary.details.sales || [], 'sale');
        }
    });

    // 2. Execute Liquidation
    document.getElementById('btn-execute-liquidation').onclick = async () => {
        if (!currentSummary) return;

        if (!confirm("¿Estás seguro de LIQUIDAR este periodo? Esta acción es irreversible.")) return;

        try {
            const start = document.getElementById('settlement-start').value;
            const end = document.getElementById('settlement-end').value;

            await SettlementService.liquidate(start, end, currentSummary);

            Toast.show("Periodo liquidado correctamente ✅", "success");
            // Hide preview to force re-calc or clear
            document.getElementById('preview-area').style.display = 'none';
            currentSummary = null;
        } catch (err) {
            console.error(err);
            Toast.show("Error al liquidar: " + (err.message || 'Desconocido'), "error");
        }
    };

    // 2.5 PDF Download
    document.getElementById('btn-download-pdf').onclick = async () => {
        if (!currentSummary) return Toast.show("Primero calcula la vista previa", "warning");
        try {
            const pdfGen = new SettlementPDF();
            await pdfGen.generate(currentSummary);
            Toast.show("PDF Generado correctamente 📄", "success");
        } catch (err) {
            console.error(err);
            Toast.show("Error generando PDF", "error");
        }
    };

    // 2.6 Excel Download
    document.getElementById('btn-download-excel').onclick = () => {
        if (!currentSummary) return Toast.show("Primero calcula la vista previa", "warning");
        try {
            const excelGen = new SettlementExcel();
            excelGen.generate(currentSummary);
            Toast.show("Excel Generado correctamente 📊", "success");
        } catch (err) {
            console.error(err);
            Toast.show("Error generando Excel", "error");
        }
    };

    // 3. Quick Expense Logic
    const btnQuick = document.getElementById('btn-quick-expense');
    const modal = document.getElementById('modal-quick-expense');
    const btnCancel = document.getElementById('btn-cancel-qe');
    const btnSave = document.getElementById('btn-save-qe');

    btnQuick.onclick = () => SettlementView.toggleQuickExpenseModal(true);
    btnCancel.onclick = () => SettlementView.toggleQuickExpenseModal(false);

    btnSave.onclick = async () => {
        const desc = document.getElementById('qe-desc').value.trim();
        const amount = parseFloat(document.getElementById('qe-amount').value);
        const date = document.getElementById('qe-date').value;

        if (!desc || !amount || amount <= 0) {
            return Toast.show("Datos inválidos", "error");
        }

        try {
            await SettlementService.registerQuickExpense({
                description: desc,
                amount: amount,
                category: 'Gasto Rápido',
                date: date
            });
            Toast.show("Gasto registrado", "success");
            SettlementView.toggleQuickExpenseModal(false);

            // Auto update preview if active
            if (currentSummary) {
                document.getElementById('btn-calc-preview').click();
            }
        } catch (err) {
            console.error(err);
            Toast.show("Error guardando gasto", "error");
        }
    };

    // 4. Edit Links Navigation (Delegation)
    document.getElementById('app-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            const tab = e.target.dataset.tab;
            const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
            if (navBtn) navBtn.click();
        }
    });

}
