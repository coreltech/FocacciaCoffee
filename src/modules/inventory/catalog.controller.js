import { InventoryService } from './inventory.service.js';
import { CatalogView } from './catalog.view.js';
import { getGlobalRates } from '../settings/settings.service.js';
import { supabase } from '../../core/supabase.js';

let currentLogs = [];
let recipes = [];
let supplies = [];
let products = [];
let currentCost = 0;
let currentToppings = [];
let currentPackaging = [];

export async function loadCatalog() {
    const container = document.getElementById('app-content');

    // Multi Fetch
    const [rates, productsData, recentLogs, recipesData, suppliesData] = await Promise.all([
        getGlobalRates(),
        InventoryService.getCatalog(),
        supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }),
        InventoryService.getRecipes(),
        InventoryService.getSupplies()
    ]);

    currentLogs = recentLogs.data || [];
    recipes = recipesData || [];
    supplies = suppliesData || [];
    products = productsData || [];

    CatalogView.renderLayout(container, rates, productsData, currentLogs.slice(0, 20));

    bindEvents(rates);

    // Bind edit/delete
    document.querySelectorAll('.btn-edit-prod').forEach(b => {
        b.onclick = () => {
            const item = JSON.parse(b.dataset.item);
            openEdit(item);
        };
    });

    document.querySelectorAll('.btn-del-prod').forEach(b => {
        b.onclick = async () => {
            if (confirm("¿Eliminar producto?")) {
                await InventoryService.deleteCatalogItem(b.dataset.id);
                loadCatalog();
            }
        };
    });
}

function openEdit(item) {
    document.getElementById('c-id').value = item.id;
    document.getElementById('c-name').value = item.product_name;
    document.getElementById('c-description').value = item.description || '';
    document.getElementById('c-price').value = item.precio_venta_final;
    document.getElementById('c-category').value = item.categoria || 'Focaccias';
    document.getElementById('c-stock').value = item.stock_disponible || 0;
    document.getElementById('c-manual-cost').value = item.costo_unitario_referencia || 0;

    // Reset Calculator State (Improvement: Load previous state if saved in DB)
    currentToppings = [];
    currentPackaging = [];
    renderCalculatorLists();

    CatalogView.toggleForm();
    document.getElementById('form-title').innerText = "Editar Producto";

    handleCategoryChange();
    document.getElementById('c-price').dispatchEvent(new Event('input'));
}

function handleCategoryChange() {
    const category = document.getElementById('c-category').value;
    const stockInput = document.getElementById('c-stock');
    const hinte = document.getElementById('stock-hint');

    if (category === 'Focaccias') {
        stockInput.disabled = true;
        stockInput.style.backgroundColor = "#f1f5f9";
        hinte.innerText = "⚠️ Stock gestionado por Producción (Bloqueado aquí).";
    } else {
        stockInput.disabled = false;
        stockInput.style.backgroundColor = "#fff";
        hinte.innerText = "✅ Stock manual habilitado para esta categoría.";
    }
}

function bindEvents(rates) {
    const form = document.getElementById('catalog-form');
    const nameInput = document.getElementById('c-name');
    const priceInput = document.getElementById('c-price');
    const marginRange = document.getElementById('c-margin-range');
    const categorySelect = document.getElementById('c-category');

    // Calculator Elements
    const enableCalc = document.getElementById('enable-calculator');
    const calcPanel = document.getElementById('calculator-panel');
    const manualPanel = document.getElementById('manual-cost-panel');
    const manualCostInput = document.getElementById('c-manual-cost');

    const baseRecipeSelect = document.getElementById('calc-base-recipe');
    const baseWeightInput = document.getElementById('calc-base-weight');

    const toppingSelect = document.getElementById('calc-topping-select');
    const toppingQty = document.getElementById('calc-topping-qty');
    const btnAddTopping = document.getElementById('btn-add-topping');

    const packagingSelect = document.getElementById('calc-packaging-select');
    const packagingQty = document.getElementById('calc-packaging-qty');
    const btnAddPackaging = document.getElementById('btn-add-packaging');

    // Populate Selects
    fillSelect(baseRecipeSelect, recipes.filter(r => r.tipo_receta === 'MASA'), 'id', 'name');

    // Toppings can be Supplies or Recipes
    toppingSelect.innerHTML = '<option value="">Seleccione...</option>';
    const supplyGroup = document.createElement('optgroup');
    supplyGroup.label = "Insumos";
    supplies.forEach(s => {
        const o = document.createElement('option');
        o.value = `S|${s.id}`;
        o.textContent = s.name;
        o.dataset.cost = s.last_purchase_price / s.equivalence;
        toppingSelect.appendChild(o);
    });
    const recipeGroup = document.createElement('optgroup');
    recipeGroup.label = "Recetas (Toppings)";
    recipes.filter(r => r.tipo_receta !== 'MASA').forEach(r => {
        const o = document.createElement('option');
        o.value = `R|${r.id}`;
        o.textContent = `👩‍🍳 ${r.name}`;
        o.dataset.cost = 0; // Estimation placeholder
        toppingSelect.appendChild(o);
    });

    const productGroup = document.createElement('optgroup');
    productGroup.label = "Productos (Anidados)";
    products.forEach(p => {
        const o = document.createElement('option');
        o.value = `P|${p.id}`;
        o.textContent = `🛒 ${p.product_name}`;
        o.dataset.cost = p.precio_venta_final;
        toppingSelect.appendChild(o);
    });

    fillSelect(packagingSelect, supplies, 'id', 'name');

    // === Sync Logic ===
    const syncCalculations = () => {
        // Calculate Cost first
        if (enableCalc.checked) {
            currentCost = calculateTotalCost();
            document.getElementById('lbl-cost').innerText = `$${currentCost.toFixed(2)}`;
        } else {
            currentCost = parseFloat(manualCostInput.value) || 0;
            document.getElementById('lbl-cost').innerText = `$${currentCost.toFixed(2)}`;
        }

        const usd = parseFloat(priceInput.value) || 0;
        const currentRate = rates.tasa_usd_ves;
        document.getElementById('val-ves').innerText = (usd * currentRate).toFixed(2);
        document.getElementById('val-eur').innerText = (usd * currentRate / rates.tasa_eur_ves).toFixed(2);

        const lblMargin = document.getElementById('lbl-margin');
        if (currentCost > 0) {
            const margin = Math.round(((usd / currentCost) - 1) * 100);
            lblMargin.innerText = `${margin}%`;

            // Color Coding for Margin
            if (margin < 30) lblMargin.style.color = '#dc2626'; // Red
            else if (margin < 50) lblMargin.style.color = '#d97706'; // Orange
            else lblMargin.style.color = '#16a34a'; // Green

            // Only update range if it's not the active element (to avoid jumpiness)
            if (document.activeElement !== marginRange) {
                marginRange.value = Math.min(Math.max(margin, 0), 300);
            }
        } else {
            lblMargin.innerText = "--";
            lblMargin.style.color = "#2563eb";
        }
    };

    // Events
    enableCalc.onchange = () => {
        calcPanel.style.display = enableCalc.checked ? 'block' : 'none';
        manualPanel.style.display = enableCalc.checked ? 'none' : 'block';
        syncCalculations();
    };

    baseRecipeSelect.onchange = syncCalculations;
    baseWeightInput.oninput = syncCalculations;
    manualCostInput.oninput = syncCalculations;
    priceInput.oninput = syncCalculations;

    marginRange.oninput = (e) => {
        if (currentCost > 0) {
            const marginPct = parseFloat(e.target.value);
            priceInput.value = (currentCost * (1 + marginPct / 100)).toFixed(2);
            document.getElementById('lbl-margin').innerText = `${marginPct}%`;
            syncCalculations();
        }
    };

    // Add Items
    btnAddTopping.onclick = () => {
        addItem(currentToppings, toppingSelect, toppingQty);
        renderCalculatorLists();
        syncCalculations();
    };

    btnAddPackaging.onclick = () => {
        addItem(currentPackaging, packagingSelect, packagingQty);
        renderCalculatorLists();
        syncCalculations();
    };

    window.removeCalcItem = (type, index) => {
        if (type === 'topping') currentToppings.splice(index, 1);
        else currentPackaging.splice(index, 1);
        renderCalculatorLists();
        syncCalculations();
    };

    categorySelect.onchange = handleCategoryChange;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const prodId = document.getElementById('c-id').value;
        const file = document.getElementById('c-image').files[0];
        let imageUrl = null;

        try {
            if (file) {
                imageUrl = await InventoryService.uploadProductImage(file);
            }

            const productData = {
                product_name: nameInput.value,
                description: document.getElementById('c-description').value.trim() || null,
                precio_venta_final: parseFloat(priceInput.value),
                costo_unitario_referencia: currentCost,
                categoria: categorySelect.value,
                esta_activo: true,
                stock_disponible: parseFloat(document.getElementById('c-stock').value) || 0
            };

            if (imageUrl) productData.image_url = imageUrl;
            if (prodId) productData.id = prodId;

            const savedItem = await InventoryService.saveCatalogItem(productData);

            // NEW: Save Composition (Atomic Link)
            if (enableCalc.checked) {
                const compositionItems = [];
                // Base Recipe
                const baseId = baseRecipeSelect.value;
                const baseWeight = parseFloat(baseWeightInput.value) || 0;
                if (baseId && baseWeight > 0) {
                    compositionItems.push({ recipe_id: baseId, quantity: baseWeight });
                }
                // Toppings
                currentToppings.forEach(t => {
                    compositionItems.push({
                        supply_id: t.type === 'S' ? t.id : null,
                        recipe_id: t.type === 'R' ? t.id : null,
                        component_id: t.type === 'P' ? t.id : null,
                        quantity: t.quantity
                    });
                });
                // Packaging
                currentPackaging.forEach(p => {
                    compositionItems.push({ supply_id: p.id, quantity: p.quantity });
                });

                await InventoryService.saveCatalogComposition(savedItem.id, compositionItems);
            }

            alert("✅ Catálogo y Estructura actualizados.");
            loadCatalog();
        } catch (err) {
            alert("❌ Error: " + err.message);
        }
    };
}

// === Calculator Helpers ===

function fillSelect(select, items, valKey, textKey) {
    select.innerHTML = '<option value="">Seleccione...</option>' +
        items.map(i => `<option value="${i[valKey]}">${i[textKey]}</option>`).join('');
}

function addItem(array, select, qtyInput) {
    const val = select.value;
    const qty = parseFloat(qtyInput.value);

    if (!val || !qty) return;

    const [type, id] = val.split('|');
    let itemData = null;

    if (type === 'S') {
        itemData = supplies.find(s => s.id === id);
    } else if (type === 'R') {
        itemData = recipes.find(r => r.id === id);
    } else if (type === 'P') {
        // Find in products list (which we might need to make global or pass)
    }

    array.push({
        id: id,
        type: type, // 'S', 'R' or 'P'
        name: type === 'R' ? `👩‍🍳 ${itemData?.name || 'Receta'}` : (type === 'P' ? `🛒 ${select.options[select.selectedIndex].text.replace('🛒 ', '')}` : itemData?.name || 'Item'),
        quantity: qty,
        unit_cost: parseFloat(select.options[select.selectedIndex].dataset.cost) || 0
    });

    select.value = "";
    qtyInput.value = "";
}

function renderCalculatorLists() {
    const tList = document.getElementById('calc-toppings-list');
    const pList = document.getElementById('calc-packaging-list');

    const render = (arr, type) => arr.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-bottom:1px solid #f1f5f9; padding:3px;">
            <span>${item.name} (${item.quantity})</span>
            <span>
                $${(item.quantity * item.unit_cost).toFixed(3)}
                <span onclick="window.removeCalcItem('${type}', ${idx})" style="cursor:pointer; color:red; margin-left:5px;">✕</span>
            </span>
        </div>
    `).join('');

    tList.innerHTML = render(currentToppings, 'topping');
    pList.innerHTML = render(currentPackaging, 'packaging');
}

function calculateTotalCost() {
    let total = 0;

    // 1. Base Recipe Cost
    const baseId = document.getElementById('calc-base-recipe').value;
    const baseWeight = parseFloat(document.getElementById('calc-base-weight').value) || 0;

    if (baseId && baseWeight > 0) {
        const recipe = recipes.find(r => r.id === baseId);
        if (recipe) {
            const recipeCostPerGram = getRecipeCostPerGram(recipe);
            total += recipeCostPerGram * baseWeight;
        }
    }

    // 2. Toppings
    currentToppings.forEach(t => {
        total += t.quantity * t.unit_cost; // Check if Supply Unit Cost is per Gram or Unit?
        // Assumption: Users will align Unit Cost in Supplies with usage here. 
        // e.g., Cheese $5/kg ($0.005/g). If usage is 20g, cost is 0.1.
    });

    // 3. Packaging
    currentPackaging.forEach(p => {
        total += p.quantity * p.unit_cost;
    });

    return total;
}

function getRecipeCostPerGram(recipe) {
    if (!recipe.items || recipe.items.length === 0) return 0;

    // Calculate Total Recipe Cost
    let totalBatchCost = 0;

    recipe.items.forEach(item => {
        let costUnit = 0;

        if (item.supply_id && item.items) { // Is Supply
            // item.items in 'v_recipe_items_detailed' usually holds the Supply object due to alias
            // Wait, InventoryService uses: select('*, items:v_recipe_items_detailed!rel_parent_recipe(*)')
            // Let's assume standard structure or verify.
            // Actually, v_recipe_items_detailed has 'cost_per_unit_min' calculated.
            costUnit = parseFloat(item.cost_per_unit_min) || 0;
        } else {
            costUnit = parseFloat(item.cost_per_unit_min) || 0;
        }

        const qty = parseFloat(item.quantity) || 0;
        totalBatchCost += qty * costUnit;
    });

    // Cost Per Gram
    const expectedWeight = parseFloat(recipe.expected_weight) || 1000; // avoid div/0
    return totalBatchCost / expectedWeight;
}
