/**
 * State Manager V2 (Store Central)
 * Elimina la necesidad de dependencias cruzadas entre módulos.
 * Todos los módulos leen/escriben aquí de forma reactiva.
 */

export const Store = {
    state: {
        // Tasas base
        rates: {
            usd_to_ves: 0,
            eur_to_usd: 0
        },
        // Contexto de Usuario
        user: null,
        // Contexto Operativo
        mode: 'preventa', // o 'mostrador'
        // Carga global
        isLoading: false
    },

    listeners: [],

    // Suscribirse a cambios en el state
    subscribe(callback) {
        this.listeners.push(callback);
        return () => { // Función para desuscribirse
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    // Actualizar una clave del estado global
    update(key, value) {
        this.state[key] = value;
        this.notify();
    },

    // Notificar a todos los módulos que el estado cambió (Ej: Si cambió la tasa del Dólar, todo el UI se recalcula solo)
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
};
