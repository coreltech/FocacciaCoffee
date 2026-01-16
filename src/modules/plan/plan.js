import { PlansService } from './plan.service.js';

let currentPlan = {
    id: null,
    name: '',
    planned_date: new Date().toISOString().split('T')[0],
    description: '',
    items: [] // { type:'recipe'|'supply', id, quantity(total), unitWeight?, unitCount?, name, price? }
};

let selectableItems = [];
let selectedItemMeta = null; // Track current selection type

export async function loadPlan() {
    const container = document.getElementById('app-content');

    // Initial Load
    selectableItems = await PlansService.getSelectableItems();
    const plansHistory = await PlansService.getPlans();

    renderLayout(container, plansHistory);
    attachGlobalListeners();
}

function renderLayout(container, history) {
    container.innerHTML = `
        <div class="planner-layout" style="display: grid; grid-template-columns: 260px 1fr; gap: 20px; height: calc(100vh - 80px);">
            <!-- Sidebar: History -->
            <aside style="background: white; border-right: 1px solid #e2e8f0; padding: 20px; overflow-y: auto;">
                <button id="btn-new-plan" class="btn-primary" style="width: 100%; margin-bottom: 20px;">+ Nuevo Plan</button>
                <h3 style="font-size: 0.9rem; color: #64748b; text-transform: uppercase; margin-bottom: 10px;">Historial</h3>
                <div id="plans-list" style="display: flex; flex-direction: column; gap: 10px;">
                    ${history.map(p => `
                        <div class="plan-item" data-id="${p.id}" style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1; cursor: pointer;" onclick="window.viewPlanDetails('${p.id}')">
                                    <div style="font-weight: bold; color: #334155;">${p.name}</div>
                                    <div style="font-size: 0.8rem; color: #94a3b8;">${new Date(p.planned_date).toLocaleDateString()}</div>
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <button onclick="window.editPlan('${p.id}')" title="Editar plan" style="background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; font-size: 0.85rem;">✏️</button>
                                    <button onclick="window.deletePlan('${p.id}')" title="Eliminar plan" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; font-size: 0.85rem;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </aside>

            <!-- Main: Editor -->
            <main style="padding: 20px; overflow-y: auto;">
                <!-- Header -->
                <header style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 20px;">
                        <!-- Left: Plan Info -->
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <input type="text" id="plan-name" placeholder="Nombre del Plan (ej. Jornada Viernes)" value="${currentPlan.name}" 
                                    style="font-size: 1.2rem; font-weight: bold; border: none; border-bottom: 2px solid #e2e8f0; padding: 5px; flex: 1; outline: none;">
                                <input type="date" id="plan-date" value="${currentPlan.planned_date}" 
                                    style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
                            </div>
                            <textarea id="plan-description" placeholder="Motivo o descripción (opcional)" 
                                style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; resize: none; font-size: 0.9rem; color: #64748b; height: 45px; font-family: inherit;">${currentPlan.description || ''}</textarea>
                        </div>
                        <!-- Right: Save Button -->
                        <div>
                            <button id="btn-save-plan" class="btn-secondary" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">💾 Guardar</button>
                        </div>
                    </div>
                </header>

                    <!-- Product Input Section -->
                    <section style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">➕ Agregar Producto</h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <!-- Selector -->
                            <div>
                                <label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px; font-weight: 600;">Receta o Insumo</label>
                                <input list="product-list" id="sel-product-input" placeholder="Buscar..." 
                                    style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 0.95rem; background: white;">
                                <datalist id="product-list">
                                    ${selectableItems.map(i => `<option value="${i.label}">${i.type === 'recipe' ? '🍞' : '📦'} ${i.label}</option>`).join('')}
                                </datalist>
                            </div>

                            <!-- Dynamic Inputs (Grid for Recipe, Single for Supply) -->
                            <div id="dynamic-inputs" style="display: grid; grid-template-columns: auto auto; gap: 30px; justify-content: start;">
                                <!-- Placeholder -->
                            </div>

                            <!-- Add Button -->
                            <button id="btn-add-item" class="btn-primary" style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 600;">
                                ➕ Agregar al Plan
                            </button>
                        </div>
                    </section>

                <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 20px;">
                    <!-- Items Table -->
                    <section style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <h3 style="margin-top: 0; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">📋 Planificación</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; color: #64748b; font-size: 0.8rem; text-transform:uppercase;">
                                    <th style="padding: 10px;">Ítem</th>
                                    <th style="padding: 10px;">Gramos/Und</th>
                                    <th style="padding: 10px;">Unidades</th>
                                    <th style="padding: 10px; text-align:right;">Subtotal</th>
                                    <th style="padding: 10px;"></th>
                                </tr>
                            </thead>
                            <tbody id="plan-items-body">
                                <!-- Dynamic Items -->
                            </tbody>
                        </table>
                    </section>

                    <!-- Results Panel -->
                    <section id="results-panel" style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; display:flex; flex-direction:column; gap:15px;">
                        <div style="text-align: center; color: #94a3b8; padding: 40px;">Agrega recetas para calcular costos...</div>
                    </section>
                </div>
            </main>
        </div>
    `;

    // History Logic
    document.querySelectorAll('.plan-item').forEach(el => {
        el.onclick = async () => {
            const id = el.dataset.id;
            const fullHistory = await PlansService.getPlans();
            const plan = fullHistory.find(p => p.id === id);
            if (plan) loadExistingPlan(plan);
        };
    });
}

function attachGlobalListeners() {
    const inputSel = document.getElementById('sel-product-input');
    const dynamicContainer = document.getElementById('dynamic-inputs');

    // Detect Input Change to Switch Dynamic Fields
    inputSel.addEventListener('input', (e) => {
        const val = e.target.value;
        const selectedOption = selectableItems.find(i => i.label === val);
        selectedItemMeta = selectedOption;

        if (selectedOption && selectedOption.type === 'recipe') {
            // SHOW DOUBLE INPUTS (Recipe)
            dynamicContainer.innerHTML = `
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px; font-weight: 600;">Gramaje (g)</label>
                    <input type="number" id="inp-weight" value="${selectedOption.base || 0}" 
                        style="width: 180px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 0.95rem; background: #f8fafc;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px; font-weight: 600;">Unidades</label>
                    <input type="number" id="inp-units" placeholder="0" 
                        style="width: 180px; padding: 12px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 0.95rem;">
                </div>
            `;
            // Focus on units
            setTimeout(() => document.getElementById('inp-units').focus(), 50);

        } else {
            // SHOW SINGLE INPUT (Supply)
            dynamicContainer.innerHTML = `
                <div style="grid-column: 1 / -1;">
                    <label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px; font-weight: 600;">Cantidad</label>
                    <input type="number" id="inp-simple-qty" placeholder="0" 
                        style="width: 100%; max-width: 300px; padding: 12px; border: 2px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem;">
                </div>
            `;
        }
    });

    // ADD ITEM Logic
    document.getElementById('btn-add-item').onclick = () => {
        if (!selectedItemMeta) return alert('Seleccione un ítem válido primero');

        let totalQty = 0;
        let details = {};

        if (selectedItemMeta.type === 'recipe') {
            const w = parseFloat(document.getElementById('inp-weight').value) || 0;
            const u = parseFloat(document.getElementById('inp-units').value) || 0;
            if (w <= 0 || u <= 0) return alert('Gramaje y Unidades son obligatorios');

            totalQty = w * u; // Total grams
            details = { unitWeight: w, unitCount: u };
        } else {
            const q = parseFloat(document.getElementById('inp-simple-qty').value) || 0;
            if (q <= 0) return alert('Cantidad obligatoria');
            totalQty = q;
        }

        // Add Logic
        // Remove existing equal item to replace/update? Or just push? 
        // Professional planner allows multiple entries (e.g. 10x250g and 5x500g of same dough). 
        // So we just push new entry.

        currentPlan.items.push({
            type: selectedItemMeta.type,
            id: selectedItemMeta.id,
            name: selectedItemMeta.label,
            quantity: totalQty,
            ...details
        });

        renderItems();
        runSimulation();

        // Reset Inputs
        inputSel.value = '';
        selectedItemMeta = null;
        dynamicContainer.innerHTML = '';
    };

    // Save
    document.getElementById('btn-save-plan').onclick = async () => {
        currentPlan.name = document.getElementById('plan-name').value;
        currentPlan.planned_date = document.getElementById('plan-date').value;
        currentPlan.description = document.getElementById('plan-description').value;

        if (!currentPlan.name || currentPlan.items.length === 0) {
            alert('⚠️ Debes agregar un nombre y al menos un producto.');
            return;
        }

        try {
            await PlansService.savePlan(currentPlan);
            alert('Plan guardado exitosamente');
            // Refresh
            const history = await PlansService.getPlans();
            const container = document.getElementById('app-content');
            renderLayout(container, history);
            attachGlobalListeners();
            loadExistingPlan(currentPlan);
        } catch (e) {
            alert('Error al guardar: ' + e.message);
        }
    };

    // New Plan
    document.getElementById('btn-new-plan').onclick = () => {
        currentPlan = { id: null, name: '', planned_date: new Date().toISOString().split('T')[0], items: [] };
        // Reset UI
        document.getElementById('plan-name').value = '';
        document.getElementById('plan-date').value = new Date().toISOString().split('T')[0];
        renderItems();
        document.getElementById('results-panel').innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 40px;">Inicia tu plan...</div>';
    };
}

// Global functions for plan management
window.editPlan = async (planId) => {
    try {
        const plan = await PlansService.getPlanById(planId);
        if (!plan) {
            alert('❌ Plan no encontrado');
            return;
        }

        // Load plan into editor
        currentPlan = {
            id: plan.id,
            name: plan.name,
            planned_date: plan.planned_date,
            description: plan.description || '',
            items: plan.items || []
        };

        document.getElementById('plan-name').value = plan.name;
        document.getElementById('plan-date').value = plan.planned_date;
        document.getElementById('plan-description').value = plan.description || '';

        renderItems();

        // Auto-recalculate costs
        if (currentPlan.items.length > 0) {
            await runSimulation();
        }

        alert('✅ Plan cargado en el editor. Puedes modificarlo y guardarlo.');
    } catch (error) {
        console.error('Error loading plan:', error);
        alert('❌ Error al cargar el plan');
    }
};

window.deletePlan = async (planId) => {
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este plan de producción?');

    if (!confirmed) return;

    try {
        await PlansService.deletePlan(planId);
        alert('✅ Plan eliminado exitosamente');
        // Refresh the entire layout to update the history list
        const history = await PlansService.getPlans();
        const container = document.getElementById('app-content');
        renderLayout(container, history);
        attachGlobalListeners(); // Re-attach listeners after re-rendering layout
        // If the deleted plan was the one currently being edited, clear the editor
        if (currentPlan.id === planId) {
            currentPlan = { id: null, name: '', planned_date: new Date().toISOString().split('T')[0], items: [] };
            document.getElementById('plan-name').value = '';
            document.getElementById('plan-date').value = new Date().toISOString().split('T')[0];
            renderItems();
            document.getElementById('results-panel').innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 40px;">Inicia tu plan...</div>';
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
        alert('❌ Error al eliminar el plan');
    }
};

window.viewPlanDetails = async (planId) => {
    // For now, just edit the plan when clicking on it
    window.editPlan(planId);
};
function loadExistingPlan(plan) {
    currentPlan = { ...plan };
    // Hydrate names
    currentPlan.items = currentPlan.items.map(i => {
        const found = selectableItems.find(x => x.id === i.id && x.type === i.type);
        return { ...i, name: found ? found.label : i.name };
    });

    document.getElementById('plan-name').value = currentPlan.name;
    document.getElementById('plan-date').value = currentPlan.planned_date;
    renderItems();
    runSimulation();
}

function renderItems() {
    const tbody = document.getElementById('plan-items-body');
    tbody.innerHTML = currentPlan.items.map((item, idx) => {
        // Simulation Data
        const sim = item.simulationData || {};
        // Cost Display
        const costStr = sim.calculatedCost
            ? `$${sim.calculatedCost.toFixed(2)}`
            : '<span style="color:#cbd5e1">-</span>';

        const warningIcon = (sim.warnings && sim.warnings.length > 0) ? `<span title="${sim.warnings.join(', ')}" style="cursor:help;">⚠️</span>` : '';

        // Cells Data
        let colUnitWeight = '-';
        let colUnits = '-';

        if (item.type === 'recipe' && item.unitWeight) {
            colUnitWeight = `${item.unitWeight}g`;
            colUnits = `${item.unitCount}`; // Units
        } else {
            colUnits = `${item.quantity}`; // Just quantity
        }

        // Breakdown HTML - FORCE RENDERING even if cost is 0
        let breakdownRows = '';
        if (sim.breakdown && sim.breakdown.length > 0) {
            const hasWarnings = sim.breakdown.some(b => b.hasPrice === false);
            const bgColor = hasWarnings ? '#fff7ed' : '#f1f5f9'; // Orange tint if warnings
            const borderColor = hasWarnings ? '#fb923c' : 'transparent';

            breakdownRows = `
                <div style="margin-top:5px; padding:5px; background:${bgColor}; border-radius:4px; font-size:0.75rem; color:#64748b; border: 1px solid ${borderColor};">
                    <div style="font-weight:bold; margin-bottom:2px; color: ${hasWarnings ? '#ea580c' : '#64748b'};">
                        ${hasWarnings ? '⚠️ ' : ''}Ingredientes:
                    </div>
                    ${sim.breakdown.map(b => {
                const warningStyle = b.hasPrice === false ? 'color:#ea580c; font-weight:bold;' : '';
                const priceDisplay = b.hasPrice === false ? '⚠️ Sin precio' : `$${b.cost.toFixed(2)}`;
                const percentageBadge = b.isPercentage ? `<span style="background:#0369a1; color:white; padding:1px 4px; border-radius:3px; font-size:0.65rem; margin-left:4px;">${b.percentage}%</span>` : '';
                return `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="${warningStyle}">${b.name} (${b.qty.toFixed(0)}${b.unit})${percentageBadge}</span>
                            <span style="${warningStyle}">${priceDisplay}</span>
                        </div>
                    `;
            }).join('')}
                </div>
            `;
        }

        return `
        <tr style="border-bottom: 1px solid #f1f5f9; vertical-align:top;">
            <td style="padding: 10px;">
                <div style="font-weight:500; color:#334155;">${item.name} ${warningIcon}</div>
                <div style="font-size:0.7rem; color:${item.type === 'recipe' ? '#f97316' : '#65a30d'}; text-transform:uppercase; font-weight:bold;">${item.type}</div>
                ${breakdownRows}
            </td>
            <td style="padding: 10px; color:#475569;">${colUnitWeight}</td>
            <td style="padding: 10px; color:#475569;">${colUnits}</td>
            <td style="padding: 10px; text-align:right; font-weight:bold; color:#0f172a;">${costStr}</td>
            <td style="padding: 10px; text-align: right;">
                <button onclick="window.removePlanItem(${idx})" style="color: #cbd5e1; background: none; border: none; cursor: pointer; font-size:1.1rem; padding:5px;">✕</button>
            </td>
        </tr>
    `}).join('');
}

// Global Remove
window.removePlanItem = (idx) => {
    currentPlan.items.splice(idx, 1);
    renderItems();
    runSimulation();
};

async function runSimulation() {
    if (currentPlan.items.length === 0) {
        document.getElementById('results-panel').innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 40px;">Agrega items...</div>';
        return;
    }

    document.getElementById('results-panel').innerHTML = '<div style="text-align:center;">Calculando... ⏳</div>';

    const results = await PlansService.calculateSimulation(currentPlan.items);
    const f = results.financials;

    // UPDATE TABLE WITH BREAKDOWN
    // We match results.items by index (assuming order is preserved, which it is in logic)
    // NOTE: This approach causes re-render of inputs? No, inputs are in `renderItems` which reads `currentPlan.items`.
    // We need to injection "simulation data" into `renderItems`.
    // Better: We augment currentPlan.items with simulation data for display and re-render the list.

    if (results.items && results.items.length === currentPlan.items.length) {
        results.items.forEach((resItem, idx) => {
            currentPlan.items[idx].simulationData = {
                cost: resItem.calculatedCost,
                breakdown: resItem.breakdown,
                warnings: resItem.warnings
            };
        });
        renderItems(); // Refreshes table with new Cost/Breakdown info
    }

    document.getElementById('results-panel').innerHTML = `
        <h3 style="margin-top:0; color:#1e293b; display:flex; align-items:center; gap:8px;">
            📊 Inversión Total
        </h3>
        
        <div style="background: #1e293b; color:white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align:center; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing:1px; font-weight:bold;">COSTO MATERIA PRIMA</div>
            <div style="font-size: 2.2rem; font-weight: bold; color: #fbbf24; margin-top:5px;">$${f.totalInvestment.toFixed(2)}</div>
        </div>

        <h4 style="margin-bottom: 10px; border-top: 1px solid #e2e8f0; padding-top: 15px; color:#334155;">🛒 Lista de Compras Consolidada</h4>
        
        <div style="overflow-y: auto; border: 1px solid #e2e8f0; border-radius:6px; background:white; max-height: 400px;">
        ${results.shoppingList.length === 0
            ? '<div style="padding:20px; text-align:center; color: #94a3b8;">No hay ingredientes en la lista.</div>'
            : `<table style="width:100%; font-size: 0.85rem; border-collapse: collapse;">
                <thead style="background:#f8fafc; color:#64748b; position: sticky; top: 0;">
                    <tr>
                        <th style="padding:10px; text-align:left; font-weight:600;">Ingrediente</th>
                        <th style="padding:10px; text-align:right; font-weight:600;">Cantidad Total</th>
                        <th style="padding:10px; text-align:right; font-weight:600;">Costo Estimado</th>
                    </tr>
                </thead>
                <tbody>
                ${results.shoppingList.map(i => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:10px; color: #334155; font-weight:500;">${i.name}</td>
                        <td style="padding:10px; text-align:right; color: #0369a1; font-weight:bold;">${i.required.toFixed(1)} ${i.unit}</td>
                        <td style="padding:10px; text-align:right; color: #16a34a; font-weight:600;">$${i.costOfRequirement.toFixed(2)}</td>
                    </tr>
                `).join('')}
                </tbody>
                <tfoot style="background:#f8fafc; font-weight:bold;">
                    <tr>
                        <td style="padding:10px; color:#1e293b;">TOTAL</td>
                        <td style="padding:10px; text-align:right;"></td>
                        <td style="padding:10px; text-align:right; color:#16a34a; font-size:1.1rem;">$${f.totalInvestment.toFixed(2)}</td>
                    </tr>
                </tfoot>
               </table>`
        }
        </div>

        <div style="margin-top:15px; display:flex; gap:10px;">
           <button id="btn-export-wa" class="btn-primary" style="flex:1; padding:12px; font-size:0.9rem; background: #25D366; color: white; border: none; border-radius:6px; font-weight:bold;">📤 Copiar para WhatsApp</button>
           <button id="btn-export-pdf" class="btn-primary" style="flex:1; padding:12px; font-size:0.9rem; background: #dc2626; color: white; border: none; border-radius:6px; font-weight:bold;">📄 Descargar PDF</button>
           <button id="btn-export-excel" class="btn-primary" style="flex:1; padding:12px; font-size:0.9rem; background: #16a34a; color: white; border: none; border-radius:6px; font-weight:bold;">📊 Exportar a Excel</button>
           <button id="btn-toggle-debug" class="btn-secondary" style="padding:12px 20px; font-size:0.85rem; background: #64748b; color: white; border: none; border-radius:6px;">🔍 Ver Detalles Técnicos</button>
        </div>

        <!-- 🔍 DEBUG CONSOLE (HIDDEN BY DEFAULT) -->
        <div id="debug-console" style="display:none; margin-top: 20px; border: 2px solid #3b82f6; border-radius: 8px; background: #eff6ff; padding: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0; color: #1e40af;">🔍 Consola de Depuración</h4>
                <button id="btn-close-debug" style="background:none; border:none; color:#1e40af; cursor:pointer; font-size:1.2rem;">✕</button>
            </div>
            <div style="padding: 15px; background: #1e293b; color: #e2e8f0; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.75rem; max-height: 400px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6;">
${results.debugLog ? results.debugLog.join('\n') : 'No hay datos de depuración disponibles'}
            </div>
        </div>
    `;

    // Toggle Debug Console
    document.getElementById('btn-toggle-debug').onclick = () => {
        const debugConsole = document.getElementById('debug-console');
        debugConsole.style.display = debugConsole.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('btn-close-debug').onclick = () => {
        document.getElementById('debug-console').style.display = 'none';
    };

    // WhatsApp Export
    document.getElementById('btn-export-wa').onclick = () => {
        const header = `*📋 PLAN DE PRODUCCIÓN*\n${currentPlan.name}\n📅 ${currentPlan.planned_date}\n\n`;

        const shoppingListText = `*🛒 LISTA DE COMPRAS*\n` +
            results.shoppingList.map(i => `• ${i.required.toFixed(1)}${i.unit} ${i.name} - $${i.costOfRequirement.toFixed(2)}`).join('\n');

        const summary = `\n\n*💰 INVERSIÓN TOTAL*\n$${f.totalInvestment.toFixed(2)} USD`;

        const fullMsg = encodeURIComponent(header + shoppingListText + summary);
        window.open(`https://wa.me/?text=${fullMsg}`, '_blank');
    };

    // PDF Export
    document.getElementById('btn-export-pdf').onclick = async () => {
        await generateProductionPDF(currentPlan, results, f.totalInvestment);
    };

    // Excel Export
    document.getElementById('btn-export-excel').onclick = async () => {
        await generateProductionExcel(currentPlan, results, f.totalInvestment);
    };
}

// PDF Generation Function
async function generateProductionPDF(plan, results, totalInvestment) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to sanitize text (remove emojis and special chars)
    const sanitizeText = (text) => {
        if (!text) return '';
        // Remove emojis and keep only ASCII + basic Latin chars
        return text
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
            .replace(/[^\x00-\x7F\u00C0-\u00FF]/g, '') // Keep ASCII + Latin-1
            .trim();
    };

    // ENCABEZADO
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FOCACCIA PLUS & COFFEE', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(14);
    doc.text('Plan de Produccion', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Plan: ${sanitizeText(plan.name)}`, margin, yPos);
    doc.text(`Fecha: ${new Date(plan.planned_date).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // SECCION 1: PRODUCTOS A PRODUCIR
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS A PRODUCIR', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Tabla de productos
    plan.items.forEach(item => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        const itemText = item.type === 'recipe'
            ? `${item.unitCount || 1} unidades x ${item.unitWeight || item.quantity}g - ${sanitizeText(item.name)}`
            : `${item.quantity}${item.unit || 'g'} - ${sanitizeText(item.name)}`;

        doc.text(`- ${itemText}`, margin + 5, yPos);
        yPos += 6;
    });

    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // SECCION 2: LISTA DE COMPRAS CONSOLIDADA
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTA DE COMPRAS CONSOLIDADA', margin, yPos);
    yPos += 8;

    // Encabezados de tabla
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingrediente', margin + 5, yPos);
    doc.text('Cantidad', margin + 100, yPos);
    doc.text('Costo USD', margin + 150, yPos, { align: 'right' });
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Filas de ingredientes
    doc.setFont('helvetica', 'normal');
    results.shoppingList.forEach(item => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        doc.text(sanitizeText(item.name), margin + 5, yPos);
        doc.text(`${item.required.toFixed(1)} ${item.unit}`, margin + 100, yPos);
        doc.text(`${item.costOfRequirement.toFixed(2)}`, margin + 150, yPos, { align: 'right' });
        yPos += 6;
    });

    yPos += 2;
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margin + 5, yPos);
    doc.text(`${totalInvestment.toFixed(2)}`, margin + 150, yPos, { align: 'right' });
    yPos += 10;

    // SECCION 3: FINANCIERO
    doc.setFontSize(12);
    doc.text('RESUMEN FINANCIERO', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Obtener tasa BCV
    const bcvRate = await getBCVRate();
    const totalVES = totalInvestment * bcvRate;

    doc.text(`Inversion Total (USD): ${totalInvestment.toFixed(2)}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Tasa BCV: ${bcvRate.toFixed(2)} VES/USD`, margin + 5, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Inversion Total (VES): ${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 5, yPos);

    // NOTA AL PIE
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Plan generado por el Sistema de Gestion Focaccia & Coffee', pageWidth / 2, 285, { align: 'center' });

    // Guardar PDF
    const fileName = `Plan_${sanitizeText(plan.name).replace(/\s+/g, '_')}_${plan.planned_date}.pdf`;
    doc.save(fileName);
}

// Helper function to get BCV rate
async function getBCVRate() {
    try {
        const { supabase } = await import('../../core/supabase.js');
        const { data } = await supabase
            .from('exchange_rates')
            .select('tasa_usd_ves')
            .order('fecha', { ascending: false })
            .limit(1)
            .single();

        return data?.tasa_usd_ves || 36.50; // Fallback
    } catch (error) {
        console.error('Error fetching BCV rate:', error);
        return 36.50; // Fallback
    }
}

// Excel/CSV Export Function
async function generateProductionExcel(plan, results, totalInvestment) {
    // Get BCV rate for VES conversion
    const bcvRate = await getBCVRate();

    // CSV Header with BOM for UTF-8 encoding
    let csvContent = '\uFEFF'; // UTF-8 BOM

    // METADATA ROWS
    csvContent += `FOCACCIA PLUS & COFFEE\n`;
    csvContent += `Plan de Produccion: ${plan.name}\n`;
    csvContent += `Fecha: ${new Date(plan.planned_date).toLocaleDateString()}\n`;
    csvContent += `\n`; // Empty row

    // HEADERS
    csvContent += `Ingrediente,Cantidad Total,Unidad,Costo Estimado (USD),Costo Estimado (VES)\n`;

    // DATA ROWS - Shopping List
    results.shoppingList.forEach(item => {
        const costVES = item.costOfRequirement * bcvRate;
        csvContent += `${escapeCSV(item.name)},${item.required.toFixed(2)},${item.unit},${item.costOfRequirement.toFixed(2)},${costVES.toFixed(2)}\n`;
    });

    // TOTAL ROW
    csvContent += `\n`; // Empty row
    const totalVES = totalInvestment * bcvRate;
    csvContent += `TOTAL,,,${totalInvestment.toFixed(2)},${totalVES.toFixed(2)}\n`;

    // FINANCIAL SUMMARY
    csvContent += `\n`; // Empty row
    csvContent += `RESUMEN FINANCIERO\n`;
    csvContent += `Inversion Total (USD),${totalInvestment.toFixed(2)}\n`;
    csvContent += `Tasa BCV (VES/USD),${bcvRate.toFixed(2)}\n`;
    csvContent += `Inversion Total (VES),${totalVES.toFixed(2)}\n`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Plan_${plan.name.replace(/\s+/g, '_')}_${plan.planned_date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}