/**
 * Controlador de Clientes V2
 */
import { CustomersService } from './customers.service.js';
import { CustomersView } from './customers.view.js';
import { Toast } from '../../ui/components.js';

export async function loadCustomers() {
    const container = document.getElementById('app-workspace');

    try {
        const customers = await CustomersService.getCustomers();
        container.innerHTML = CustomersView.render(customers);
        bindEvents(customers);
    } catch (err) {
        console.error('Error loading customers module:', err);
    }
}

function bindEvents(customers) {
    console.log('DEBUG: Binding Customer Module events');
    const btnAdd = document.getElementById('btn-show-add-cliente');
    const modal = document.getElementById('modal-customer');
    const form = document.getElementById('form-customer-v2');

    if (btnAdd) {
        btnAdd.onclick = () => {
            console.log('DEBUG: Opening modal-customer');
            if (form) form.reset();
            const idInput = document.getElementById('cust-id');
            const title = document.getElementById('modal-customer-title');
            if (idInput) idInput.value = '';
            if (title) title.innerText = 'Añadir Nuevo Cliente';

            if (modal) {
                modal.classList.add('active');
                console.log('DEBUG: Modal active class added');
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('cust-id').value;
            const data = {
                name: document.getElementById('cust-name').value,
                phone: document.getElementById('cust-phone').value,
                email: document.getElementById('cust-email').value,
                address: document.getElementById('cust-address').value
            };

            console.log('DEBUG: Saving customer', { id, data });
            let res;
            if (id) {
                res = await CustomersService.updateCustomer(id, data);
            } else {
                res = await CustomersService.createCustomer(data);
            }

            if (res.success) {
                Toast.show('Cliente guardado con éxito', 'success');
                if (modal) modal.classList.remove('active');
                loadCustomers();
            } else {
                alert('Error: ' + res.error);
            }
        };
    }

    // Edición y Eliminación
    document.querySelectorAll('.btn-edit-customer').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const c = customers.find(x => x.id == id);
            if (c) {
                document.getElementById('cust-id').value = c.id;
                document.getElementById('cust-name').value = c.name;
                document.getElementById('cust-phone').value = c.phone || '';
                document.getElementById('cust-email').value = c.email || '';
                document.getElementById('cust-address').value = c.address || '';
                document.getElementById('modal-customer-title').innerText = 'Editar Cliente';
                modal.classList.add('active');
            }
        };
    });

    document.querySelectorAll('.btn-delete-customer').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('¿Seguro que deseas eliminar este cliente?')) {
                const res = await CustomersService.deleteCustomer(btn.dataset.id);
                if (res.success) {
                    Toast.show('Cliente eliminado');
                    loadCustomers();
                }
            }
        };
    });
}
