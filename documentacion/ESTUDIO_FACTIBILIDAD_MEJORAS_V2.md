# ESTUDIO DE FACTIBILIDAD DE MEJORAS
## Sistema ERP: Focaccia Plus and Coffee V2

**Fecha de Emisión:** 1 de Marzo de 2026  
**Elaborado por:** Equipo de Desarrollo — Antigravity AI  
**Versión del Sistema Evaluado:** V2.3-surgical  
**Estado Actual de Producción:** ✅ Operativo (Vercel + Supabase)

---

## 1. OBJETIVO DEL DOCUMENTO

El presente documento tiene como propósito registrar formalmente las mejoras identificadas durante la auditoría técnica del sistema ERP Focaccia Plus and Coffee V2, clasificarlas según su impacto, esfuerzo y factibilidad, y establecer una hoja de ruta priorizada para la evolución continua de la plataforma.

Este informe es de uso interno y debe servir como referencia para la toma de decisiones de inversión en desarrollo futuro.

---

## 2. RESUMEN DEL SISTEMA ACTUAL

| Indicador | Valor |
|-----------|-------|
| Módulos funcionales | 15 |
| Migraciones SQL | 76 |
| Capa de services | 15 archivos |
| Dependencias npm (producción) | 3 |
| Costo mensual de infraestructura | $0 (free tiers) |
| Usuarios concurrentes soportados | ~5-10 |
| Plataformas soportadas | PC, Tablet, Celular |
| Autenticación | Email/Password con 3 roles (Director, Gerente, Asistente) |

---

## 3. METODOLOGÍA DE EVALUACIÓN

Cada mejora fue evaluada contra cuatro criterios:

| Criterio | Descripción |
|----------|-------------|
| **Impacto en el Negocio** | Qué tanto mejora la operación diaria o la toma de decisiones |
| **Esfuerzo de Desarrollo** | Tiempo estimado de implementación |
| **Riesgo Técnico** | Probabilidad de introducir errores o complicaciones |
| **Retorno de Inversión (ROI)** | Relación beneficio/costo de implementar la mejora |

**Escala de evaluación:** 🟢 Bajo | 🟡 Medio | 🔴 Alto

---

## 4. MEJORAS IDENTIFICADAS — CLASIFICACIÓN POR PRIORIDAD

### 4.1 🔴 PRIORIDAD CRÍTICA (Implementar de inmediato)

---

#### MEJORA #1: Sistema de Notificaciones Toast

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | El sistema utiliza `alert()` nativo del navegador para comunicar éxitos, errores y advertencias. Esto bloquea la interfaz, interrumpe el flujo de trabajo y genera una percepción de aplicación no profesional. |
| **Solución propuesta** | Crear un componente global `ToastNotification` que muestre mensajes flotantes categorizados (éxito, error, advertencia, información) con auto-cierre después de 3-5 segundos. |
| **Impacto en el negocio** | 🔴 Alto — Mejora drástica en la experiencia del usuario final |
| **Esfuerzo de desarrollo** | 🟢 Bajo — 1 sesión de trabajo (~2-3 horas) |
| **Riesgo técnico** | 🟢 Bajo — Es un componente aislado de UI, no afecta lógica de negocio |
| **ROI** | ⭐⭐⭐⭐⭐ Excelente |

**Archivos afectados:**
- `src/v2/core/toast.js` (NUEVO)
- `src/v2/ui/toast.css` (NUEVO)
- Todos los controllers que usan `alert()` (refactorización gradual)

**Factibilidad:** ✅ TOTALMENTE FACTIBLE

---

#### MEJORA #2: Backups Automáticos de Base de Datos

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | No existe un mecanismo de respaldo automático. En caso de borrado accidental, corrupción de datos o fallo del proveedor, toda la información operativa se perdería irrecuperablemente. |
| **Solución propuesta** | Opción A: Migrar al plan Pro de Supabase ($25/mes) que incluye backups automáticos diarios con retención de 7 días. Opción B: Implementar un script de exportación periódica de tablas críticas a formato CSV/JSON almacenado en Supabase Storage. |
| **Impacto en el negocio** | 🔴 Alto — Protección del activo más valioso: los datos |
| **Esfuerzo de desarrollo** | 🟢 Bajo — Opción A: 30 minutos. Opción B: ~1 sesión |
| **Riesgo técnico** | 🟢 Bajo — No modifica código existente |
| **ROI** | ⭐⭐⭐⭐⭐ Excelente |

**Inversión requerida:** $0 (Opción B) o $25/mes (Opción A)

**Factibilidad:** ✅ TOTALMENTE FACTIBLE

---

#### MEJORA #3: Descuento Automático de Empaques y Adornos (Producción Fase 2)

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Al registrar producción de un "Producto Terminado" para vitrina, el sistema descuenta los ingredientes de la masa cruda pero NO descuenta los empaques (bolsas, etiquetas) ni los adornos (queso rallado, semillas decorativas) que están definidos en el escandallo del catálogo. |
| **Solución propuesta** | Modificar el RPC `v2_rpc_registrar_produccion_quirurgica` para que, cuando se produce un item de catálogo, también itere y descuente los componentes tipo "empaque" y "adorno" del inventario de suministros. |
| **Impacto en el negocio** | 🔴 Alto — El inventario de empaques nunca cuadra correctamente |
| **Esfuerzo de desarrollo** | 🟡 Medio — 1 sesión (~3-4 horas) |
| **Riesgo técnico** | 🟡 Medio — Requiere modificar una función RPC crítica |
| **ROI** | ⭐⭐⭐⭐ Muy bueno |

**Archivos afectados:**
- `migrations/NEW_descuento_empaques.sql` (NUEVO)
- `src/v2/modules/production/production.controller.js` (MODIFICAR)

**Factibilidad:** ✅ FACTIBLE — Requiere testing cuidadoso

---

### 4.2 🟡 PRIORIDAD MEDIA (Próximas 2-4 semanas)

---

#### MEJORA #4: Costos Dinámicos Reales por Tanda de Producción

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Si la receta espera 1000g de masa y solo se obtienen 900g (10% de merma), el sistema registra la eficiencia correctamente, pero NO recalcula el costo de producción del producto final. Esto distorsiona los márgenes reales del catálogo. |
| **Solución propuesta** | Al enviar el formulario de producción, calcular el costo real basado en: (costo de ingredientes consumidos ÷ unidades realmente obtenidas). Actualizar `production_cost` en `v2_catalog`. |
| **Impacto en el negocio** | 🟡 Medio — Información financiera más precisa para decisiones de precio |
| **Esfuerzo de desarrollo** | 🟡 Medio — 1 sesión (~3 horas) |
| **Riesgo técnico** | 🟡 Medio — Debe manejar correctamente sub-recetas recursivas |
| **ROI** | ⭐⭐⭐⭐ Muy bueno |

**Factibilidad:** ✅ FACTIBLE

---

#### MEJORA #5: Dashboard Inteligente en Tiempo Real

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Los KPIs del Dashboard muestran datos genéricos. No reflejan automáticamente las ventas del día actual, la producción registrada hoy, ni las alertas de stock crítico en tiempo real. |
| **Solución propuesta** | Conectar el `dashboard.service.js` con consultas SQL que calculen: ventas totales de hoy (en USD y Bs), producción de hoy (unidades/tandas), alertas de stock bajo, y cuentas por cobrar pendientes. |
| **Impacto en el negocio** | 🔴 Alto — El Dashboard es lo primero que ve el gerente al entrar |
| **Esfuerzo de desarrollo** | 🟡 Medio — 1-2 sesiones (~4-6 horas) |
| **Riesgo técnico** | 🟢 Bajo — Son lecturas, no escrituras |
| **ROI** | ⭐⭐⭐⭐⭐ Excelente |

**Factibilidad:** ✅ TOTALMENTE FACTIBLE

---

#### MEJORA #6: Activar Buscadores en Tablas

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Varios módulos (Suministros, Catálogo, Clientes) tienen campos de búsqueda (`<input>`) visibles en la interfaz, pero no están conectados a ninguna lógica de filtrado. Son decorativos. |
| **Solución propuesta** | Conectar cada input de búsqueda a un filtro en tiempo real que oculte filas de la tabla que no coincidan con el texto escrito. Implementar como utilidad reutilizable `SearchFilter`. |
| **Impacto en el negocio** | 🟡 Medio — Agiliza la localización de productos/ingredientes |
| **Esfuerzo de desarrollo** | 🟢 Bajo — ~30 minutos por módulo (total: ~2-3 horas) |
| **Riesgo técnico** | 🟢 Bajo — Solo manipula visibilidad de filas del DOM |
| **ROI** | ⭐⭐⭐⭐ Muy bueno |

**Factibilidad:** ✅ TOTALMENTE FACTIBLE

---

#### MEJORA #7: Consolidación de Migraciones SQL

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | 76 archivos de migración acumulados en la carpeta `migrations/`. Muchos son hotfixes, diagnósticos o correcciones de emergencia. Esto dificulta comprender la estructura real de la base de datos y hace riesgoso el onboarding de nuevos desarrolladores. |
| **Solución propuesta** | Generar un archivo `schema_v2_consolidated.sql` que represente el estado limpio actual de toda la base de datos 1. Mantener las migraciones individuales como historial, pero marcar el archivo consolidado como "punto de partida" para futuros entornos. |
| **Impacto en el negocio** | 🟡 Medio — Mantenibilidad y documentación técnica |
| **Esfuerzo de desarrollo** | 🟡 Medio — 2 sesiones (~4-5 horas) |
| **Riesgo técnico** | 🟢 Bajo — No modifica producción, solo documenta |
| **ROI** | ⭐⭐⭐ Bueno |

**Factibilidad:** ✅ FACTIBLE

---

### 4.3 🟢 PRIORIDAD BAJA (Backlog — Cuando haya oportunidad)

---

#### MEJORA #8: Migración de CSS Inline a Archivos Separados

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Los 15 archivos `*.view.js` contienen estilos CSS directamente en template literals JavaScript. Esto dificulta la reutilización, el mantenimiento y la colaboración con diseñadores. |
| **Solución propuesta** | Extraer los estilos de cada vista a un archivo `module.styles.css` correspondiente e importarlo. |
| **Impacto en el negocio** | 🟢 Bajo — No visible para el usuario final |
| **Esfuerzo de desarrollo** | 🟡 Medio — 2-3 sesiones (refactoring puro) |
| **Riesgo técnico** | 🟡 Medio — Posibles regresiones visuales |
| **ROI** | ⭐⭐ Aceptable |

**Factibilidad:** ✅ FACTIBLE — Mejora para mantenibilidad a largo plazo

---

#### MEJORA #9: Tests Automatizados (E2E y Unitarios)

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | No existen tests automatizados de ningún tipo. Cada cambio en producción conlleva riesgo de regresión no detectada. |
| **Solución propuesta** | Implementar tests End-to-End con Playwright para flujos críticos: Login, Crear Venta en POS, Registrar Producción, Exportar Excel. Añadir tests unitarios para los Services con Vitest. |
| **Impacto en el negocio** | 🟡 Medio — Previene errores futuros |
| **Esfuerzo de desarrollo** | 🔴 Alto — 3-4 sesiones (~10-15 horas) |
| **Riesgo técnico** | 🟢 Bajo — Tests no modifican código de producción |
| **ROI** | ⭐⭐⭐ Bueno (valor creciente con el tiempo) |

**Factibilidad:** ✅ FACTIBLE — Inversión en calidad a largo plazo

---

#### MEJORA #10: Conversión a PWA (Progressive Web App)

| Criterio | Evaluación |
|----------|-----------|
| **Problema actual** | Para acceder al sistema desde el celular, el usuario debe abrir el navegador y escribir la URL manualmente. No hay ícono en el escritorio ni experiencia nativa. |
| **Solución propuesta** | Crear un `manifest.json` con ícono, colores de marca y nombre de la app. Implementar un `service-worker.js` básico que permita instalar la app en el celular como una aplicación nativa, con ícono en la pantalla de inicio. |
| **Impacto en el negocio** | 🟡 Medio — Acceso más rápido desde el celular del panadero |
| **Esfuerzo de desarrollo** | 🟢 Bajo — 1 sesión (~1-2 horas) |
| **Riesgo técnico** | 🟢 Bajo — Es un archivo de configuración adicional |
| **ROI** | ⭐⭐⭐⭐ Muy bueno (poco esfuerzo, alto impacto percibido) |

**Factibilidad:** ✅ TOTALMENTE FACTIBLE

---

## 5. HOJA DE RUTA SUGERIDA

```mermaid
gantt
    title Roadmap de Mejoras V2 — Focaccia Plus and Coffee
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Fase 1 — Inmediata
    Toast Notifications           :f1a, 2026-03-02, 1d
    Backups Automáticos           :f1b, 2026-03-02, 1d
    Descuento de Empaques         :f1c, after f1a, 2d

    section Fase 2 — Corto Plazo
    Dashboard Inteligente         :f2a, after f1c, 2d
    Buscadores en Tablas          :f2b, after f2a, 1d
    Costos Dinámicos Reales       :f2c, after f2b, 2d

    section Fase 3 — Mediano Plazo
    Consolidación SQL             :f3a, after f2c, 2d
    Conversión a PWA              :f3b, after f3a, 1d

    section Fase 4 — Largo Plazo
    Migración CSS                 :f4a, after f3b, 3d
    Tests Automatizados           :f4b, after f4a, 4d
```

---

## 6. RESUMEN EJECUTIVO DE INVERSIÓN

| Fase | Mejoras | Horas Estimadas | Costo Infra | ROI Global |
|------|---------|----------------|-------------|------------|
| **Fase 1** | Toast, Backups, Empaques | ~8 horas | $0-25/mes | ⭐⭐⭐⭐⭐ |
| **Fase 2** | Dashboard, Buscadores, Costos | ~12 horas | $0 | ⭐⭐⭐⭐ |
| **Fase 3** | SQL Consolidado, PWA | ~6 horas | $0 | ⭐⭐⭐ |
| **Fase 4** | CSS, Tests | ~15 horas | $0 | ⭐⭐⭐ |
| **TOTAL** | **10 mejoras** | **~41 horas** | **$0-25/mes** | — |

---

## 7. CONCLUSIÓN Y DICTAMEN

El sistema Focaccia Plus and Coffee V2 se encuentra en un estado de madurez operativa sólida. Las 10 mejoras identificadas en este estudio son de naturaleza **evolutiva, no correctiva**, lo que indica que la base del sistema está bien diseñada.

**Dictamen de Factibilidad:** Las 10 mejoras propuestas son **TÉCNICAMENTE FACTIBLES** y pueden implementarse de manera incremental sin interrumpir las operaciones actuales. Las mejoras de Fase 1 ofrecen el mayor retorno de inversión con el menor esfuerzo y deben priorizarse.

> **RECOMENDACIÓN FINAL:** Aprobar la ejecución de la Fase 1 como prioridad inmediata y planificar la Fase 2 para las siguientes 2-4 semanas.

---

*Este documento es confidencial y de uso interno de Focaccia Plus and Coffee.*  
*Puede ser utilizado como referencia para presentaciones a socios, inversionistas o auditores técnicos.*
