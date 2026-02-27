/**
 * Utilitario de Formateo V2
 * Centraliza el manejo de decimales para consistencia en toda la app.
 */

export const Formatter = {
    /**
     * Formatea un número como moneda (USD por defecto)
     * @param {number|string} value 
     * @param {number} decimals - Por defecto 4 según requerimiento de precisión
     */
    formatCurrency(value, decimals = 4) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * Formatea un número simple (cantidades, stock, etc)
     */
    formatNumber(value, decimals = 4) {
        const num = parseFloat(value) || 0;
        return num.toFixed(decimals);
    },

    /**
     * Formatea pesos (Kg, Gr)
     */
    formatWeight(value, unit = 'kg', decimals = 4) {
        const num = parseFloat(value) || 0;
        return `${num.toFixed(decimals)} ${unit}`;
    },

    /**
     * Formatea fecha y hora local evitando desfases UTC
     * @param {string} isoString - Fecha en formato ISO o YYYY-MM-DD
     */
    formatDateTime(isoString) {
        if (!isoString) return { date: '-', time: '-' };

        // Si viene solo fecha YYYY-MM-DD, forzar interpretación local
        let date;
        if (isoString.length === 10 && isoString.includes('-')) {
            date = new Date(isoString + 'T00:00:00');
        } else {
            date = new Date(isoString);
        }

        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    },

    /**
     * Formatea solo fecha de forma segura (Local)
     */
    formatLocalDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
        return date.toLocaleDateString();
    }
};
