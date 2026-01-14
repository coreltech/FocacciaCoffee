import { supabase } from '../../core/supabase.js';

export async function loadLibrary() {
    const container = document.getElementById('app-content');

    // 1. Estructura con Modales mejorados
    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0;">📚 Mi Biblioteca</h1>
                    <p style="color: #64748b;">Conocimiento de Focaccia & Coffee</p>
                </div>
                <button id="btn-open-modal" class="btn-primary">+ Guardar Documento</button>
            </header>

            <div id="library-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                <p>Cargando documentos...</p>
            </div>
        </div>

        <div id="modal-resource" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:1000; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);">
            <div class="stat-card" style="width:100%; max-width:500px; background:white;">
                <h3 style="margin-top:0;">Nuevo Documento</h3>
                <form id="form-resource" style="display:flex; flex-direction:column; gap:12px;">
                    <input type="text" id="res-title" placeholder="Título del Documento" required style="padding:12px; border:1px solid #ddd; border-radius:8px;">
                    <select id="res-cat" style="padding:12px; border:1px solid #ddd; border-radius:8px;">
                        <option value="manuales">Manuales de Cocina</option>
                        <option value="marca">Identidad y Marca</option>
                        <option value="pruebas">Pruebas y Notas</option>
                    </select>
                    <textarea id="res-desc" placeholder="Escribe aquí todo el contenido del documento..." required style="padding:12px; border:1px solid #ddd; border-radius:8px; height:200px; resize:none;"></textarea>
                    <input type="url" id="res-img" placeholder="URL de imagen de portada (opcional)" style="padding:12px; border:1px solid #ddd; border-radius:8px;">
                    
                    <div style="display:flex; gap:10px;">
                        <button type="button" id="btn-close-modal" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:1;">Guardar en Sistema</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="modal-reader" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1100; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(8px);">
            <div id="reader-card" class="stat-card" style="width:100%; max-width:750px; background:white; max-height:90vh; overflow-y:auto; position:relative; scroll-behavior: smooth;">
                <button id="btn-close-reader" style="position:sticky; top:15px; float:right; border:none; background:#0f172a; color:white; border-radius:50%; width:35px; height:35px; cursor:pointer; font-weight:bold; z-index:10; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">✕</button>
                <div id="reader-content" style="padding:30px; padding-top:10px;">
                    </div>
            </div>
        </div>
    `;

    // 2. Renderizado de Tarjetas
    async function renderLibrary() {
        const grid = document.getElementById('library-grid');
        const { data, error } = await supabase.from('library').select('*').order('created_at', { ascending: false });

        if (error) { grid.innerHTML = 'Error de conexión'; return; }

        grid.innerHTML = data.map(item => `
            <div class="stat-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height: 100%;">
                <div style="height:140px; background: url('${item.image_url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400'}') center/cover;"></div>
                <div style="padding:15px; flex-grow:1; display:flex; flex-direction:column;">
                    <h3 style="margin:0 0 8px 0; color:#0f172a;">${item.title}</h3>
                    <p style="font-size:0.85rem; color:#64748b; margin-bottom:15px; display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical; overflow:hidden; line-height:1.5;">
                        ${item.description}
                    </p>
                    <div style="display:flex; gap:10px; margin-top:auto;">
                        <button class="read-btn btn-secondary" data-id="${item.id}" style="flex:1; font-weight:bold; padding:10px;">📖 Leer Documento</button>
                        <button class="delete-btn" data-id="${item.id}" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:1.2rem; padding:5px;">🗑</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Evento para ABRIR EL LECTOR
        document.querySelectorAll('.read-btn').forEach(btn => {
            btn.onclick = () => {
                const doc = data.find(d => d.id === btn.dataset.id);
                openReader(doc);
            };
        });

        // Evento para BORRAR
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('¿Eliminar este documento permanentemente?')) {
                    await supabase.from('library').delete().eq('id', btn.dataset.id);
                    renderLibrary();
                }
            };
        });
    }

    // 3. Función del Lector Interno (CON AUTO-SCROLL AL INICIO)
    function openReader(doc) {
        const readerModal = document.getElementById('modal-reader');
        const readerCard = document.getElementById('reader-card');
        const content = document.getElementById('reader-content');

        // RESET DEL SCROLL: Esto hace que siempre empiece arriba
        readerCard.scrollTop = 0;

        content.innerHTML = `
            <small style="color:#64748b; text-transform:uppercase; font-weight:bold; letter-spacing:1px; font-size:0.7rem;">${doc.category}</small>
            <h2 style="margin:10px 0 25px 0; font-size:2rem; color:#0f172a; border-bottom:2px solid #f1f5f9; padding-bottom:15px;">${doc.title}</h2>
            <div style="line-height:1.8; color:#334155; white-space: pre-wrap; font-size:1.1rem; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${doc.description}
            </div>
            <div style="margin-top:40px; padding-top:20px; border-top:1px solid #eee; text-align:center;">
                <button onclick="document.getElementById('modal-reader').style.display='none'" class="btn-primary" style="padding: 10px 40px;">Finalizar Lectura</button>
            </div>
        `;
        readerModal.style.display = 'flex';
    }

    // 4. Controles de Cierre
    document.getElementById('btn-open-modal').onclick = () => document.getElementById('modal-resource').style.display = 'flex';
    document.getElementById('btn-close-modal').onclick = () => document.getElementById('modal-resource').style.display = 'none';

    // Cierre del lector
    document.getElementById('btn-close-reader').onclick = () => {
        document.getElementById('modal-reader').style.display = 'none';
    };

    // Cerrar al hacer clic fuera de la tarjeta
    window.onclick = (e) => {
        const modalReader = document.getElementById('modal-reader');
        const modalForm = document.getElementById('modal-resource');
        if (e.target === modalReader) modalReader.style.display = 'none';
        if (e.target === modalForm) modalForm.style.display = 'none';
    };

    // 5. Guardar Documento
    document.getElementById('form-resource').onsubmit = async (e) => {
        e.preventDefault();
        const newItem = {
            title: document.getElementById('res-title').value,
            category: document.getElementById('res-cat').value,
            description: document.getElementById('res-desc').value,
            image_url: document.getElementById('res-img').value || null,
            resource_url: '#'
        };

        const { error } = await supabase.from('library').insert([newItem]);
        if (error) alert("Error: " + error.message);
        else {
            document.getElementById('modal-resource').style.display = 'none';
            e.target.reset();
            renderLibrary();
        }
    };

    renderLibrary();
}