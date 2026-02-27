/**
 * Componentes Reutilizables de UI V2
 */

export const Toast = {
    show(message, type = 'info') {
        // Implementación ultra-simple temporal para evitar bloqueos
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-fade-in`;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            padding: 12px 25px; border-radius: 8px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
            color: white; font-weight: 600; z-index: 9999;
            box-shadow: var(--shadow-lg);
        `;
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};
