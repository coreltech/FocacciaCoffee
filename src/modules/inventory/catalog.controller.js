import { InventoryService } from './inventory.service.js';
import { CatalogView } from './catalog.view.js';
import { getGlobalRates } from '../settings/settings.service.js';
import { supabase } from '../../core/supabase.js';
import { getCurrentRole } from '../../core/supabase.js';

let currentLogs = [];
let recipes = [];
let supplies = [];
let products = [];
let currentCost = 0;
let currentToppings = [];
let currentPackaging = [];
let showInactive = false; // Toggle for showing inactive products

export async function loadCatalog() {
    const container = document.getElementById('app-content');
    const isDirector = getCurrentRole() === 'director';

    // Multi Fetch
    const catalogPromise = showInactive && isDirector
        ? InventoryService.getCatalogWithInactive()
        : InventoryService.getCatalog();

    const [rates, productsData, recentLogs, recipesData, suppliesData, costsData] = await Promise.all([
        getGlobalRates(),
        catalogPromise,
        supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }),
        InventoryService.getRecipes(),
        InventoryService.getSupplies(),
        InventoryService.getCatalogCosts()
    ]);

    currentLogs = recentLogs.data || [];
    recipes = recipesData || [];
    supplies = suppliesData || [];
    products = productsData || [];

    CatalogView.renderLayout(container, rates, productsData, currentLogs.slice(0, 20), isDirector, showInactive, costsData || []);

    bindEvents(rates, isDirector);

    // Event Delegation for Table Actions
    const catalogBody = document.getElementById('catalog-body');
    if (catalogBody) {
        catalogBody.onclick = async (e) => {
            const target = e.target;

            // Edit
            const editBtn = target.closest('.btn-edit-prod');
            if (editBtn) {
                const item = JSON.parse(editBtn.dataset.item);
                openEdit(item);
                return;
            }

            // Delete
            const delBtn = target.closest('.btn-del-prod');
            if (delBtn) {
                if (confirm("¿Eliminar producto?")) {
                    try {
                        const result = await InventoryService.deleteCatalogItem(delBtn.dataset.id);
                        if (result._softDeleted) {
                            alert("⚠️ Producto desactivado (no eliminado)\n\nEste producto tiene historial de transacciones, por lo que fue marcado como inactivo en lugar de eliminarse.\n\nYa no aparecerá en el catálogo web, pero se conserva su historial.");
                        } else {
                            alert("✅ Producto eliminado correctamente.");
                        }
                        loadCatalog();
                    } catch (error) {
                        console.error('Delete error:', error);
                        if (error.message.includes('foreign key') || error.message.includes('registros relacionados')) {
                            alert("❌ No se puede eliminar este producto\n\nTiene transacciones de inventario asociadas. El producto será marcado como inactivo en su lugar.");
                            try {
                                await InventoryService.deleteCatalogItem(delBtn.dataset.id);
                                alert("✅ Producto desactivado correctamente.");
                                loadCatalog();
                            } catch (retryError) {
                                alert(`❌ Error al desactivar: ${retryError.message}`);
                            }
                        } else if (error.message.includes('policy') || error.message.includes('permisos')) {
                            alert("❌ No tienes permisos para eliminar productos.\n\nSolo usuarios con rol 'Director' o 'Gerente' pueden eliminar productos del catálogo.");
                        } else {
                            alert(`❌ Error al eliminar: ${error.message}`);
                        }
                    }
                }
                return;
            }

            // Reactivate
            const reactivateBtn = target.closest('.btn-reactivate-prod');
            if (reactivateBtn) {
                if (confirm("¿Reactivar este producto?")) {
                    try {
                        await InventoryService.reactivateCatalogItem(reactivateBtn.dataset.id);
                        alert("✅ Producto reactivado correctamente.\n\nEl producto volverá a aparecer en el catálogo web.");
                        loadCatalog();
                    } catch (error) {
                        console.error('Reactivate error:', error);
                        alert(`❌ Error al reactivar: ${error.message}`);
                    }
                }
                return;
            }

            // Force Delete
            const forceDelBtn = target.closest('.btn-force-del-prod');
            if (forceDelBtn) {
                const productName = forceDelBtn.dataset.name;
                if (confirm(`⚠️ ADVERTENCIA: ELIMINACIÓN PERMANENTE\n\n¿Estás seguro de eliminar PERMANENTEMENTE "${productName}"?\n\nEsta acción:\n✗ Eliminará el producto de la base de datos\n✗ Eliminará TODAS sus transacciones de inventario\n✗ NO SE PUEDE DESHACER\n\n¿Continuar?`)) {
                    if (confirm(`⚠️ ÚLTIMA CONFIRMACIÓN\n\n¿REALMENTE deseas eliminar permanentemente "${productName}" y TODO su historial?\n\nEscribe "ELIMINAR" para confirmar.`)) {
                        try {
                            const result = await InventoryService.forceDeleteCatalogItem(forceDelBtn.dataset.id);
                            alert(`✅ Producto eliminado permanentemente\n\n${result.deletedTransactions} transacciones de inventario fueron eliminadas junto con el producto.`);
                            loadCatalog();
                        } catch (error) {
                            console.error('Force delete error:', error);
                            alert(`❌ Error al eliminar permanentemente: ${error.message}`);
                        }
                    }
                }
                return;
            }
        };
    }

    // Bind inactive toggle (director only)
    const inactiveToggle = document.getElementById('toggle-inactive');
    if (inactiveToggle) {
        inactiveToggle.onchange = () => {
            showInactive = inactiveToggle.checked;
            loadCatalog();
        };
    }
}

async function openEdit(item) {
    document.getElementById('c-id').value = item.id;
    document.getElementById('c-name').value = item.product_name;
    document.getElementById('c-description').value = item.description || '';
    document.getElementById('c-price').value = item.precio_venta_final;
    document.getElementById('c-category').value = item.categoria || 'Focaccias';
    document.getElementById('c-icon').value = item.icon || '';
    document.getElementById('c-stock').value = item.stock_disponible || 0;
    document.getElementById('c-manual-cost').value = (item.costo_unitario_referencia || 0).toFixed(2);

    // Image Preview Handling
    const imgPreview = document.getElementById('c-image-preview');
    const imgContainer = document.getElementById('image-preview-container');
    const originalImgInput = document.getElementById('c-original-image');

    if (item.image_url) {
        imgPreview.src = item.image_url;
        imgContainer.style.display = 'block';
        originalImgInput.value = item.image_url;
    } else {
        imgContainer.style.display = 'none';
        originalImgInput.value = '';
    }

    // Reset Lists
    currentToppings = [];
    currentPackaging = [];

    // Load Composition from DB
    try {
        const composition = await InventoryService.getCatalogComposition(item.id);

        if (composition && composition.length > 0) {
            // Populate Calculator
            document.getElementById('enable-calculator').checked = true;

            composition.forEach(comp => {
                // 1. Base Recipe (Masa)
                if (comp.recipe_id && comp.recipes?.tipo_receta === 'MASA') {
                    document.getElementById('calc-base-recipe').value = comp.recipe_id;
                    document.getElementById('calc-base-weight').value = comp.quantity;
                }
                // 2. Toppings (Other Recipes, Components, supplies not packaging)
                else {
                    let type = '';
                    let id = '';
                    let name = '';
                    let cost = 0;
                    let isPackaging = false;

                    if (comp.recipe_id) {
                        type = 'R';
                        id = comp.recipe_id;
                        name = `👩‍🍳 ${comp.recipes.name}`;
                        const r = recipes.find(r => r.id === id);
                        cost = r ? getRecipeCostPerGram(r) : 0;
                    } else if (comp.component_id) {
                        type = 'P';
                        id = comp.component_id;
                        name = `🛒 ${comp.components.product_name}`;
                        cost = comp.components.precio_venta_final;
                    } else if (comp.supply_id) {
                        type = 'S';
                        id = comp.supply_id;
                        name = comp.supplies.name;
                        cost = comp.supplies.last_purchase_price / comp.supplies.equivalence;

                        // Heuristic for Packaging
                        if (name.toLowerCase().includes('caja') || name.toLowerCase().includes('envase') || name.toLowerCase().includes('bolsa') || name.toLowerCase().includes('servilleta')) {
                            isPackaging = true;
                        }
                    }

                    const itemObj = { id, type, name, quantity: comp.quantity, unit_cost: cost };

                    if (isPackaging) {
                        currentPackaging.push(itemObj);
                    } else {
                        currentToppings.push(itemObj);
                    }
                }
            });
        }
    } catch (err) {
        console.error("Error loading composition:", err);
    }

    renderCalculatorLists();

    CatalogView.toggleForm();
    document.getElementById('form-title').innerText = "Editar Producto";

    handleCategoryChange();

    // Trigger Sync
    const enableCalc = document.getElementById('enable-calculator');
    const calcPanel = document.getElementById('calculator-panel');
    const manualPanel = document.getElementById('manual-cost-panel');

    calcPanel.style.display = enableCalc.checked ? 'block' : 'none';
    manualPanel.style.display = enableCalc.checked ? 'none' : 'block';

    // Calculate cost after loading
    const simulatedEvent = new Event('input');
    document.getElementById('c-price').dispatchEvent(simulatedEvent);
}

function handleCategoryChange() {
    const category = document.getElementById('c-category').value;
    const stockInput = document.getElementById('c-stock');
    const hinte = document.getElementById('stock-hint');
    const iconPicker = document.getElementById('icon-picker');
    const iconSelectorGroup = document.getElementById('icon-selector-group');

    // Stock management
    if (category === 'Focaccias') {
        stockInput.disabled = true;
        stockInput.style.backgroundColor = "#f1f5f9";
        hinte.innerText = "⚠️ Stock gestionado por Producción (Bloqueado aquí).";
    } else {
        stockInput.disabled = false;
        stockInput.style.backgroundColor = "#fff";
        hinte.innerText = "✅ Stock manual habilitado para esta categoría.";
    }

    // Icon picker visibility - only show for Cafetería and Bebidas
    if (category === 'Cafetería' || category === 'Bebidas') {
        iconSelectorGroup.style.display = 'block';
        if (iconPicker) iconPicker.style.display = 'block';
    } else {
        iconSelectorGroup.style.display = 'none';
        if (iconPicker) iconPicker.style.display = 'none';
        // Clear icon if switching away from beverage categories
        document.getElementById('c-icon').value = '';
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
        o.dataset.cost = getRecipeCostPerGram(r); // Calculated cost per gram
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

    // Fix: Manually populate packaging to include 'S|' prefix and cost data
    packagingSelect.innerHTML = '<option value="">Seleccione...</option>';
    supplies.forEach(s => {
        const o = document.createElement('option');
        o.value = `S|${s.id}`;
        o.textContent = s.name;
        o.dataset.cost = s.last_purchase_price / s.equivalence;
        packagingSelect.appendChild(o);
    });

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

    // Icon Picker Events
    const iconInput = document.getElementById('c-icon');
    const clearIconBtn = document.getElementById('clear-icon-btn');
    const iconOptions = document.querySelectorAll('.icon-option');

    // Handle icon selection
    iconOptions.forEach(btn => {
        btn.onclick = () => {
            const selectedIcon = btn.dataset.icon;
            iconInput.value = selectedIcon;

            // Visual feedback - highlight selected
            iconOptions.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Handle clear icon
    if (clearIconBtn) {
        clearIconBtn.onclick = () => {
            iconInput.value = '';
            iconOptions.forEach(b => b.classList.remove('selected'));
        };
    }

    // Initialize category-based visibility
    handleCategoryChange();

    form.onsubmit = async (e) => {
        e.preventDefault();
        const prodId = document.getElementById('c-id').value;
        const file = document.getElementById('c-image').files[0];
        let imageUrl = null;

        try {
            if (file) {
                imageUrl = await InventoryService.uploadProductImage(file);
            } else {
                // Use existing image if not uploading new one
                imageUrl = document.getElementById('c-original-image').value || null;
            }

            const productData = {
                product_name: nameInput.value,
                description: document.getElementById('c-description').value.trim() || null,
                precio_venta_final: parseFloat(priceInput.value),
                costo_unitario_referencia: parseFloat(currentCost.toFixed(2)),
                categoria: categorySelect.value,
                icon: document.getElementById('c-icon').value.trim() || null,
                esta_activo: true,
                stock_disponible: parseFloat(document.getElementById('c-stock').value) || 0,
                image_url: imageUrl // Keep existing or use new
            };

            // Fix: Force UPDATE if ID exists by ensuring the ID field is present in the object
            if (prodId && prodId.trim() !== '') {
                productData.id = prodId;
                console.log('Updating product with ID:', prodId);
            } else {
                console.log('Creating new product');
            }

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
            console.error('Save error:', err);
            // Handle unique constraint violation (duplicate name)
            if (err.message.includes('sales_prices_product_name_key') || err.message.includes('409') || err.code === '23505') {
                alert("⚠️ Error: Ya existe un producto con este nombre.\n\nPor favor, elige un nombre diferente.");
            } else {
                alert("❌ Error al guardar: " + err.message);
            }
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

    // Fix: Validate that we actually got a type and id
    if (!type || !id) {
        console.error('Invalid item value:', val);
        alert("Error: El ítem seleccionado no es válido.");
        return;
    }

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
    if (recipe.name.includes('Tomates')) console.log('Calculating cost for:', recipe.name, recipe);
    if (!recipe.items || recipe.items.length === 0) return 0;

    let totalBatchCost = 0;
    let totalBatchWeight = 0;

    // Check if it's a Percentage-based recipe (implicitly or explicitly)
    const isPercentageBased = recipe.items.some(i => (i.percentage > 0 && (!i.quantity || i.quantity === 0)) || i.unit_type === '%');

    if (isPercentageBased) {
        const baseFlourWeight = 1000; // Standard base for calculation

        recipe.items.forEach(item => {
            let grams = parseFloat(item.quantity) || 0;
            const percentage = parseFloat(item.percentage) || 0;
            const costUnit = parseFloat(item.cost_per_unit_min) || 0; // Cost per GRAM usually

            if (item.unit_type === '%' || (percentage > 0 && grams === 0)) {
                grams = (percentage / 100) * baseFlourWeight;
            }

            totalBatchCost += grams * costUnit;
            totalBatchWeight += grams;
        });
    } else {
        // Standard logic for fixed weight recipes
        recipe.items.forEach(item => {
            const costUnit = parseFloat(item.cost_per_unit_min) || 0;
            const qty = parseFloat(item.quantity) || 0;
            totalBatchCost += qty * costUnit;
        });
        totalBatchWeight = parseFloat(recipe.expected_weight) || 0;

        // Fallback if expected_weight is missing but we calculated a sum
        if (totalBatchWeight === 0) {
            let sumQty = 0;
            recipe.items.forEach(i => sumQty += (parseFloat(i.quantity) || 0));
            totalBatchWeight = sumQty > 0 ? sumQty : 1000;
        }
    }

    if (totalBatchWeight === 0) return 0;
    return totalBatchCost / totalBatchWeight;
}
