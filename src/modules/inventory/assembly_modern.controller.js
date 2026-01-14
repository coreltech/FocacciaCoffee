import { InventoryService } from './inventory.service.js';
import { AssemblyModernView } from './assembly_modern.view.js';
import { Toast } from '../../ui/toast.js';

let products = [];
let allComponents = [];
let currentAssembly = [];
let selectedProduct = null;
let currentFilter = 'ALL';

export async function loadAssemblyModern() {
    const container = document.getElementById('app-content');

    // 1. Precise Data Loading (No hardcoding)
    const [pList, sList, rCosts] = await Promise.all([
        InventoryService.getCatalog(),
        InventoryService.getSupplies(),
        InventoryService.getRecipeCosts()
    ]);

    products = pList;

    // 2. Normalize and Prep Components (Smart Logic)
    const matches = (val, list) => list.some(p => val?.toLowerCase().includes(p.toLowerCase()));

    allComponents = [
        ...sList.map(s => {
            let cat = 'SUMINISTRO'; // Default
            if (matches(s.category, ['empaque', 'envase', 'packaging'])) cat = 'EMPAQUE';

            return {
                id: s.id,
                value: `S|${s.id}`,
                name: `📦 ${s.name} (${s.brand || 'Genérico'})`,
                category: cat,
                cost: parseFloat(s.last_purchase_price) / parseFloat(s.equivalence),
                unit: s.min_unit
            };
        }),
        ...rCosts.map(r => {
            let cat = 'TRADICIONAL'; // Default
            if (matches(r.tipo_receta, ['masa', 'panadera', 'formula'])) cat = 'PANADERA';
            if (matches(r.tipo_receta, ['tradicional', 'topping'])) cat = 'TRADICIONAL';

            return {
                id: r.recipe_id,
                value: `R|${r.recipe_id}`,
                name: `👩‍🍳 ${r.recipe_name}`,
                category: cat,
                cost: parseFloat(r.total_estimated_cost_1kg_base || 0) / 1000,
                unit: 'g/ml'
            };
        }),
        ...pList.map(p => ({
            id: p.id,
            value: `P|${p.id}`,
            name: `🛒 ${p.product_name}`,
            category: 'PRODUCTO',
            cost: parseFloat(p.precio_venta_final || 0),
            unit: 'Unid'
        }))
    ];

    console.log("🧩 COMPONENTES NORMALIZADOS:", allComponents);

    // Debug checks for empty categories
    const checkEmpty = (type, keywords) => {
        const found = allComponents.filter(c => c.category === type);
        if (found.length === 0) {
            console.warn(`⚠️ ATENCION: No se encontraron items para [${type}]. Busqué por palabras clave: ${keywords.join(', ')}`);
        }
    };
    checkEmpty('PANADERA', ['masa', 'panadera', 'formula']);
    checkEmpty('TRADICIONAL', ['tradicional', 'topping']);
    checkEmpty('EMPAQUE', ['empaque', 'envase', 'packaging']);
    checkEmpty('PRODUCTO', ['producto']);

    // 3. Render and Initial Selection if possible
    AssemblyModernView.renderLayout(container, products);
    bindGlobalEvents();
}

function bindGlobalEvents() {
    // Selection with Active State
    document.querySelectorAll('.product-card').forEach(card => {
        card.onclick = async () => {
            const id = card.dataset.id;
            selectedProduct = products.find(p => p.id == id);

            document.querySelectorAll('.product-card').forEach(c => c.style.borderColor = '#e2e8f0');
            card.style.borderColor = '#3b82f6';
            card.style.background = '#eff6ff';

            const composition = await InventoryService.getCatalogComposition(id);

            currentAssembly = composition.map(c => {
                const comp = allComponents.find(ac =>
                    (c.supply_id && ac.id === c.supply_id) ||
                    (c.recipe_id && ac.id === c.recipe_id) ||
                    (c.component_id && ac.id === c.component_id)
                );
                return {
                    supply_id: c.supply_id,
                    recipe_id: c.recipe_id,
                    component_id: c.component_id,
                    name: comp ? comp.name : (c.supply_id ? 'Suministro Eliminado' : 'Componente Eliminado'),
                    type: comp ? comp.category : '-',
                    quantity: parseFloat(c.quantity),
                    costPerUnit: comp ? comp.cost : 0,
                    unit: comp ? comp.unit : '-'
                };
            });

            document.getElementById('empty-state').style.display = 'none';
            document.getElementById('workspace').style.display = 'block';
            document.getElementById('current-p-name').innerText = selectedProduct.product_name;

            updateAssemblyTable();
        };
    });

    // Filters logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentFilter = btn.dataset.type;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AssemblyModernView.populateSelector(null, allComponents, currentFilter);
        };
    });

    // Selector Preview
    const selector = document.getElementById('comp-selector');
    selector.onchange = () => {
        const opt = selector.options[selector.selectedIndex];
        if (opt.value) {
            document.getElementById('comp-cost-preview').value = `$${parseFloat(opt.dataset.cost).toFixed(4)} / ${opt.dataset.unit}`;
        }
    };

    // Add Component
    document.getElementById('btn-add-comp').onclick = () => {
        const val = selector.value;
        const qty = parseFloat(document.getElementById('comp-qty').value);
        if (!val || isNaN(qty) || qty <= 0) return Toast.show("Selecciona componente y cantidad", "info");

        const opt = selector.options[selector.selectedIndex];
        const [type, id] = val.split('|');
        const compData = allComponents.find(c => c.value === val);

        currentAssembly.push({
            supply_id: type === 'S' ? id : null,
            recipe_id: type === 'R' ? id : null,
            component_id: type === 'P' ? id : null,
            name: compData.name,
            type: compData.category,
            quantity: qty,
            costPerUnit: compData.cost,
            unit: compData.unit
        });

        updateAssemblyTable();
        document.getElementById('comp-qty').value = "";
    };

    // Save Logic
    document.getElementById('btn-save-assembly').onclick = async () => {
        if (!selectedProduct) return;
        try {
            await InventoryService.saveCatalogComposition(selectedProduct.id, currentAssembly);
            Toast.show("✅ Estructura guardada con éxito.");
        } catch (e) {
            Toast.show("Error al guardar: " + e.message, "error");
        }
    };

    // Initial population
    AssemblyModernView.populateSelector(null, allComponents, 'ALL');

    // Global reset/new helper
    window.resetCatalogForm = () => {
        document.getElementById('catalog-form').reset();
        document.getElementById('c-id').value = "";
        document.getElementById('form-title').innerText = "Añadir Nuevo Producto";
    };
}

function updateAssemblyTable() {
    AssemblyModernView.renderTable(
        currentAssembly,
        parseFloat(selectedProduct.precio_venta_final),
        (idx) => {
            currentAssembly.splice(idx, 1);
            updateAssemblyTable();
        },
        (idx, newQty) => {
            // Total Reactivity: Update logic
            currentAssembly[idx].quantity = newQty;
            updateAssemblyTable();
        }
    );
}
