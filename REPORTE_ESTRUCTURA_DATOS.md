# 🗺️ Reporte de Estructura de Datos (Tablas y Vistas)

Este reporte detalla el mapa completo de la base de datos que sustenta el sistema de Focaccia y Cafe. Está organizado por áreas funcionales.

---

## 1. Módulo de Inventario y Catálogo
Contiene la definición de productos terminados, insumos y su composición.

| Tabla / Vista | Tipo | Propósito |
| :--- | :--- | :--- |
| `sales_prices` | Tabla | Catálogo de productos terminados (Focaccias, Cafés, etc.) y su stock actual. |
| `supplies` | Tabla | Almacén de materia prima, ingredientes y empaques (Harina, Envases). |
| `catalog_composition`| Tabla | El "Armado" de productos. Vincula un ítem del catálogo con su receta e insumos directos. |
| `v_catalog_costs` | Vista | **[Cerebro]** Calcula el costo de producción real de cada producto mediante lógica recursiva. |
| `inventory_transactions` | Tabla | **[Kardex]** Historial de cada movimiento (Venta, Producción, Ajuste) para auditoría. |

---

## 2. Módulo de Producción y Recetas
Maneja la lógica de preparación y la transformación de insumos en productos.

| Tabla / Vista | Tipo | Propósito |
| :--- | :--- | :--- |
| `recipes` | Tabla | Cabecera de recetas (Masa Madre, Focaccia Base, etc.). |
| `recipe_items` | Tabla | Detalle de cada ingrediente o sub-receta dentro de una receta. |
| `production_logs` | Tabla | Registro histórico de cada tanda producida y su costo total. |
| `v_production_costs` | Vista | Calcula el costo estimado de 1kg o 1 unidad base de una receta. |
| `v_recipe_items_detailed`| Vista | Utilidad para mostrar ingredientes, nombres y costos en la interfaz de usuario. |
| `v_unified_inputs` | Vista | Une suministros e ingredientes para selectores dinámicos. |

---

## 3. Módulo de Ventas y Clientes
Gestiona las transacciones comerciales y el flujo de caja.

| Tabla / Vista | Tipo | Propósito |
| :--- | :--- | :--- |
| `sales_orders` | Tabla | Registro de todas las ventas, estados de pago (Pagado/Pendiente) y detalles híbridos. |
| `customers` | Tabla | Base de datos de clientes para ventas a crédito o pedidos especiales. |
| `v_daily_cash_closure` | Vista | **[Auditoría]** Resumen diario de ingresos desglosado por moneda ($/Bs/€) y método. |
| `v_product_sales_summary`| Vista | Resumen de los productos más vendidos por día. |

---

## 4. Módulo Financiero y Configuración
El corazón multimoneda y ajustes globales.

| Tabla / Vista | Tipo | Propósito |
| :--- | :--- | :--- |
| `exchange_rates` | Tabla | **[Pulso Real]** Almacena las tasas vigentes de USD y EUR con respecto al Bolívar. |
| `rates_history` | Tabla | Historial cronológico de cómo han cambiado las tasas de cambio. |
| `global_config` | Tabla | Configuraciones menores y variables globales del sistema. |

---

## 5. Módulos Adicionales y Legado
| Tabla / Vista | Tipo | Propósito |
| :--- | :--- | :--- |
| `waste_logs` | Tabla | Registro de mermas o productos dañados. |
| `ingredients` | Tabla | *(Legado)* Sustituida por `supplies`, mantenida por compatibilidad en algunas vistas viejas. |

---

### 💡 Notas Técnicas
- **PK/FK**: El sistema usa mayoritariamente **UUID** para asegurar que no haya colisiones y facilitar integraciones futuras.
- **Atomicidad**: Las operaciones críticas (Ventas y Producción) se ejecutan mediante Funciones RPC (`registrar_venta_atomica`, `registrar_produccion_atomica`) para garantizar que el inventario nunca quede inconsistente.
