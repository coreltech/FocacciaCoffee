import { PurchasesService } from './purchases.service.js';
import { SuppliersService } from './suppliers.service.js';
import { PurchasesView } from './purchases.view.js';
import { SettingsService } from '../settings/settings.service.js';

/**
 * Controlador principal del módulo de compras
 */

let currentSuppliers = [];
let currentSupplies = [];
let currentPurchaseItems = [];
let currentBcvRate = 0;
let currentSupplier = null;

export async function loadPurchases() {
    const container = document.getElementById('app-content');

    try {
        // Renderizar estructura principal
        container.innerHTML = PurchasesView.renderMain();

        // Configurar tabs
        setupTabs();

        // Cargar datos iniciales
        await loadPurchasesTab();

        // Configurar event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error cargando módulo de compras:', error);
        container.innerHTML = `
            <div class="stat-card" style="border: 2px solid #ef4444;">
                <h3 style="color: #dc2626;">Error al cargar módulo</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Actualizar estado activo
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Cargar contenido del tab
            const tab = btn.dataset.tab;
            if (tab === 'purchases') {
                await loadPurchasesTab();
            } else if (tab === 'suppliers') {
                await loadSuppliersTab();
            }
        });
    });
}

async function loadPurchasesTab() {
    const tabContent = document.getElementById('tab-content');
    tabContent.innerHTML = '<div class="loading">Cargando compras...</div>';

    try {
        const purchases = await PurchasesService.getAll();
        tabContent.innerHTML = PurchasesView.renderPurchasesList(purchases);

        // Event listeners para acciones de compras
        document.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', () => viewPurchaseDetails(btn.dataset.id));
        });

        document.getElementById('btn-new-purchase-empty')?.addEventListener('click', openNewPurchaseModal);

    } catch (error) {
        console.error('Error cargando compras:', error);
        tabContent.innerHTML = `<div class="error-message">Error cargando compras: ${error.message}</div>`;
    }
}

async function loadSuppliersTab() {
    const tabContent = document.getElementById('tab-content');
    tabContent.innerHTML = '<div class="loading">Cargando proveedores...</div>';

    try {
        currentSuppliers = await SuppliersService.getAll();
        tabContent.innerHTML = PurchasesView.renderSuppliersList(currentSuppliers);

        // Event listeners para acciones de proveedores
        document.querySelectorAll('[data-action="edit-supplier"]').forEach(btn => {
            btn.addEventListener('click', () => editSupplier(btn.dataset.id));
        });

        document.querySelectorAll('[data-action="manage-locations"]').forEach(btn => {
            btn.addEventListener('click', () => manageLocations(btn.dataset.id));
        });

        document.getElementById('btn-new-supplier-empty')?.addEventListener('click', openNewSupplierModal);

    } catch (error) {
        console.error('Error cargando proveedores:', error);
        tabContent.innerHTML = `<div class="error-message">Error cargando proveedores: ${error.message}</div>`;
    }
}

function setupEventListeners() {
    document.getElementById('btn-new-supplier')?.addEventListener('click', openNewSupplierModal);
    document.getElementById('btn-new-purchase')?.addEventListener('click', openNewPurchaseModal);
}

// ============================================
// GESTIÓN DE PROVEEDORES
// ============================================

async function openNewSupplierModal() {
    document.getElementById('supplier-modal')?.remove();

    const modalHtml = PurchasesView.renderSupplierForm();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('close-supplier-modal').addEventListener('click', closeSupplierModal);
    document.getElementById('cancel-supplier').addEventListener('click', closeSupplierModal);
    document.getElementById('supplier-form').addEventListener('submit', handleSupplierSubmit);
}

async function editSupplier(id) {
    document.getElementById('supplier-modal')?.remove();

    const supplier = await SuppliersService.getById(id);
    const modalHtml = PurchasesView.renderSupplierForm(supplier);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('close-supplier-modal').addEventListener('click', closeSupplierModal);
    document.getElementById('cancel-supplier').addEventListener('click', closeSupplierModal);

    const form = document.getElementById('supplier-form');
    form.dataset.supplierId = id;
    form.addEventListener('submit', handleSupplierSubmit);
}

async function handleSupplierSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const supplierData = Object.fromEntries(formData);
    const supplierId = form.dataset.supplierId;

    try {
        if (supplierId) {
            await SuppliersService.update(supplierId, supplierData);
            showNotification('Proveedor actualizado exitosamente', 'success');
        } else {
            await SuppliersService.create(supplierData);
            showNotification('Proveedor creado exitosamente', 'success');
        }

        closeSupplierModal();
        await loadSuppliersTab();

    } catch (error) {
        console.error('Error guardando proveedor:', error);

        let msg = error.message;
        if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('suppliers_tax_id_key')) {
            msg = 'Ya existe un proveedor registrado con ese RIF/Cédula.';
        }

        showNotification('Error: ' + msg, 'error');
    }
}

function closeSupplierModal() {
    document.getElementById('supplier-modal')?.remove();
}

// ============================================
// GESTIÓN DE UBICACIONES
// ============================================

async function manageLocations(supplierId) {
    currentSupplier = await SuppliersService.getById(supplierId);
    const locations = await SuppliersService.getLocations(supplierId);

    const modalHtml = PurchasesView.renderLocationsModal(currentSupplier, locations);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('close-locations-modal').addEventListener('click', closeLocationsModal);
    document.getElementById('location-form').addEventListener('submit', handleLocationSubmit);

    document.querySelectorAll('[data-action="delete-location"]').forEach(btn => {
        btn.addEventListener('click', () => deleteLocation(btn.dataset.id));
    });
}

async function handleLocationSubmit(e) {
    e.preventDefault();

    const locationData = {
        supplier_id: currentSupplier.id,
        location_name: document.getElementById('location-name').value,
        address: document.getElementById('location-address').value,
        city: document.getElementById('location-city').value,
        state: document.getElementById('location-state').value,
        postal_code: document.getElementById('location-postal').value,
        is_main: document.getElementById('location-is-main').checked
    };

    try {
        await SuppliersService.createLocation(locationData);
        showNotification('Ubicación agregada exitosamente', 'success');

        // Recargar modal
        closeLocationsModal();
        await manageLocations(currentSupplier.id);

    } catch (error) {
        console.error('Error creando ubicación:', error);
        showNotification('Error al crear ubicación: ' + error.message, 'error');
    }
}

async function deleteLocation(id) {
    if (!confirm('¿Está seguro de eliminar esta ubicación?')) return;

    try {
        await SuppliersService.deleteLocation(id);
        showNotification('Ubicación eliminada', 'success');

        // Recargar modal
        closeLocationsModal();
        await manageLocations(currentSupplier.id);

    } catch (error) {
        console.error('Error eliminando ubicación:', error);
        showNotification('Error al eliminar ubicación: ' + error.message, 'error');
    }
}

function closeLocationsModal() {
    document.getElementById('locations-modal')?.remove();
}

// ============================================
// GESTIÓN DE COMPRAS
// ============================================

async function openNewPurchaseModal() {
    try {
        // Cargar datos necesarios
        currentSuppliers = await SuppliersService.getAll();
        currentSupplies = await PurchasesService.getSupplies();
        const rates = await SettingsService.getGlobalRates();
        currentBcvRate = rates.tasa_usd_ves;
        currentPurchaseItems = [];

        const modalHtml = PurchasesView.renderPurchaseForm(currentSuppliers, currentSupplies, currentBcvRate);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        setupPurchaseFormListeners();

    } catch (error) {
        console.error('Error abriendo formulario de compra:', error);
        showNotification('Error al abrir formulario: ' + error.message, 'error');
    }
}

function setupPurchaseFormListeners() {
    document.getElementById('close-purchase-modal').addEventListener('click', closePurchaseModal);
    document.getElementById('cancel-purchase').addEventListener('click', closePurchaseModal);
    document.getElementById('purchase-form').addEventListener('submit', handlePurchaseSubmit);

    document.getElementById('purchase-supplier').addEventListener('change', (e) => {
        loadSupplierLocations(e);
        checkLastPurchaseAvailability(e.target.value);
    });

    // Agregar item
    document.getElementById('btn-add-item').addEventListener('click', addPurchaseItem);

    // Cargar última compra
    document.getElementById('btn-load-last-purchase').addEventListener('click', loadLastPurchaseItems);

    // Actualizar totales cuando cambia la tasa BCV
    document.getElementById('purchase-bcv-rate').addEventListener('input', updateTotals);

    // Configurar lógica de cálculo de items
    setupItemCalculationListeners();
}

async function checkLastPurchaseAvailability(supplierId) {
    const btn = document.getElementById('btn-load-last-purchase');
    if (!supplierId) {
        btn.style.display = 'none';
        return;
    }
    // We show it optimistically or could check if one exists. 
    // for simplicity, always show if supplier selected, handle "no data" on click.
    btn.style.display = 'block';
}

async function loadLastPurchaseItems() {
    const supplierId = document.getElementById('purchase-supplier').value;
    if (!supplierId) return;

    if (!confirm("⚠️ Esto reemplazará los items actuales. ¿Desea continuar?")) return;

    try {
        const lastPurchase = await PurchasesService.getLastPurchaseBySupplier(supplierId);

        if (!lastPurchase || !lastPurchase.items || lastPurchase.items.length === 0) {
            alert("No se encontró una compra anterior para este proveedor.");
            return;
        }

        // Map items
        currentPurchaseItems = lastPurchase.items.map(item => ({
            supply_id: item.supply_id,
            supply_name: item.supply?.name || 'Desconocido',
            supply_unit: item.supply?.unit || 'Unid',
            brand_description: item.brand_description,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            subtotal: item.quantity * item.unit_price_usd
        }));

        renderPurchaseItems();
        showNotification(`✅ Se cargaron ${currentPurchaseItems.length} items.`, 'success');

    } catch (err) {
        console.error(err);
        showNotification("Error cargando última compra", "error");
    }
}

function setupItemCalculationListeners() {
    const supplySelect = document.getElementById('item-supply');
    const usePresCheck = document.getElementById('item-use-presentation');
    const lblUsePres = document.getElementById('lbl-use-presentation');
    const lblQty = document.getElementById('lbl-item-quantity');
    const qtyInput = document.getElementById('item-quantity');
    const totalInput = document.getElementById('item-total');
    const totalBsInput = document.getElementById('item-total-bs');
    const priceInput = document.getElementById('item-price');

    // 1. Al cambiar suministro
    supplySelect.addEventListener('change', () => {
        const option = supplySelect.options[supplySelect.selectedIndex];
        const unit = option.dataset.unit || '';
        const purchaseUnit = option.dataset.purchaseUnit;
        const equivalence = parseFloat(option.dataset.equivalence) || 0;

        // Reset inputs
        qtyInput.value = '';
        totalInput.value = '';
        totalBsInput.value = '';
        priceInput.value = '';
        usePresCheck.checked = false;

        // Configurar toggle de presentación
        if (purchaseUnit && equivalence > 0) {
            lblUsePres.style.display = 'block';
            lblUsePres.querySelector('span').textContent = `${purchaseUnit} = ${equivalence}${unit}`;
            usePresCheck.disabled = false;
        } else {
            lblUsePres.style.display = 'none';
            usePresCheck.disabled = true;
        }

        updateLabels();
    });

    // 2. Al cambiar modo presentación
    usePresCheck.addEventListener('change', () => {
        updateLabels();
        calculateUnitPrice();
    });

    // 3. Listeners de Inputs
    qtyInput.addEventListener('input', calculateUnitPrice);

    // Si cambia Total USD -> Calcula Bs y Unit
    totalInput.addEventListener('input', () => {
        const usdVal = parseFloat(totalInput.value) || 0;
        const rate = parseFloat(document.getElementById('purchase-bcv-rate').value) || 1;
        totalBsInput.value = (usdVal * rate).toFixed(2);
        calculateUnitPrice();
    });

    // Si cambia Total Bs -> Calcula USD y Unit
    totalBsInput.addEventListener('input', () => {
        const bsVal = parseFloat(totalBsInput.value) || 0;
        const rate = parseFloat(document.getElementById('purchase-bcv-rate').value) || 1;
        if (rate > 0) {
            totalInput.value = (bsVal / rate).toFixed(2);
            calculateUnitPrice();
        }
    });

    function updateLabels() {
        const option = supplySelect.options[supplySelect.selectedIndex];
        if (!option.value) return;

        const unit = option.dataset.unit;
        const purchaseUnit = option.dataset.purchaseUnit;

        if (usePresCheck.checked && purchaseUnit) {
            lblQty.textContent = `Cantidad (${purchaseUnit})`;
            qtyInput.placeholder = "Ej: 1, 10, 0.5";
        } else {
            lblQty.textContent = `Cantidad (${unit})`;
            qtyInput.placeholder = "Ej: 500, 1000";
        }
    }

    function calculateUnitPrice() {
        const qty = parseFloat(qtyInput.value) || 0;
        const total = parseFloat(totalInput.value) || 0;

        if (qty <= 0) {
            priceInput.value = '';
            return;
        }

        // Determinar cantidad real en unidad base
        let realQty = qty;
        if (usePresCheck.checked) {
            const option = supplySelect.options[supplySelect.selectedIndex];
            const equivalence = parseFloat(option.dataset.equivalence) || 1;
            realQty = qty * equivalence;
        }

        if (realQty > 0) {
            const unitCost = total / realQty;
            priceInput.value = unitCost.toFixed(6); // Más decimales para precisión
        }
    }
}

async function loadSupplierLocations(e) {
    const supplierId = e.target.value;
    const locationSelect = document.getElementById('purchase-location');

    if (!supplierId) {
        locationSelect.disabled = true;
        locationSelect.innerHTML = '<option value="">Primero seleccione un proveedor</option>';
        return;
    }

    try {
        const locations = await SuppliersService.getLocations(supplierId);

        if (locations.length === 0) {
            locationSelect.innerHTML = '<option value="">No hay ubicaciones registradas</option>';
            locationSelect.disabled = true;
            showNotification('Este proveedor no tiene ubicaciones. Agregue una primero.', 'warning');
            return;
        }

        locationSelect.disabled = false;
        locationSelect.innerHTML = '<option value="">Seleccione una ubicación</option>' +
            locations.map(loc => `
                <option value="${loc.id}">
                    ${loc.address}, ${loc.city} ${loc.is_main ? '(Principal)' : ''}
                </option>
            `).join('');

        // Auto-seleccionar la principal si existe
        const mainLocation = locations.find(loc => loc.is_main);
        if (mainLocation) {
            locationSelect.value = mainLocation.id;
        }

    } catch (error) {
        console.error('Error cargando ubicaciones:', error);
        showNotification('Error al cargar ubicaciones', 'error');
    }
}

function addPurchaseItem() {
    const supplySelect = document.getElementById('item-supply');
    const brandInput = document.getElementById('item-brand');
    const quantityInput = document.getElementById('item-quantity');
    const totalInput = document.getElementById('item-total');
    const priceInput = document.getElementById('item-price'); // Readonly now
    const usePresCheck = document.getElementById('item-use-presentation');

    const supplyId = supplySelect.value;
    const brand = brandInput.value.trim();
    const inputQty = parseFloat(quantityInput.value);
    const inputTotal = parseFloat(totalInput.value);

    // Validaciones
    if (!supplyId) {
        showNotification('Seleccione un suministro', 'warning');
        return;
    }
    if (!inputQty || inputQty <= 0) {
        showNotification('Ingrese una cantidad válida', 'warning');
        return;
    }
    if (!inputTotal || inputTotal <= 0) {
        showNotification('Ingrese el monto Total ($)', 'warning');
        return;
    }

    const supply = currentSupplies.find(s => s.id === supplyId);

    // Cálculos Finales
    let finalQty = inputQty;

    // Si usó presentación, convertir a unidad base
    if (usePresCheck && usePresCheck.checked) {
        const equivalence = parseFloat(supplySelect.options[supplySelect.selectedIndex].dataset.equivalence) || 1;
        finalQty = inputQty * equivalence;
    }

    // El precio unitario real base se deriva del total / cantidad base
    const finalUnitPrice = inputTotal / finalQty;

    const item = {
        supply_id: supplyId,
        supply_name: supply.name,
        supply_unit: supply.unit,
        brand_description: brand || 'N/A',
        quantity: finalQty,
        unit_price_usd: finalUnitPrice,
        subtotal: inputTotal
    };

    currentPurchaseItems.push(item);
    renderPurchaseItems();

    // Limpiar inputs
    supplySelect.value = '';
    brandInput.value = '';
    quantityInput.value = '';
    totalInput.value = '';
    document.getElementById('item-total-bs').value = '';
    priceInput.value = '';
    if (usePresCheck) usePresCheck.checked = false;

    if (document.getElementById('lbl-use-presentation'))
        document.getElementById('lbl-use-presentation').style.display = 'none';

    if (document.getElementById('lbl-item-quantity'))
        document.getElementById('lbl-item-quantity').textContent = 'Cantidad';
}

function renderPurchaseItems() {
    const tbody = document.getElementById('items-tbody');

    if (currentPurchaseItems.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="text-center">No hay items agregados</td>
            </tr>
        `;
        updateTotals();
        return;
    }

    tbody.innerHTML = currentPurchaseItems.map((item, index) => `
        <tr>
            <td>
                <strong>${item.supply_name}</strong><br>
                <span style="font-size:0.85rem; color:#64748b;">${item.supply_unit}</span>
            </td>
            <td>${item.brand_description || '-'}</td>
            <td class="text-right">${parseFloat(item.quantity).toFixed(2)}</td>
            <td class="text-right">$${parseFloat(item.unit_price_usd).toFixed(2)}</td>
            <td class="text-right" style="font-weight:bold;">$${parseFloat(item.subtotal).toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn-icon-sm" data-index="${index}" onclick="window.removePurchaseItem(${index})" title="Eliminar Item">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');

    updateTotals();
}

window.removePurchaseItem = function (index) {
    currentPurchaseItems.splice(index, 1);
    renderPurchaseItems();
};

window.editPurchase = async function (id) {
    document.querySelector('.modal-overlay')?.remove(); // Close details modal

    try {
        // 1. Get full purchase data
        const purchase = await PurchasesService.getById(id);

        // 2. Open modal (reusing create modal logic)
        currentSuppliers = await SuppliersService.getAll();
        currentSupplies = await PurchasesService.getSupplies();
        // Use HISTORICAL rate from purchase, not current global rate
        currentBcvRate = purchase.bcv_rate;

        // Pre-fill items
        currentPurchaseItems = purchase.items.map(item => ({
            supply_id: item.supply_id,
            supply_name: item.supply.name,
            supply_unit: item.supply.unit,
            brand_description: item.brand_description,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            subtotal: item.quantity * item.unit_price_usd
        }));

        const modalHtml = PurchasesView.renderPurchaseForm(currentSuppliers, currentSupplies, currentBcvRate);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 3. Fill Form Fields
        document.getElementById('modal-title').innerText = "Editar Compra";
        document.getElementById('submit-purchase').innerText = "Actualizar Compra";
        document.getElementById('purchase-form').dataset.purchaseId = purchase.id;

        document.getElementById('purchase-supplier').value = purchase.supplier_id;
        // Trigger generic load of locations
        await loadSupplierLocations({ target: { value: purchase.supplier_id } });
        // Select specific historical location (must wait for locations to load)
        setTimeout(() => {
            const locSelect = document.getElementById('purchase-location');
            if (locSelect) locSelect.value = purchase.location_id;
        }, 500);

        document.getElementById('purchase-date').value = new Date(purchase.purchase_date).toISOString().split('T')[0];
        document.getElementById('purchase-doc-type').value = purchase.document_type;
        document.getElementById('purchase-doc-number').value = purchase.document_number;
        document.getElementById('purchase-notes').value = purchase.notes || '';
        document.getElementById('purchase-bcv-rate').value = purchase.bcv_rate;

        // Render items and listeners
        renderPurchaseItems();
        setupPurchaseFormListeners();

    } catch (error) {
        console.error('Error editando compra:', error);
        showNotification('Error al cargar la compra para editar', 'error');
    }
}


function updateTotals() {
    const totalUsd = currentPurchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
    const bcvRate = parseFloat(document.getElementById('purchase-bcv-rate').value) || currentBcvRate;
    const totalBs = totalUsd * bcvRate;

    document.getElementById('total-usd').textContent = `$${totalUsd.toFixed(2)}`;
    document.getElementById('total-bs').textContent = `Bs ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

async function handlePurchaseSubmit(e) {
    e.preventDefault();

    if (currentPurchaseItems.length === 0) {
        showNotification('Debe agregar al menos un item a la compra', 'warning');
        return;
    }

    const form = e.target;
    const formData = new FormData(form);

    const purchaseData = {
        supplier_id: formData.get('supplier_id'),
        location_id: formData.get('location_id'),
        document_type: formData.get('document_type'),
        document_number: formData.get('document_number'),
        // FIX TIMEZONE: Append T12:00:00 to ensure it falls within the correct day regardless of UTC shift
        purchase_date: formData.get('purchase_date') ? `${formData.get('purchase_date')}T12:00:00` : new Date().toISOString(),
        bcv_rate: parseFloat(formData.get('bcv_rate')),
        notes: formData.get('notes'),
        items: currentPurchaseItems
    };

    console.log('📦 [Controller] Sending Purchase Data:', purchaseData); // DEBUG REQUESTED BY USER

    const purchaseId = document.getElementById('purchase-form').dataset.purchaseId;

    try {
        // Validar location_id
        if (!purchaseData.location_id) {
            showNotification('Debe seleccionar una ubicación de recepción', 'warning');
            return;
        }

        const submitBtn = document.getElementById('submit-purchase');
        submitBtn.disabled = true;
        submitBtn.textContent = '💾 Guardando...';

        if (purchaseId) {
            await PurchasesService.update(purchaseId, purchaseData);
            showNotification('✅ Compra actualizada exitosamente.', 'success');
        } else {
            await PurchasesService.create(purchaseData);
            showNotification('✅ Compra registrada exitosamente.', 'success');
        }

        closePurchaseModal();
        await loadPurchasesTab();

    } catch (error) {
        console.error('Error guardando compra:', error);
        showNotification('Error al guardar compra: ' + error.message, 'error');

        const submitBtn = document.getElementById('submit-purchase');
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Compra';
    }
}

function closePurchaseModal() {
    document.getElementById('purchase-modal')?.remove();
    currentPurchaseItems = [];
}

async function viewPurchaseDetails(id) {
    try {
        const purchase = await PurchasesService.getById(id);

        const detailsHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📦 Detalles de Compra</h3>
                        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="purchase-details">
                        <p><strong>Proveedor:</strong> ${purchase.supplier?.name || '---'}</p>
                        <p><strong>Ubicación:</strong> ${purchase.location?.address || '---'}, ${purchase.location?.city || ''}</p>
                        <p><strong>Fecha:</strong> ${new Date(purchase.purchase_date).toLocaleDateString()}</p>
                        <p><strong>Documento:</strong> ${purchase.document_type} - ${purchase.document_number || 'N/A'}</p>
                        <p><strong>Tasa BCV:</strong> Bs ${purchase.bcv_rate}</p>
                        
                        <h4>Items:</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Suministro</th>
                                    <th>Marca</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchase.items.map(item => `
                                    <tr>
                                        <td>${item.supply?.name || '---'}</td>
                                        <td>${item.brand_description}</td>
                                        <td>${item.quantity} ${item.supply?.unit || ''}</td>
                                        <td>$${parseFloat(item.unit_price_usd).toFixed(2)}</td>
                                        <td>$${parseFloat(item.subtotal_usd).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                            <div>
                                <p><strong>Total USD:</strong> $${parseFloat(purchase.total_usd).toFixed(2)}</p>
                                <p><strong>Total Bs:</strong> Bs ${parseFloat(purchase.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <button class="btn-primary" onclick="window.editPurchase('${purchase.id}')">✏️ Editar Compra</button>
                        </div>
                        ${purchase.notes ? `<p><strong>Notas:</strong> ${purchase.notes}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailsHtml);

    } catch (error) {
        console.error('Error cargando detalles:', error);
        showNotification('Error al cargar detalles de la compra', 'error');
    }
}

// ============================================
// UTILIDADES
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Más tiempo para errores (10s), normal para info (3s)
    const duration = type === 'error' ? 10000 : 3000;

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}
