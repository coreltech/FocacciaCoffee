# 🎨 Guía: Selector de Iconos para Productos

## ✨ Funcionalidad

Selector visual de iconos para productos de **Cafetería** y **Bebidas**.

---

## 📖 Cómo Usar

### Paso 1: Selecciona la Categoría

El selector **solo aparece** para:
- ☕ **Cafetería**
- 🥤 **Bebidas**

> [!NOTE]
> Para Focaccias y Salsas se oculta automáticamente (usan imágenes fotográficas).

### Paso 2: Selecciona el Icono

**Opción A: Selector Visual**
- Haz clic en cualquier emoji del panel
- Se resaltará en azul cuando esté seleccionado

**Opción B: Escribir/Pegar Emoji**
- Haz clic en el campo de icono
- Presiona `Windows + .` para abrir selector de Windows
- O copia y pega cualquier emoji

#### Iconos Disponibles en el Panel:

**☕ Café y Calientes**: ☕ 🍵 🫖 🧋 🥤

**🥤 Refrescos y Sodas**: 🥤 🧃 🧊 🥛

**💧 Agua y Naturales**: 💧 🚰 🥥 🍋

**🍺 Otros**: 🍺 🍷 🍹 🧉

### Paso 3: Limpiar (Opcional)

- Botón rojo **"✕ Limpiar"** para quitar el icono
- La web usará detección automática si está vacío

---

## 🎯 Detección Automática

Si NO seleccionas icono, la web detecta automáticamente:

| Nombre del Producto | Icono Automático |
|---------------------|------------------|
| "Café Americano" | ☕ |
| "Coca Cola" | 🥤 |
| "Agua Mineral" | 💧 |
| "Té Verde" | 🍵 |

---

## 💡 Consejos

1. **Focaccias**: No uses iconos, usa fotos de alta calidad
2. **Bebidas**: Selecciona el icono más representativo
3. **Personalización**: Campo editable para cualquier emoji
4. **Cambios**: Edita el icono en cualquier momento

---

## ✅ Verificación

1. Abre **Catálogo** en el ERP
2. Clic en **"+ Nuevo Producto"**
3. Selecciona **"Cafetería"** o **"Bebidas"**
4. Aparecerá el selector de iconos
5. Selecciona emoji y guarda
6. Verifica en la web

---

## 🔧 Archivos Modificados

- `catalog.view.js` (líneas 129-209) - UI del selector
- `catalog.controller.js` (líneas 75-102, 242-270) - Lógica de interacción
