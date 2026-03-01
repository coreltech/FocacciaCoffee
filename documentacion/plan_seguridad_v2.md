# Plan de Seguridad y Auditoría (Mejoras Futuras)

Este documento detalla las opciones para fortalecer el control sobre los datos críticos (especialmente recetas y costos) para evitar errores accidentales en la operación compartida entre socios.

## Opción 1: Bloqueo de Seguridad (Quick-Fix)
**Objetivo**: Evitar ediciones accidentales ("dedazos").
- **Implementación**:
    - Las recetas inician en modo "Solo Lectura".
    - Se añade un botón "🔓 Habilitar Edición" que dispara una advertencia clara.
    - Los campos se desbloquean solo tras confirmar conscientemente.

## Opción 2: Log de Auditoría (Recomendado)
**Objetivo**: Trazabilidad total sin limitar la autonomía de los socios.
- **Base de Datos**: Nueva tabla `v2_audit_logs`.
    - `user_id`: Quién hizo el cambio.
    - `action`: Tipo de acción (UPDATE, DELETE).
    - `table_name`: Qué tabla se tocó.
    - `record_id`: ID del registro afectado (ej, ID de la Focaccia).
    - `old_data`: JSON con los valores antes del cambio.
    - `new_data`: JSON con los nuevos valores.
- **Uso**: Si una masa sale mal, se consulta el log para ver qué cambió y cuándo.

## Opción 3: Flujo de Aprobación (Control Total)
**Objetivo**: Garantizar consenso en cambios técnicos.
- **Lógica**:
    - Los cambios realizados por un usuario se guardan en una tabla temporal o con un estado `pending_review`.
    - El otro socio recibe una notificación o ve un aviso en su Dashboard: *"Hay 1 cambio de receta pendiente de revisión"*.
    - El cambio solo se aplica a la tabla principal tras el "Visto Bueno" del otro socio.

## Próximos Pasos Sugeridos
1. **Prioridad 1**: Implementar el **Audit Log** (Opción 2), ya que es silencioso, no interrumpe el trabajo y proporciona una "máquina del tiempo" para corregir errores.
2. **Prioridad 2**: Añadir **Advertencias de Impacto** en campos críticos (como el peso esperado o ingredientes base).
