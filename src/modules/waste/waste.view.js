export const WasteView = {
    renderLayout(container) {
        container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 25px;">
                <h1>🗑️ Gestión de Mermas</h1>
                <p>Registro de pérdidas y productos no aptos para venta.</p>
            </header>

            <div class="grid-layout-sales"> <!-- Reuse sales grid layout (1fr 1.2fr) -->
                <!-- FORMULARIO -->
                <div class="stat-card" style="height: fit-content;">
                    <h3 style="margin-top:0; border-bottom: 2px solid #ef4444; padding-bottom: 10px; color: #991b1b;">Registrar Pérdida</h3>
                    
                    <div class="input-group">
                        <label>Producto Afectado</label>
                        <select id="w-product-select" class="input-field">
                            <option value="">Cargando productos...</option>
                        </select>
                    </div>

                    <div class="input-group" style="margin-top:15px;">
                        <label>Cantidad (Unidades Perdidas)</label>
                        <input type="number" id="w-qty" class="input-field" min="0.01" step="0.01" placeholder="Ej: 1">
                    </div>

                    <div class="input-group" style="margin-top:15px;">
                        <label>Motivo</label>
                        <select id="w-reason" class="input-field">
                            <option value="Caducidad / Vencimiento">Caducidad / Vencimiento</option>
                            <option value="Daño en Manipulación">Daño en Manipulación</option>
                            <option value="Calidad Insuficiente">Calidad Insuficiente</option>
                            <option value="Error de Producción">Error de Producción</option>
                            <option value="Consumo Interno / Muestras">Consumo Interno / Muestras</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    <div class="input-group" style="margin-top:15px; display:none;" id="w-reason-manual-group">
                        <label>Especificar Otro Motivo</label>
                        <input type="text" id="w-reason-manual" class="input-field">
                    </div>

                    <button id="btn-submit-waste" class="btn-primary" style="width:100%; margin-top:20px; background: #ef4444;">
                        ⚠️ Registrar Merma
                    </button>
                </div>

                <!-- HISTORIAL -->
                <div class="stat-card">
                    <h3>Historial de Mermas</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Cant.</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody id="w-history-body">
                                <tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    populateProducts(products) {
        const select = document.getElementById('w-product-select');
        select.innerHTML = '<option value="">-- Seleccionar Producto --</option>';
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.product_name} (Stock: ${p.stock_disponible})`;
            select.appendChild(opt);
        });
    },

    renderHistory(history) {
        const tbody = document.getElementById('w-history-body');
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">No hay mermas registradas recientemente.</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>${new Date(h.created_at).toLocaleDateString()}</td>
                <td><span style="font-weight:bold;">${h.sales_prices?.product_name || 'Desconocido'}</span></td>
                <td style="color: #ef4444; font-weight:bold;">${h.quantity}</td>
                <td><small>${h.reason}</small></td>
            </tr>
        `).join('');
    },

    resetForm() {
        document.getElementById('w-product-select').value = "";
        document.getElementById('w-qty').value = "";
        document.getElementById('w-reason').value = "Caducidad / Vencimiento";
        document.getElementById('w-reason-manual').value = "";
        document.getElementById('w-reason-manual-group').style.display = "none";
    }
};
