# Auditoría del Sistema: Focaccia Plus & Coffee
**Fecha:** 18-02-2026
**Versión del Reporte:** 1.0

Este documento detalla la arquitectura del sistema, explicando cómo se conectan las piezas ("Módulos"), de quién dependen y qué hace cada una.

---

## 1. Mapa General de Relaciones (Arquitectura)

El sistema funciona como un engranaje donde el **Inventario** y la **Configuración** son el corazón, y las **Ventas/Producción** son los brazos operativos.

```mermaid
graph TD
    %% Nodos Core
    Settings[⚙️ Configuración (Tasas/Usuarios)]
    Inv[📦 Inventario & Recetas]
    Cust[👥 Clientes]

    %% Nodos Operativos
    Sales[💸 Ventas (POS)]
    Purch[🛒 Compras & Gastos]
    Prod[🏭 Producción]

    %% Nodos Analíticos
    Sett[🚚 Liquidaciones (Drivers)]
    Fin[💰 Finanzas & Tesorería]
    Rep[📊 Reportes]

    %% Relaciones
    Settings --> Sales
    Settings --> Purch
    
    Inv --> Sales
    Inv --> Prod
    Inv --> Purch

    Cust --> Sales

    Sales --> Prod
    Sales --> Sett
    Sales --> Fin

    Purch --> Fin
    Purch --> Inv

    Prod --> Inv
    
    Sett --> Fin
```

---

## 2. Clasificación de Módulos

### A. Módulos "Core" (Independientes)
Estos módulos son la base. Pueden funcionar casi solos y otros dependen de ellos.

1.  **⚙️ Configuración (Settings)**
    *   **Funcionalidad:** Controla la Tasa de Cambio (BCV/Paralelo), Usuarios y Roles.
    *   **Dependencia:** Ninguna (Es el "Dios" del sistema).
    *   **Importancia:** Crítica. Si la tasa está mal, todos los precios en Bs. salen mal.

2.  **📦 Inventario (Inventory/Catalog)**
    *   **Funcionalidad:** Define "Qué existimos". Insumos (Harina), Recetas (Masa) y Productos de Venta (Focaccia).
    *   **Dependencia:** Mínima.
    *   **Importancia:** Crítica. Sin esto, no hay qué vender ni qué producir.

3.  **👥 Clientes (Customers)**
    *   **Funcionalidad:** Base de datos de quién nos compra.
    *   **Dependencia:** Mínima.

---

### B. Módulos Operativos (Dependientes)
Estos son los módulos de "Acción Diaria". Dependen de los Core.

4.  **💸 Ventas (Sales)**
    *   **Funcionalidad:** Registra pedidos, cobra dinero y descuenta stock (teóricamente).
    *   **Dependencias:**
        *   Requiere **Inventario** (para saber qué vender).
        *   Requiere **Configuración** (para saber la tasa del día).
        *   Requiere **Clientes** (para ventas a crédito o delivery).
    *   **Interacción:** Al vender, genera una "Orden de Venta" que alimenta a *Producción* y *Liquidaciones*.

5.  **🏭 Producción (Production)**
    *   **Funcionalidad:** Transforma Insumos en Productos Terminados. Calcula la "Lista de Compra" basada en lo que se vendió.
    *   **Dependencias:**
        *   Depende TOTALMENTE de **Ventas** (¿Qué se pidió?).
        *   Depende de **Inventario** (¿Cuál es la receta de la Focaccia?).
    *   **Interacción:** Cierra el ciclo. Convierte "Pendiente" en "Listo para Entrega".

6.  **🛒 Compras (Purchases)**
    *   **Funcionalidad:** Registra la entrada de insumos y salida de dinero (Gastos).
    *   **Dependencias:**
        *   Requiere **Inventario** (Insumos).
    *   **Interacción:** Al comprar harina, sube el stock de harina en el Inventario.

---

### C. Módulos Analíticos (Resultados)
Estos módulos no "hacen" cosas, sino que "leen" lo que pasó para darte reportes.

7.  **🚚 Liquidaciones (Settlement)**
    *   **Funcionalidad:** Calcula cuánto pagarle a los repartidores/drivers.
    *   **Dependencias:** Lee las **Ventas** (específicamente las que son "Delivery" y "Entregadas").

8.  **💰 Finanzas y Tesorería (Finances)**
    *   **Funcionalidad:** Muestra cuánto dinero entró (Ventas) vs. cuánto salió (Compras/Gastos).
    *   **Dependencias:** Lee todo (**Ventas** y **Compras**).

---

## 3. Análisis de Riesgo y Dependencias "Bombas" 💣

Aquí evaluamos qué pasa si falla un módulo.

| Si falla... | Impacto en el resto | Nivel de Riesgo |
| :--- | :--- | :--- |
| **Configuración** (Tasa) | **Catastrófico.** Los precios en Bolívares salen mal en Ventas y Compras. | 🔴 Alto |
| **Inventario** | **Bloqueante.** Si borras un producto, no puedes venderlo. | 🔴 Alto |
| **Ventas** | **Crítico.** No entra dinero. (Recientemente "blindado" para no bloquearse). | 🟠 Medio-Alto |
| **Producción** | **Operativo.** No sabrás qué cocinar, pero puedes seguir vendiendo. | 🟡 Medio |
| **Liquidaciones** | **Administrativo.** Te atrasas pagando a drivers, pero el negocio sigue. | 🟢 Bajo |

## 4. Estado Actual de "Salud" del Sistema

*   **Ventas:** ✅ **Estable.** (Blindado contra errores de stock).
*   **Producción:** ⚠️ **En Revisión.** (Recién ajustamos la lista de compra, requiere vigilancia).
*   **Inventario:** ✅ **Estable.**
*   **Compras:** ✅ **Estable.**

---

**Recomendación:** Mantener la política de "Blindaje" (Fase 6) para asegurar que un error en un Módulo Analítico o de Producción NUNCA detenga al Módulo de Ventas.
