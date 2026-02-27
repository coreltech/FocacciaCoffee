# Módulo V2: Tasas y Configuración (Settings)

## Arquitectura Estricta (Patrón MVC + Store)

Para evitar el acoplamiento (código espagueti) del sistema anterior, este módulo se divide estrictamente en 3 responsabilidades que **no pueden mezclarse**:

1. **`settings.service.js` (La Base de Datos):**
   - **Única** capa permitida para importar y hablar con Supabase (`import { supabase }`).
   - Aquí viven los `SELECT`, `UPDATE` o `INSERT`.
   - Si la DB cambia, solo se edita este archivo.
   - Retorna datos limpios o arroja errores estructurados.

2. **`settings.view.js` (La Interfaz HTML):**
   - **Prohibido** realizar cálculos aquí.
   - **Prohibido** llamar a la base de datos aquí.
   - Exporta funciones que retornan *Template Literals* puros (HTML en formato String).
   - Recibe los datos ya masticados y solo los "pinta".

3. **`settings.controller.js` (El Cerebro/Puente):**
   - Único archivo que se exporta hacia el router.
   - Pide los datos al `Service`.
   - Le inyecta los datos a la `View` e inserta el HTML en el DOM.
   - Captura todos los eventos (Clicks de botones, envíos de formularios).
   - Inyecta el resultado final en el `Store` Global (`src/v2/core/store.js`) para que otros módulos (como Ventas o Suministros) sepan si la tasa cambió.

## Flujo de Trabajo en este módulo:
1. El usuario entra a Configuración.
2. `Controller` inicializa. Llama a `Service.getRates()`.
3. `Controller` inyecta las tasas en `Store.update('rates', data)`.
4. `Controller` renderiza `View.render()` y añade *Event Listeners*.
5. Si el usuario actualiza una tasa, `Controller` manda a `Service.updateRate()`, y si éxito, repite paso 3.
