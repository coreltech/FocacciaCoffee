/**
 * Vista de Gestión de Clientes V2
 */
export const CustomersView = {

    render(customers) {
        return `
            <div class="v2-module-container animate-fade-in">
                <div class="header-flex mb-20">
                    <h2 class="section-title">Maestro de Clientes</h2>
                    <button class="btn btn-primary" id="btn-show-add-cliente">➕ Nuevo Cliente</button>
                </div>

                <div class="kpi-grid mb-20">
                    <div class="kpi-card">
                        <span class="kpi-title">Clientes Registrados</span>
                        <span class="kpi-value">${customers.length}</span>
                    </div>
                </div>

                <div class="card glass p-0 overflow-hidden">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th style="width: 150px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.phone || '-'}</td>
                                    <td>${c.email || '-'}</td>
                                    <td>
                                        <button class="btn-icon btn-edit-customer" data-id="${c.id}">✏️</button>
                                        <button class="btn-icon btn-delete-customer text-danger" data-id="${c.id}">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                </div>
            </div>
        `;
    }
};
