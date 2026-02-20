import { InventoryService } from './inventory.service.js';
import { RecipesProView } from './recipes_pro.view.js';
import { SettingsService } from '../settings/settings.service.js';

let recipes = [];
let supplies = [];
let currentItems = [];
let editingId = null;
let bcvRate = 0;

export async function loadRecipesPro() {
    const container = document.getElementById('app-content');

    // 1. Data Loading
    const rates = await SettingsService.getGlobalRates();
    bcvRate = rates.tasa_usd_ves;

    supplies = await InventoryService.getSupplies();
    recipes = await InventoryService.getRecipes();

    // 2. Initial Render
    RecipesProView.renderLayout(container, supplies, recipes);
    RecipesProView.renderList(recipes, bcvRate, handleEdit, handleDelete);

    // 3. Bind Global Events
    bindEvents();
}

function bindEvents() {
    const btnNew = document.getElementById('btn-new-recipe');
    const btnExport = document.getElementById('btn-export-recipes'); // New Button
    const btnClose = document.getElementById('btn-close-form');
    const btnCancel = document.getElementById('btn-cancel-form');
    const btnSave = document.getElementById('btn-save-recipe');
    const btnAddItem = document.getElementById('btn-add-item');
    const typeSelector = document.getElementById('recipe-type');
    const baseWeightInput = document.getElementById('base-flour-weight');

    btnNew.onclick = () => {
        editingId = null;
        currentItems = [];
        RecipesProView.resetForm();
        RecipesProView.showForm(true);
        updateCalculations();
    };

    btnExport.onclick = () => {
        if (!recipes || recipes.length === 0) return alert("No hay recetas para exportar.");

        const csvRows = [];
        // Header
        csvRows.push("ID Receta,Nombre Receta,Tipo,Peso Final (g),Ingrediente,Es Base,Unidad,Cantidad,Porcentaje,Costo Unitario");

        recipes.forEach(r => {
            if (r.items && r.items.length > 0) {
                r.items.forEach(item => {
                    const row = [
                        r.id,
                        `"${r.name.replace(/"/g, '""')}"`, // Escape quotes
                        r.tipo_receta,
                        r.expected_weight || 0,
                        `"${item.name.replace(/"/g, '""')}"`,
                        item.is_base ? "SI" : "NO",
                        item.unit_type,
                        item.quantity,
                        item.percentage,
                        item.cost_per_unit_min
                    ];
                    csvRows.push(row.join(","));
                });
            } else {
                // Empty recipe
                const row = [
                    r.id,
                    `"${r.name.replace(/"/g, '""')}"`,
                    r.tipo_receta,
                    r.expected_weight || 0,
                    "", "NO", "", 0, 0, 0
                ];
                csvRows.push(row.join(","));
            }
        });

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `recetas_profesionales_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    btnClose.onclick = btnCancel.onclick = () => {
        RecipesProView.showForm(false);
    };

    typeSelector.onchange = () => {
        const isMasa = typeSelector.value === 'MASA';
        document.getElementById('bakers-base-section').style.display = isMasa ? 'block' : 'none';
        updateCalculations();
    };

    baseWeightInput.oninput = () => updateCalculations();

    btnAddItem.onclick = () => {
        const selector = document.getElementById('item-selector');
        const qtyInput = document.getElementById('item-qty');
        const unitSelector = document.getElementById('item-unit');
        const isBaseCheck = document.getElementById('item-is-base');

        const val = selector.value;
        if (!val) return alert("Seleccione un insumo o sub-receta");

        const qty = parseFloat(qtyInput.value);
        if (isNaN(qty)) return alert("Ingrese una cantidad válida");

        const [typePrefix, id] = val.split('|');
        const opt = selector.options[selector.selectedIndex];

        const newItem = {
            id: null, // Temporary
            name: opt.text,
            is_base: isBaseCheck.checked,
            unit_type: unitSelector.value,
            quantity: unitSelector.value === '%' ? 0 : qty,
            percentage: unitSelector.value === '%' ? qty : 0,
            cost_per_unit_min: parseFloat(opt.dataset.cost) || 0,
            supply_id: typePrefix === 'S' ? id : null,
            sub_recipe_id: typePrefix === 'R' ? id : null,
        };

        currentItems.push(newItem);
        updateCalculations();

        // Reset inputs
        qtyInput.value = "";
        isBaseCheck.checked = false;
    };

    btnSave.onclick = async () => {
        const name = document.getElementById('recipe-name').value.trim();
        const type = typeSelector.value;
        if (!name || currentItems.length === 0) return alert("Faltan datos obligatorios");

        const recipePayload = {
            name,
            tipo_receta: type,
            expected_weight: parseFloat(document.getElementById('recipe-expected-weight').value) || 0,
            pasos_preparacion: document.getElementById('recipe-steps').value
        };

        if (editingId) recipePayload.id = editingId;

        try {
            await InventoryService.saveRecipePro(recipePayload, currentItems);
            RecipesProView.showForm(false);
            recipes = await InventoryService.getRecipes();
            RecipesProView.renderList(recipes, bcvRate, handleEdit, handleDelete);
        } catch (err) {
            alert("Error al guardar: " + err.message);
        }
    };
}

function updateCalculations() {
    const type = document.getElementById('recipe-type').value;
    const baseWeight = parseFloat(document.getElementById('base-flour-weight').value) || 1000;

    RecipesProView.renderIngredientsTable(currentItems, type, baseWeight, (idx) => {
        currentItems.splice(idx, 1);
        updateCalculations();
    });

    // Update the Summary Analysis
    document.getElementById('summary-bcv-rate').innerText = `${bcvRate.toFixed(2)} Bs/$`;
}

function handleEdit(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;

    editingId = id;
    currentItems = r.items.map(it => ({
        ...it,
        quantity: parseFloat(it.quantity),
        percentage: parseFloat(it.percentage || 0),
        cost_per_unit_min: parseFloat(it.cost_per_unit_min || 0)
    }));

    RecipesProView.showForm(true);
    RecipesProView.fillForm(r);

    document.getElementById('bakers-base-section').style.display = r.tipo_receta === 'MASA' ? 'block' : 'none';

    updateCalculations();
}

async function handleDelete(id) {
    if (confirm("¿Borrar esta receta?")) {
        try {
            await InventoryService.deleteRecipe(id);
            recipes = await InventoryService.getRecipes();
            RecipesProView.renderList(recipes, bcvRate, handleEdit, handleDelete);
        } catch (err) {
            alert("Error al borrar: " + err.message);
        }
    }
}
