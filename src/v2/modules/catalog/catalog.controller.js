/**
 * Controlador V2 de Catálogo de Productos
 */
import { CatalogService } from './catalog.service.js';
import { CatalogView } from './catalog.view.js';
import { Store } from '../../core/store.js';
import { RecipesService } from '../recipes/recipes.service.js';
import { SuppliesService } from '../supplies/supplies.service.js';
import { Formatter } from '../../core/formatter.js';

export const CatalogController = {

    cachedCompOptions: '', // Opciones HTML precargadas de Masas e Insumos

    async render() {
        Store.update('isLoading', true);

        // Obtener catálogo vivo, tasas, recetas y suministros
        const [catalog, recipes, supplies] = await Promise.all([
            CatalogService.getCatalog(),
            RecipesService.getRecipes(),
            SuppliesService.getSupplies()
        ]);
        const rates = Store.state.rates;

        Store.update('isLoading', false);

        // Preparar el HTML del selector de componentes agrupado con Data-Attributes para Costeo Matemático
        let optionsHtml = '<optgroup label="Masas y Fórmulas">';
        recipes.forEach(r => {
            // En V2, el costo viene pre-calculado en r.calculated_cost_1kg
            const cost1kg = r.calculated_cost_1kg || 0;
            const recipeCostPerGram = cost1kg / 1000; // $/gramo
            optionsHtml += `<option value="R|${r.id}" data-price="${recipeCostPerGram}">👩‍🍳 ${r.name} (Por g)</option>`;
        });

        optionsHtml += '</optgroup><optgroup label="Insumos (Adornos/Empaques)">';
        supplies.forEach(s => {
            const unit = (s.measurement_unit || '').toLowerCase().trim();
            const equiv = (unit.includes('kg') || unit.includes('kilo') || unit === 'l' || unit.includes('litro')) ? 1000 : 1;
            optionsHtml += `<option value="S|${s.id}" data-price="${s.last_price || 0}" data-equiv="${equiv}">📦 ${s.name} (${s.measurement_unit || 'un'})</option>`;
        });
        optionsHtml += '</optgroup>';

        this.cachedCompOptions = optionsHtml;

        // --- CALCULO DE COSTOS PARA LA TABLA ---
        // Crear mapas para acceso rápido
        const recipeMap = new Map(recipes.map(r => [r.id, r.calculated_cost_1kg / 1000])); // Costo por gramo
        const supplyMap = new Map();
        supplies.forEach(s => {
            const unit = (s.measurement_unit || '').toLowerCase().trim();
            const equiv = (unit.includes('kg') || unit.includes('kilo') || unit === 'l' || unit.includes('litro')) ? 1000 : 1;
            supplyMap.set(s.id, (s.last_price || 0) / equiv); // Costo por unidad mínima (g/ml)
        });

        const catalogWithCosts = catalog.map(p => {
            let totalCost = 0;
            if (p.composition) {
                p.composition.forEach(item => {
                    const unitCost = item.recipe_id ? recipeMap.get(item.recipe_id) : supplyMap.get(item.supply_id);
                    totalCost += (unitCost || 0) * (item.quantity || 0);
                });
            }
            return { ...p, production_cost: totalCost };
        });

        return CatalogView.render(catalogWithCosts, rates);
    },

    initEvents() {
        // Importación dinámica interna para Storage
        const loadStorage = async () => {
            const { StorageService } = await import('../../core/storage.service.js');
            return StorageService;
        };

        const listContainer = document.getElementById('components-list-container');
        const emptyMsg = document.getElementById('empty-comp-msg');
        const btnAddCompPill = document.getElementById('btn-add-comp-pill');
        const compSelector = document.getElementById('comp-selector');
        const compQuantity = document.getElementById('comp-quantity');

        const priceInput = document.getElementById('cat-price');
        const liveCostDisplay = document.getElementById('live-cost-usd');
        const liveMarginDisplay = document.getElementById('live-margin-pct');
        const form = document.getElementById('form-new-product');
        const formTitle = document.getElementById('form-title');
        const catIdInput = document.getElementById('cat-id');

        const imageFileInput = document.getElementById('cat-image-file');
        const imageUrlInput = document.getElementById('cat-image-url');
        const imgPreview = document.getElementById('img-preview-container');
        const imgStatus = document.getElementById('img-status');

        // Poblar el selector de composición
        if (compSelector && this.cachedCompOptions) {
            compSelector.innerHTML = '<option value="">-- Selecciona Masa o Insumo --</option>' + this.cachedCompOptions;
        }

        // --- 1. MOTOR DE COSTEO EN VIVO ---
        const updateLiveCost = () => {
            let totalCost = 0;
            const pills = listContainer ? listContainer.querySelectorAll('.comp-pill') : [];

            pills.forEach(pill => {
                const cost = parseFloat(pill.getAttribute('data-total-cost')) || 0;
                totalCost += cost;
            });

            if (liveCostDisplay) liveCostDisplay.innerText = Formatter.formatCurrency(totalCost);

            const salePrice = parseFloat(priceInput?.value) || 0;
            if (salePrice > 0 && liveMarginDisplay) {
                const margin = ((salePrice - totalCost) / salePrice) * 100;
                liveMarginDisplay.innerText = `${margin.toFixed(1)}%`;
                liveMarginDisplay.style.color = margin > 30 ? 'var(--success-color)' : (margin > 0 ? 'var(--warning-color)' : 'var(--danger-color)');
            } else if (liveMarginDisplay) {
                liveMarginDisplay.innerText = '0%';
            }
        };

        if (priceInput) priceInput.addEventListener('input', updateLiveCost);

        // --- 2. GESTIÓN DE IMÁGENES (STORAGE PC) ---
        if (imageFileInput) {
            imageFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                imgStatus.innerText = "Subiendo...";
                imgStatus.style.color = "var(--primary-color)";

                const StorageService = await loadStorage();
                const res = await StorageService.uploadImage(file);

                if (res.success) {
                    imageUrlInput.value = res.url;
                    imgPreview.innerHTML = `<img src="${res.url}" style="width:100%; height:100%; object-fit:cover;">`;
                    imgStatus.innerText = "✅ Imagen lista.";
                    imgStatus.style.color = "var(--success-color)";
                } else {
                    imgStatus.innerText = "❌ Error: " + res.error;
                    imgStatus.style.color = "var(--danger-color)";
                }
            });
        }

        // --- 3. GESTIÓN DEL CARRITO (UI) ---
        const addPillToCart = (val, qty, name, basePrice, equiv) => {
            const isSupply = val.startsWith('S|');
            const costPerUnit = isSupply ? (basePrice / equiv) : basePrice;
            const itemTotalCost = costPerUnit * qty;

            if (emptyMsg) emptyMsg.style.display = 'none';

            const pill = document.createElement('div');
            pill.className = 'comp-pill';
            pill.setAttribute('data-val', val);
            pill.setAttribute('data-qty', qty);
            pill.setAttribute('data-total-cost', itemTotalCost);
            pill.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:8px;";

            pill.innerHTML = `
                <div style="flex:2;">
                    <strong style="font-size:0.85rem;">${name}</strong>
                    <div style="font-size:0.7rem; color:#64748b;">Cant: <span style="font-weight:bold;">${qty}</span></div>
                </div>
                <div style="flex:1; text-align:right; font-size:0.85rem; font-weight:bold; color:var(--primary-color);">${Formatter.formatCurrency(itemTotalCost)}</div>
                <div style="margin-left: 10px;">
                    <button type="button" class="btn-remove-pill" style="background:none; border:none; cursor:pointer; color:#ef4444; padding:2px;">🗑️</button>
                </div>
            `;

            pill.querySelector('.btn-remove-pill').addEventListener('click', () => {
                pill.remove();
                updateLiveCost();
                if (listContainer.querySelectorAll('.comp-pill').length === 0 && emptyMsg) {
                    emptyMsg.style.display = 'block';
                }
            });

            listContainer.appendChild(pill);
            updateLiveCost();
        };

        if (btnAddCompPill) {
            btnAddCompPill.addEventListener('click', () => {
                const val = compSelector.value;
                const qty = parseFloat(compQuantity.value);
                if (!val || isNaN(qty) || qty <= 0) {
                    alert('Selecciona un componente y una cantidad válida.');
                    return;
                }
                const opt = compSelector.options[compSelector.selectedIndex];
                addPillToCart(val, qty, opt.text, parseFloat(opt.getAttribute('data-price')), parseFloat(opt.getAttribute('data-equiv')) || 1);
                compQuantity.value = '';
            });
        }

        // --- 4. EDICIÓN Y GESTIÓN DE PRODUCTOS ---
        const table = document.getElementById('table-catalog');
        if (table) {
            table.addEventListener('click', async (e) => {
                // Editar
                const btnEdit = e.target.closest('.btn-edit-prod');
                if (btnEdit) {
                    try {
                        const id = btnEdit.getAttribute('data-id');
                        // Usar datos ya cargados si es posible para evitar lag
                        const products = await CatalogService.getCatalog();
                        const p = products.find(prod => prod.id === id);
                        if (!p) return;

                        // Cambiar Modo Formulario
                        formTitle.innerText = "✏️ Editando: " + p.name;
                        formTitle.style.color = "var(--primary-color)";
                        catIdInput.value = p.id;
                        document.getElementById('cat-name').value = p.name || '';
                        document.getElementById('cat-category').value = p.category || '';
                        document.getElementById('cat-price').value = p.price || 0;
                        document.getElementById('cat-stock').value = p.stock || 0;
                        imageUrlInput.value = p.image_url || '';

                        if (p.image_url) {
                            imgPreview.innerHTML = `<img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover;">`;
                            imgStatus.innerText = "Imagen cargada.";
                        } else {
                            imgPreview.innerHTML = `<span style="font-size:0.6rem; color:#94a3b8;">Sin Img</span>`;
                            imgStatus.innerText = "Sin imagen.";
                        }

                        // Cargar Composición
                        if (listContainer) listContainer.innerHTML = '';
                        const composition = await CatalogService.getComposition(p.id);
                        if (composition && composition.length > 0) {
                            composition.forEach(item => {
                                const val = item.recipe_id ? `R|${item.recipe_id}` : `S|${item.supply_id}`;
                                const opt = Array.from(compSelector.options).find(o => o.value === val);
                                if (opt) {
                                    addPillToCart(val, item.quantity, opt.text, parseFloat(opt.getAttribute('data-price')), parseFloat(opt.getAttribute('data-equiv')) || 1);
                                }
                            });
                        } else {
                            if (emptyMsg) emptyMsg.style.display = 'block';
                        }

                        form.scrollIntoView({ behavior: 'smooth' });
                    } catch (err) {
                        console.error("Error al cargar datos de edición:", err);
                        alert("No se pudieron cargar todos los datos del producto.");
                    }
                }

                // Desactivar
                const btnDisable = e.target.closest('.btn-disable-prod');
                if (btnDisable) {
                    const id = btnDisable.getAttribute('data-id');
                    if (confirm("¿Seguro que deseas sacar este producto del mostrador?")) {
                        const res = await CatalogService.deactivateProduct(id);
                        if (res.success) {
                            window.v2Router.currentView = null;
                            window.v2Router.navigate('catalogo', '🍞 Catálogo Prod.');
                        }
                    }
                }
            });
        }

        // --- 5. GUARDADO DUAL (CREAR / EDITAR) ---
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const id = catIdInput.value;
                const formData = {
                    product_name: document.getElementById('cat-name').value,
                    pos_category: document.getElementById('cat-category').value,
                    price_usd: document.getElementById('cat-price').value,
                    stock_disponible: document.getElementById('cat-stock').value,
                    image_url: imageUrlInput.value
                };

                const compositionItems = [];
                const pills = listContainer ? listContainer.querySelectorAll('.comp-pill') : [];
                pills.forEach(pill => {
                    const val = pill.getAttribute('data-val');
                    const [type, cid] = val.split('|');
                    compositionItems.push({
                        recipe_id: type === 'R' ? cid : null,
                        supply_id: type === 'S' ? cid : null,
                        quantity: parseFloat(pill.getAttribute('data-qty')) || 0
                    });
                });

                const btn = form.querySelector('button[type="submit"]');
                const ogText = btn.innerText;
                btn.innerText = "Guardando Datos..."; btn.disabled = true;

                let result;
                if (id) {
                    result = await CatalogService.updateProduct(id, formData, compositionItems);
                } else {
                    result = await CatalogService.createProduct(formData, compositionItems);
                }

                btn.innerText = ogText; btn.disabled = false;

                if (result.success) {
                    alert(id ? "Producto actualizado correctamente." : "Producto creado y vinculado.");
                    window.v2Router.currentView = null;
                    window.v2Router.navigate('catalogo', '🍞 Catálogo Prod.');
                } else {
                    alert("Error: " + result.error);
                }
            });
        }
    }
};
