# Post-Mortem: Reporte de Incidente (Bloqueo de Ventas)
**Fecha:** 18-02-2026
**Severidad:** Crítica (Parada de Negocio)
**Estado:** Resuelto

## 1. Descripción del Incidente
El usuario experimentó una imposibilidad total para registrar ventas debido a tres fallos en cadena:
1.  **Fallo de Verificación de Stock:** Productos válidos fueron marcados como "No Encontrados" o "Stock Insuficiente", bloqueando la transacción en el servidor.
2.  **Bloqueo Visual (Frontend):** El botón "Agregar al Carrito" se desactivaba visualmente debido a una validación estricta cuando el stock parecía bajo o cero.
3.  **Error de Integridad de Datos:** Al intentar evitar el chequeo de stock, las ventas fallaban con un error de "valor nulo en columna `product_name`" porque el controlador del frontend tenía lógica incompleta.

## 2. Análisis de Causa Raíz
*   **Desajuste de Lógica de Negocio:** El sistema fue diseñado para un "Control Estricto de Inventario" (estilo fábrica), pero el negocio opera con un modelo "Bajo Pedido/Flexible". El código imponía límites que no reflejaban la realidad operativa.
*   **Lógica de Controlador Frágil:** El archivo `sales.controller.js` contenía código incompleto (comentarios como `// ...`) en lugar de un mapeo robusto de datos, causando que campos críticos como `product_name` se enviaran como `null`.
*   **Falta de Mecanismos de Seguridad:** El sistema era "Fail-Stop" (detener todo ante un error) en lugar de "Fail-Safe" (registrar el error pero permitir la venta).

## 3. Acciones Correctivas Implementadas
*   **"Soft Fail" (Fallo Suave) para Stock:** Se modificó `sales.service.js` para registrar los errores de stock como advertencias, pero *permitir que la venta proceda*.
*   **Desbloqueo del Frontend:** Se habilitó permanentemente el botón "Agregar al Carrito" en `sales.view.v2.js`, convirtiendo los errores en advertencias visuales amarillas.
*   **Datos de Respaldo (Fallbacks):** Se agregó lógica de seguridad en `sales.service.js` para asignar "Producto Sin Nombre" si el nombre falta, satisfaciendo las restricciones de la base de datos.
*   **Restauración de Lógica:** Se reescribió `sales.controller.js` para asegurar que todos los campos se mapeen y envíen correctamente.

## 4. Medidas Preventivas (Plan Futuro)
Para asegurar que esto no vuelva a suceder, implementaremos la **Fase 6: Estabilidad y Blindaje**:

1.  **Política "El Dinero No Se Bloquea":** Todas las rutas críticas de venta tratarán los errores no financieros (stock, categorías, logs) como no fatales.
2.  **Capa de Sanitización de Entradas:** Una función centralizada para validar y "rellenar" datos faltantes antes de que lleguen a la base de datos (ej. si falta Cliente, asignar "Genérico").
3.  **Chequeo de Salud Automático:** Un script simple que corre al inicio para verificar que las columnas y tablas críticas existen.
4.  **Búfer Local (Futuro):** Si el servidor/BD no responde, guardar la venta en `localStorage` y reintentar mas tarde (Modo Offline Básico).
