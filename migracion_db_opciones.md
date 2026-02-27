# Estrategias de Migración de Base de Datos (V1 -> V2)

Este documento detalla los tres caminos profesionales propuestos para resolver la convivencia de datos antiguos del sistema V1 con la nueva estructura estricta del sistema V2 en Focaccia Plus & Coffee.

## El Problema: "Deuda Técnica"
Mezclar datos de un sistema que guardaba la información de forma más relajada o incompleta (V1) con un sistema estricto (V2) en la misma tabla suele traer problemas a largo plazo, como reportes que no cuadran o errores buscando datos que no existen. Además, existen múltiples registros de prueba de la V1 que "ensucian" las métricas reales.

---

### Opción A: Crear Tablas "V2" (Aislamiento Total)
*   **Qué es:** Creamos tablas nuevas y exclusivas en Supabase (ej. `v2_sales_orders`, `v2_inventory_transactions`). La versión 2 se conectará únicamente a estas tablas nuevas.
*   **Ventajas:** Cero riesgos. La V1 sigue funcionando perfecta con sus tablas viejas, y la V2 arranca completamente virgen y perfecta desde el día uno. Es la opción más segura.
*   **Desventajas:** El histórico de ventas de V1 no se verá reflejado en el nuevo panel administrativo ni de cobranzas de V2.

---

### Opción B: Filtrado por "Bandera" (Convivencia Pacífica)
*   **Qué es:** Mantenemos la tabla actual `sales_orders`, pero a partir de ahora le inyectamos a las ventas de V2 una "etiqueta secreta" al guardar en base de datos (ej: `app_version: 'v2'`). Luego modificamos los módulos V2 para que solo lean y calculen usando las facturas que tengan la etiqueta `v2`.
*   **Ventajas:** No hay que crear ni alterar de forma masiva la base de datos, y los datos corruptos o incompatibles de V1 simplemente son "ignorados" por el sistema nuevo de forma invisible, pero siguen ahí de respaldo por seguridad.
*   **Desventajas:** La tabla física sigue creciendo con "datos basura" o incompletos mezclados con los buenos, lo que a largo plazo puede ser ineficiente.

---

### Opción C: Migración y Limpieza (Pizarrón en Blanco)
*   **Qué es:** Escribimos un *Script de Migración Automatizado*. Este proceso barrerá toda tu tabla actual `sales_orders`, eliminará la "basura" automáticamente basándose en reglas que definamos (por ejemplo: borrar toda orden que diga "prueba" o tenga monto $0), y luego tomará las facturas **reales validas** de V1 y las transformará dándoles el formato interno estricto que requiere V2.
*   **Ventajas:** Tendrás una sola base de datos limpia, unificada, optimizada y con todo tu histórico real intacto e inspeccionable desde el nuevo panel. Es "El Deber Ser" en estándares de la industria del software.
*   **Desventajas:** Requiere más trabajo lógico inicial, ya que debes decidir y definirme reglas claras de "qué es basura" y "qué es real" para programar el script borrador con precisión.
