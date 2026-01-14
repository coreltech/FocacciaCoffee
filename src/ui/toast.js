export const Toast = {
    show(message, type = 'success') {
        // Types: 'success', 'error', 'info'
        const container = document.getElementById('toast-container') || this.createContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Removes after 3s
        const duration = 3000;
        const autoRemove = setTimeout(() => {
            this.remove(toast);
        }, duration);

        toast.querySelector('.toast-close').onclick = () => {
            clearTimeout(autoRemove);
            this.remove(toast);
        };

        container.appendChild(toast);
        // Trigger reflow for animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    },

    createContainer() {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    },

    remove(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    },

    getIcon(type) {
        if (type === 'success') return '✅';
        if (type === 'error') return '❌';
        return 'ℹ️';
    }
};
