/**
 * Controlador de Producción V2 (Orchestration Layer)
 * Centro de Control Quirúrgico: Maneja anidamiento, overrides y rendimientos.
 * v2.1.1 - 2026-02-25 (Debug Mode)
 */
import { ProductionService } from './production.service.js';
import { ProductionView } from './production.view.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { Formatter } from '../../core/formatter.js';

let state = {
    catalog: [],
    recipes: [],
    logs: [],
    currentSource: 'vitrina', // 'vitrina' o 'preparaciones'
    currentComposition: [],    // Ingredientes del item seleccionado
    currentOrderIds: null,     // IDs de órdenes a completar
    isFulfillingOrder: false  // Si es un encargo ya vendido
};

export async function loadProduction() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    ProductionView.render(container);
    await refreshData();
    bindEvents();
}

async function refreshData() {
    const prodData = await ProductionService.getProductionData();

    if (prodData.error) {
        alert("Error cargando datos: " + prodData.error + "\n\nVerifica que hayas ejecutado la migración 55 en Supabase.");
    }

    state.catalog = prodData.catalog || [];
    state.recipes = prodData.recipes || [];
    state.logs = prodData.logs || [];

    ProductionView.populateSelects(state.catalog, state.recipes);
    ProductionView.renderHistory(state.logs, handleDeleteLog);
}

function bindEvents() {
    const form = document.getElementById('form-production');
    const targetSelect = document.getElementById('prod-target-id');
    const sourceTypeInput = document.getElementById('prod-source-type');
    const expectedQtyInput = document.getElementById('prod-expected-qty');
    const actualQtyInput = document.getElementById('prod-actual-qty');
    const yieldStats = document.getElementById('yield-stats');

    // 1. MANEJO DE PESTAÑAS
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.currentSource = btn.dataset.tab;

            // Reset form and rebuild select
            form.reset();
            sourceTypeInput.value = state.currentSource; // Re-asignar después del reset

            ProductionView.populateSelects(state.catalog, state.recipes);
            ProductionView.renderSurgicalPanel([]);
            yieldStats.innerHTML = '';
        });
    });

    // 2. SELECCIÓN DE PRODUCTO / PREPARACIÓN
    targetSelect.onchange = async () => {
        const id = targetSelect.value;
        if (!id) {
            ProductionView.renderSurgicalPanel([]);
            expectedQtyInput.value = '';
            return;
        }

        let composition = [];
        let expectedQty = 0; // Declaración vital faltante

        if (state.currentSource === 'vitrina') {
            const item = state.catalog.find(x => x.id === id);
            expectedQty = 1;

            const rawComp = await CatalogService.getComposition(id);
            composition = rawComp.map(c => ({
                id: c.supply_id || c.recipe_id,
                type: c.supply_id ? 'SUPPLY' : 'RECIPE',
                name: c.supply_id ? (c.v2_supplies?.name || 'Insumo') : (c.v2_recipes?.name || 'Sub-Receta'),
                quantity: c.quantity
            }));
        } else {
            const recipe = state.recipes.find(x => x.id === id);
            expectedQty = recipe ? recipe.expected_weight : 0;

            // Cargar componentes de la receta CON is_base para escalado
            composition = (recipe.v2_recipe_items || []).map(ri => ({
                id: ri.supply_id || ri.sub_recipe_id,
                type: ri.supply_id ? 'SUPPLY' : 'RECIPE',
                name: ri.supply_id ? ri.v2_supplies?.name : 'Sub-Receta',
                quantity: ri.quantity,
                is_base: ri.is_base || ri.percentage === 100
            }));
        }

        state.currentComposition = composition;
        expectedQtyInput.value = expectedQty;
        actualQtyInput.value = expectedQty; // Sugerir rendimiento ideal

        ProductionView.renderSurgicalPanel(composition);
        calculateYield();
        bindSurgicalScaling(); // Vincular el escalado automático
    };

    // 2.5 ESCALADO DINÁMICO (QUIRÚRGICO)
    const bindSurgicalScaling = () => {
        const baseRow = document.querySelector('.override-row[data-is-base="true"]');
        if (!baseRow) return;

        const baseInput = baseRow.querySelector('.override-input');
        const originalBaseQty = parseFloat(baseRow.dataset.base);
        const originalExpectedTotal = parseFloat(expectedQtyInput.value);

        baseInput.addEventListener('input', () => {
            const newBaseQty = parseFloat(baseInput.value) || 0;
            if (originalBaseQty <= 0) return;

            const ratio = newBaseQty / originalBaseQty;

            // Escalar otros ingredientes
            document.querySelectorAll('.override-row').forEach(row => {
                if (row === baseRow) return;
                const input = row.querySelector('.override-input');
                const originalQty = parseFloat(row.dataset.base);
                const newIdeal = originalQty * ratio;
                input.value = newIdeal.toFixed(2);

                const label = row.querySelector('.ideal-label');
                if (label) label.innerText = `Ideal: ${Formatter.formatNumber(newIdeal)}`;
            });

            // Escalar rendimiento esperado
            const newExpectedTotal = originalExpectedTotal * ratio;
            expectedQtyInput.value = newExpectedTotal.toFixed(2);
            actualQtyInput.value = newExpectedTotal.toFixed(2); // Sugerir el nuevo total como real
            calculateYield();
        });
    };

    // 3. CÁLCULO DE RENDIMIENTO (YIELD)
    const calculateYield = () => {
        const expected = parseFloat(expectedQtyInput.value) || 0;
        const actual = parseFloat(actualQtyInput.value) || 0;

        if (expected > 0 && actual > 0) {
            const efficiency = (actual / expected) * 100;
            const diff = actual - expected;
            const color = efficiency < 95 ? '#ef4444' : (efficiency > 105 ? '#f59e0b' : '#10b981');

            yieldStats.innerHTML = `
                <div style="color:${color}; font-weight:bold;">
                    Eficiencia: ${efficiency.toFixed(1)}% <br>
                    <span style="font-size:0.75rem;">Variación: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} ${state.currentSource === 'vitrina' ? 'un' : 'g/ml'}</span>
                </div>
            `;
        } else {
            yieldStats.innerHTML = '';
        }
    };

    actualQtyInput.oninput = calculateYield;

    // 3.5 BOTONES DE EXPORTACIÓN
    const btnExportExcel = document.getElementById('btn-export-excel');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    if (btnExportExcel) {
        btnExportExcel.onclick = () => {
            const targetName = targetSelect.options[targetSelect.selectedIndex]?.text || 'receta';
            let csv = `Receta: ${targetName}\n`;
            csv += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
            csv += `Ingrediente,Cantidad Sugerida,Cantidad Escalada (Tu Ajuste)\n`;

            document.querySelectorAll('.override-row').forEach(row => {
                const name = row.querySelector('span:first-child').innerText.replace('⚓', '').trim();
                const ideal = row.dataset.base;
                const manual = row.querySelector('.override-input').value;
                csv += `"${name}",${ideal},${manual}\n`;
            });

            csv += `\nRendimiento Teórico:,${expectedQtyInput.value}\n`;

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `Produccion_${targetName.replace(/\s+/g, '_')}.csv`);
            link.click();
        };
    }

    if (btnExportPdf) {
        btnExportPdf.onclick = () => {
            window.print();
        };
    }

    // 4. REGISTRO QUIRÚRGICO (SUBMIT)
    form.onsubmit = async (e) => {
        e.preventDefault();
        const targetId = targetSelect.value;
        const actualQty = parseFloat(actualQtyInput.value);
        const expectedQty = parseFloat(expectedQtyInput.value);

        if (!targetId || isNaN(actualQty)) return;

        // Recolectar Overrides de Insumos
        const overrides = [];
        document.querySelectorAll('.override-row').forEach(row => {
            const input = row.querySelector('.override-input');
            const val = parseFloat(input.value);
            const base = parseFloat(row.dataset.base);

            // Solo añadir si hubo cambio significativo para no sobrecargar el JSON
            if (val !== base) {
                overrides.push({
                    id: row.dataset.id,
                    type: row.dataset.type,
                    qty: val
                });
            }
        });

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.innerText = "Procesando...";

        const prodData = {
            catalogId: state.currentSource === 'vitrina' ? targetId : null,
            recipeId: state.currentSource === 'preparaciones' ? targetId : null,
            actualQty,
            expectedQty,
            overrides,
            totalCost: 0, // El RPC puede recalcularlo o lo extendemos luego
            orderIds: state.currentOrderIds,
            isFulfillingOrder: state.isFulfillingOrder
        };

        const res = await ProductionService.registerQuirurgico(prodData);

        btn.disabled = false; btn.innerText = "🚀 Registrar Producción y Ajustar Stock";

        if (res.success) {
            const msg = state.isFulfillingOrder
                ? "✅ Encargo procesado con éxito. Se consumieron ingredientes pero no se alteró el stock de vitrina."
                : "✅ Producción registrada con éxito. Inventario actualizado.";
            alert(msg);

            await refreshData();
            form.reset();
            state.currentOrderIds = null;
            state.isFulfillingOrder = false;
            ProductionView.renderSurgicalPanel([]);
            yieldStats.innerHTML = '';
        } else {
            alert(`❌ Error en producción: ${res.error}`);
        }
    };
}


async function handleDeleteLog(id) {
    if (confirm('¿Eliminar log? (Esto es solo auditoría, no revierte stock)')) {
        const res = await ProductionService.deleteLog(id);
        if (res.success) await refreshData();
    }
}
