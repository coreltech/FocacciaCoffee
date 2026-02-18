# Plan de Implementación General

Este documento rastrea la evolución del proyecto, desde rediseños anteriores hasta la fase actual de estabilidad.

# Fase 2: Rediseño Radical - "Dinamismo" (Completada)

## Descripción del Objetivo
El usuario solicitaba maximizar el **Dinamismo Visual** y la **Retroalimentación Interactiva**.
Nos alejamos del diseño estándar de "tabla aburrida" hacia una experiencia moderna tipo app.

## Cambios Realizados
### 1. Reajuste Visual (Alto Contraste y Profundidad)
- **Fondos**: Patrones sutiles y acentos oscuros.
- **Sombras**: Profundidad incrementada (`box-shadow` modernos).
- **Glassmorphism**: Efectos de desenfoque en cabeceras.

### 2. Transformación de Diseño (Basado en Tarjetas)
- **Lista de Ítems**: Grilla de tarjetas ricas en información.
- **Panel de Agregar**: Panel flotante distintivo.

### 3. Características de "Dinamismo"
- **Totales en Vivo**: Animación de conteo numérico.
- **Efectos de Entrada**: Labels flotantes y validaciones animadas.

---

# Fase 3: Rediseño del Módulo de Ventas (Consistencia)

## Descripción del Objetivo
Aplicar el patrón de diseño "Dinámico" y "Basado en Tarjetas" al Módulo de Ventas (POS). Unificar la UX y mejorar la velocidad en pantallas táctiles.

## Beneficios
1.  **Velocidad**: Selección rápida desde grilla visual.
2.  **Menos Errores**: Tarjetas grandes con precio visible.
3.  **Experiencia Táctil**: Botones grandes ideales para tablets.
4.  **Estética Premium**: Diseño Glassmorphism.

## Cambios Realizados
- **Layout**: Cambio de `formulario + tabla` a `Catálogo (Izquierda) + Carrito (Derecha)`.
- **Nuevos Componentes**: `ProductCard`, `CategoryPills`.

---

# Fase 3.1: Refinamiento de Reportes de Ventas

## Objetivo
Resolver la confusión sobre "Quién me debe" y "Entregas Futuras".

## Cambios
1.  **Reservas**: Pestaña dedicada para ver entregas futuras.
2.  **Dashboard de Cuentas por Cobrar**: Tarjeta de "Deuda Total" al inicio.
3.  **Claridad Visual**: Badges distintivos para diferenciar "Inmediato" vs "Delivery".

---

# Fase 3.2: Lógica de Reservas (Stock Cero)

## Objetivo
Permitir crear órdenes para fechas futuras incluso si el stock actual es 0 (Producción bajo Pedido).

## Cambios
1.  **Controlador**: Asegurar paso de `delivery_date`.
2.  **Servicio**: Insertar directo (saltar chequeo atómico) si es fecha futura.

---

# Fase 4: Reportes y Dashboards (Exportación)

## Cambios
- **Dashboard Visual**: Gráficos de ventas.
- **Exportación Excel**: Descarga de reportes detallados.

---

# Fase 5: Alineación de Lógica de Negocio (Ciclo Semanal)

## Problema
El sistema imponía límites de fábrica rígidos a un flujo de trabajo flexible semanal.

## Cambios
- **Reservas Stock Cero**: Permitir preventa sin stock físico.
- **Fecha Automática**: Preselección de "Viernes Próximo".
- **Correcciones Críticas**: Solución de errores RPC y bloqueos de stock.

---

# Fase 8: Modernización Modular e Integración (Inicia 22/02/2026)


## Estrategia de Desarrollo: "Sistema Paralelo" (Staging)
**Aprobado por el Usuario:** Para eliminar el riesgo de "bombas" en producción, todo el trabajo de modernización se hará en un entorno separado.
1.  **Ambiente de Pruebas (Staging)**: Se creará una copia exacta del sistema (en otra carpeta o rama) para trabajar sin miedo.
2.  **Validación**: Solo cuando el módulo paralelo funcione perfecto, se pasará al sistema "En Vivo".
3.  **Junta de Desarrollo (Kickoff)**: El Domingo iniciará con una sesión de preguntas y respuestas para definir cada detalle antes de escribir código.

## Calendario Propuesto
1.  **Domingo 22/02**:
    *   **Junta de Requerimientos**: Q&A Profundo.
    *   **Setup del Sistema Paralelo**: Crear el "Laboratorio".
    *   Definición del "Núcleo Compartido".
2.  **Lunes 23/02**: Modernización Ventas (En Paralelo).
3.  **Martes 24/02**: Modernización Producción (En Paralelo).


---

# Fase 6: Estabilidad y Blindaje (El Plan "Anti-Bombas")

## Objetivo
Asegurar que el sistema sea **Resiliente**. Un fallo en una parte (ej. chequeo de stock) nunca debe detener el negocio principal (vender).

## Cambios Propuestos
### Backend (Supabase/Service)
- [ ] **Límite de Errores Global (Global Error Boundary)**: Envolver llamadas críticas (Ventas, Clientes) en bloques try/catch que por defecto asuman "Éxito" donde sea posible.
- [ ] **Revisión de Restricciones de BD**: Revisar restricciones `NOT NULL`. Solo campos estrictamente necesarios (ID, Monto) deben ser obligatorios. Otros deben tener valores por defecto.
- [ ] **Auto-Curación de Datos**: Si un cliente o producto genérico es borrado, el sistema debe auto-recrearlos al vuelo.

### Frontend (Aplicación Cliente)
- [ ] **Sanitizador de Entradas**: Antes de enviar `registerSale`, correr un sanitizador que rellene valores `null` con defectos (ej. `product_name = "Ítem Desconocido"`).
- [ ] **UI Optimista**: Mostrar "Éxito" inmediatamente al usuario mientras se procesa en segundo plano.
- [ ] **Guardia Offline**: Si falla la red, guardar la venta en `localStorage` y mostrar una insignia de "Pendiente de Sincronización" (Modo Offline Básico).
