/**
 * Controlador V2 de Recetas (Fórmula Panadera)
 * Core Matemático y Manejo de Eventos UI.
 */
import { RecipesService } from './recipes.service.js';
import { RecipesView } from './recipes.view.js';
import { Store } from '../../core/store.js';
import { Formatter } from '../../core/formatter.js';

export const RecipesController = {

    cachedOptionsSet: {
        supplies: '',
        recipes: ''
    },

    async render() {
        Store.update('isLoading', true);

        // Obtener recetas guardadas y suministros para los dropdowns
        const rawData = await RecipesService.getSuppliesForDropdown();
        const recipes = await RecipesService.getRecipes();

        // Guardar en memoria temporal para la matemática en VIVO de JS (Precisión Quirúrgica)
        window.__cachedSuppliesV2 = rawData.supplies;
        window.__cachedRecipesV2 = recipes;

        // Generar HTML de opciones
        this.cachedOptionsSet.supplies = rawData.supplies.map(s =>
            `<option value="${s.id}" data-type="SUPPLY">${s.name} (${s.measurement_unit})</option>`
        ).join('');

        this.cachedOptionsSet.recipes = recipes.map(r =>
            `<option value="${r.id}" data-type="RECIPE">PREP: ${r.name} (${r.expected_weight}g/ml)</option>`
        ).join('');

        Store.update('isLoading', false);

        return RecipesView.render(recipes, rawData.supplies, Store.state.rates);
    },

    initEvents() {
        const listContainer = document.getElementById('ingredients-list-container');
        const emptyMsg = document.getElementById('empty-rows-msg');
        const btnAddIngredient = document.getElementById('btn-add-ingredient');
        const supplySelector = document.getElementById('supply-selector');
        const supplyPercentage = document.getElementById('supply-percentage');

        const baseWeightInput = document.getElementById('rec-base-weight');
        const baseSelect = document.getElementById('rec-base-supply');
        const form = document.getElementById('form-new-recipe');

        // Poblar el selector con categorización de Insumos vs Sub-Recetas
        if (supplySelector) {
            supplySelector.innerHTML = `
                <option value="">-- Selecciona Componente --</option>
                <optgroup label="Materia Prima (Insumos)">
                    ${this.cachedOptionsSet.supplies}
                </optgroup>
                <optgroup label="Preparaciones Intermedias (Sub-Recetas)">
                    ${this.cachedOptionsSet.recipes}
                </optgroup>
            `;
        }

        // --- 1. MOTOR MATEMÁTICO (FÓRMULA PANADERA RECURSIVA EN VIVO) ---
        const calculateFormula = () => {
            const baseWeight = parseFloat(baseWeightInput.value) || 0;
            const baseSelect = document.getElementById('rec-base-supply');

            let totalPercent = 100;
            let totalGrams = baseWeight;
            let totalCostUsd = 0;

            // 1.1 Costo del Ingrediente Base (el 100%)
            if (baseSelect && baseSelect.value && baseWeight > 0) {
                const s = window.__cachedSuppliesV2?.find(x => x.id === baseSelect.value);
                if (s && s.last_price) {
                    const unitStr = (s.measurement_unit || '').toLowerCase().trim();
                    const equiv = (unitStr.includes('kg') || unitStr.includes('kilo') || unitStr === 'l' || unitStr.includes('litro')) ? 1000 : 1;
                    const pricePerGram = s.last_price / equiv;
                    totalCostUsd += (pricePerGram * baseWeight);
                }
            }

            // 1.2 Iterar sobre el Carrito
            const pills = listContainer ? listContainer.querySelectorAll('.ingredient-pill') : [];

            pills.forEach(pill => {
                const percentage = parseFloat(pill.getAttribute('data-percentage')) || 0;
                const itemId = pill.getAttribute('data-id');
                const itemType = pill.getAttribute('data-type'); // SUPPLY o RECIPE

                const targetGrams = (percentage / 100) * baseWeight;
                const gramsSpan = pill.querySelector('.pill-calculated-grams');
                if (gramsSpan) gramsSpan.innerText = targetGrams > 0 ? Formatter.formatNumber(targetGrams) + 'g' : '0g';

                let itemCost = 0;
                if (itemId && targetGrams > 0) {
                    if (itemType === 'SUPPLY') {
                        const s = window.__cachedSuppliesV2?.find(x => x.id === itemId);
                        if (s && s.last_price) {
                            const unitStr = (s.measurement_unit || '').toLowerCase().trim();
                            const equiv = (unitStr.includes('kg') || unitStr.includes('kilo') || unitStr === 'l' || unitStr.includes('litro')) ? 1000 : 1;
                            itemCost = (s.last_price / equiv) * targetGrams;
                        }
                    } else if (itemType === 'RECIPE') {
                        const r = window.__cachedRecipesV2?.find(x => x.id === itemId);
                        if (r && r.calculated_cost_1kg) {
                            itemCost = (r.calculated_cost_1kg / 1000) * targetGrams;
                        }
                    }
                    totalCostUsd += itemCost;
                }

                const costSpan = pill.querySelector('.pill-calculated-cost');
                if (costSpan) costSpan.innerText = Formatter.formatCurrency(itemCost);

                totalPercent += percentage;
                totalGrams += targetGrams;
            });

            document.getElementById('total-percent').innerText = Formatter.formatNumber(totalPercent) + '%';
            document.getElementById('total-grams').innerText = Formatter.formatNumber(totalGrams) + ' g/ml';
            document.getElementById('total-cost-usd').innerText = Formatter.formatCurrency(totalCostUsd);

            const costPerGram = totalGrams > 0 ? (totalCostUsd / totalGrams) : 0;
            document.getElementById('cost-per-gram').innerText = `(${Formatter.formatCurrency(costPerGram, 5)} / gramo o ml)`;
        };

        if (baseWeightInput) baseWeightInput.addEventListener('input', calculateFormula);
        if (baseSelect) baseSelect.addEventListener('change', calculateFormula);

        // --- 2. GESTIÓN DEL CARRITO ---
        if (btnAddIngredient) {
            btnAddIngredient.addEventListener('click', () => {
                const id = supplySelector.value;
                const selectedOpt = supplySelector.options[supplySelector.selectedIndex];
                const type = selectedOpt?.getAttribute('data-type');
                const percentage = parseFloat(supplyPercentage.value);

                if (!id) { alert('Selecciona un componente.'); return; }
                if (isNaN(percentage) || percentage <= 0) { alert('Inserta un % válido.'); return; }

                if (emptyMsg) emptyMsg.style.display = 'none';

                const pill = document.createElement('div');
                pill.className = 'ingredient-pill';
                pill.setAttribute('data-id', id);
                pill.setAttribute('data-type', type);
                pill.setAttribute('data-percentage', percentage);
                pill.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:white; padding:10px 15px; border-radius:6px; border:1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";

                pill.innerHTML = `
                    <div style="flex:2;">
                        <strong style="color:#334155;">${selectedOpt.text}</strong>
                        <div style="font-size:0.75rem; color:#64748b;">Tipo: <span style="font-weight:bold;">${type === 'RECIPE' ? '📌 Prep.' : '📦 Insumo'}</span> | Aporte: <span style="color:#0f172a; font-weight:bold;">${percentage}%</span></div>
                    </div>
                    <div style="flex:1; text-align:right; font-size:0.9rem;" class="pill-calculated-grams">0g</div>
                    <div style="flex:1; text-align:right; font-size:0.9rem; font-weight:bold; color:var(--success-color);" class="pill-calculated-cost">$0.0000</div>
                    <div style="margin-left: 15px;">
                        <button type="button" class="btn-remove-pill" style="background:none; border:none; cursor:pointer; color:#ef4444; padding:5px;">🗑️</button>
                    </div>
                `;

                pill.querySelector('.btn-remove-pill').addEventListener('click', () => {
                    pill.remove();
                    calculateFormula();
                    if (listContainer.querySelectorAll('.ingredient-pill').length === 0) { if (emptyMsg) emptyMsg.style.display = 'block'; }
                });

                listContainer.appendChild(pill);
                supplyPercentage.value = '';
                supplySelector.focus();
                calculateFormula();
            });
        }

        // --- 3. GUARDADO ---
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const baseSupplyId = document.getElementById('rec-base-supply').value;
                const baseWeight = parseFloat(baseWeightInput.value) || 0;

                if (!baseSupplyId || baseWeight <= 0) { alert('Faltan datos del Ingrediente Ancla.'); return; }

                const recipeData = {
                    id: form.getAttribute('data-edit-id'),
                    name: document.getElementById('rec-name').value,
                    tipo_receta: document.getElementById('rec-type').value,
                    expected_weight: parseFloat(document.getElementById('total-grams').innerText) || baseWeight,
                    instructions: document.getElementById('rec-instructions').value
                };

                const itemsData = [{ id: baseSupplyId, percentage: 100, quantity: baseWeight, type: 'SUPPLY' }];
                const pills = listContainer ? listContainer.querySelectorAll('.ingredient-pill') : [];
                pills.forEach(pill => {
                    itemsData.push({
                        id: pill.getAttribute('data-id'),
                        type: pill.getAttribute('data-type'),
                        percentage: parseFloat(pill.getAttribute('data-percentage')),
                        quantity: (parseFloat(pill.getAttribute('data-percentage')) / 100) * baseWeight
                    });
                });

                const btn = form.querySelector('button[type="submit"]');
                const ogText = btn.innerText;
                btn.innerText = "Guardando..."; btn.disabled = true;

                const result = await RecipesService.saveRecipe(recipeData, itemsData);
                btn.innerText = ogText; btn.disabled = false;

                if (result.success) {
                    alert("Fórmula Guardada con Precisión Quirúrgica.");
                    window.v2Router.currentView = null;
                    window.v2Router.navigate('recetas', '📜 Recetas V2');
                } else {
                    alert("Error: " + result.error);
                }
            });
        }

        // --- 4. ACCIONES DE FILA ---
        document.querySelectorAll('.recipe-card').forEach(card => {
            card.querySelector('.btn-del-recipe')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("¿Borrar fórmula? Afectará costos de cascada.")) {
                    const res = await RecipesService.deleteRecipe(e.target.getAttribute('data-id'));
                    if (res.success) { window.v2Router.currentView = null; window.v2Router.navigate('recetas', '📜 Recetas V2'); }
                }
            });

            card.querySelector('.btn-edit-recipe')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.getAttribute('data-id');
                const r = window.__cachedRecipesV2?.find(x => x.id === id);
                if (!r) return;

                document.getElementById('rec-name').value = r.name;
                document.getElementById('rec-type').value = r.recipe_type;
                document.getElementById('rec-instructions').value = r.instructions || '';

                const baseItem = r.v2_recipe_items?.find(x => x.is_base);
                if (baseItem) {
                    document.getElementById('rec-base-supply').value = baseItem.supply_id;
                    document.getElementById('rec-base-weight').value = baseItem.quantity;
                }

                if (listContainer) listContainer.querySelectorAll('.ingredient-pill').forEach(p => p.remove());

                if (r.v2_recipe_items) {
                    r.v2_recipe_items.filter(x => !x.is_base).forEach(item => {
                        const targetId = item.supply_id || item.sub_recipe_id;
                        if (targetId) {
                            supplySelector.value = targetId;
                            supplyPercentage.value = item.percentage;
                            btnAddIngredient.click();
                        }
                    });
                }

                form.setAttribute('data-edit-id', r.id);
                form.querySelector('button[type="submit"]').innerText = "💾 Actualizar Fórmula";
                calculateFormula();
                form.scrollIntoView({ behavior: 'smooth' });
            });

            card.querySelector('.btn-view-instructions')?.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('view-rec-name-title').innerText = `📖 ${card.querySelector('strong').innerText}`;
                document.getElementById('view-rec-content').innerText = e.target.getAttribute('data-instructions') || 'Sin instrucciones.';
                document.getElementById('modal-view-instructions').style.display = 'flex';
            });
        });

        document.querySelectorAll('.btn-close-instructions').forEach(btn =>
            btn.addEventListener('click', () => document.getElementById('modal-view-instructions').style.display = 'none')
        );
    }
};
