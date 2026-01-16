# 🚀 Guía de Configuración: Sistema de Autenticación con Vite

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de autenticación con roles para el ERP de Focaccia & Coffee. Los cambios incluyen:

1. ✅ **Configuración de Vite** para desarrollo moderno
2. ✅ **Sistema de autenticación** con Supabase
3. ✅ **Control de acceso por roles** (Director, Gerente, Asistente)
4. ✅ **Login elegante** con estilo Mediterráneo
5. ✅ **Políticas RLS** para seguridad híbrida (web pública + ERP privado)

---

## 🔧 Paso 1: Instalar Dependencias

Primero, instala las dependencias de Node.js:

```bash
npm install
```

Esto instalará:
- Vite (servidor de desarrollo)
- @supabase/supabase-js (cliente de Supabase)

---

## 🗄️ Paso 2: Configurar Base de Datos

### 2.1. Ejecutar Migración de User Profiles

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `migrations/22_user_profiles_and_auth.sql`
3. Ejecuta el script

### 2.2. Crear tu Perfil de Director

Primero, obtén tu ID de usuario:

```sql
SELECT id, email FROM auth.users;
```

Luego, crea tu perfil de director (reemplaza `TU_USER_ID` con el ID real):

```sql
INSERT INTO public.user_profiles (id, email, role, full_name)
VALUES (
    'TU_USER_ID',  -- Reemplaza con tu ID real
    'tu@email.com',
    'director',
    'Agustín Lugo'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'director', full_name = 'Agustín Lugo';
```

### 2.3. Ejecutar Migración de RLS Policies

1. En **SQL Editor**, copia y pega el contenido de `migrations/23_rls_policies.sql`
2. Ejecuta el script

Esto configurará:
- ✅ Acceso público a `sales_prices` y `catalog_composition` (para web de clientes)
- ✅ Acceso restringido a costos (solo director)
- ✅ Acceso a inventario (director y gerente)
- ✅ Acceso a ventas (todos los roles)

---

## 🚀 Paso 3: Iniciar el Servidor de Desarrollo

Ahora puedes iniciar tu sistema con Vite:

```bash
npm run dev
```

Esto iniciará el servidor en **http://localhost:3000** y abrirá automáticamente tu navegador.

---

## 🔐 Paso 4: Iniciar Sesión

1. El sistema te redirigirá automáticamente a `/login.html`
2. Ingresa tus credenciales de Supabase:
   - **Email**: tu email registrado
   - **Contraseña**: tu contraseña de Supabase
3. Al hacer login exitoso, serás redirigido al dashboard

---

## 👥 Sistema de Roles

### Director (Tú)
- ✅ Acceso completo a todo el sistema
- ✅ Puede ver costos de suministros e ingredientes
- ✅ Puede cambiar tasas de cambio
- ✅ Puede gestionar inventario, producción y ventas
- ✅ Puede ver todos los reportes

### Gerente
- ✅ Puede gestionar inventario y producción
- ✅ Puede registrar ventas
- ✅ Puede ver reportes (sin costos)
- ❌ NO puede ver costos de suministros
- ❌ NO puede cambiar tasas de cambio

### Asistente
- ✅ Puede ver catálogo de productos
- ✅ Puede registrar ventas
- ❌ NO puede ver costos
- ❌ NO puede gestionar inventario o producción

---

## 🎨 Características del Login

El login tiene un diseño **Gourmet Mediterráneo** con:

- 🌿 Paleta de colores tierra (oliva, terracota, arena)
- ✨ Efectos glassmorphism y animaciones suaves
- 📱 Diseño responsive (funciona en móvil y desktop)
- 🔒 Validación de formularios
- ⚠️ Mensajes de error elegantes

---

## 🔄 Cerrar Sesión

Para cerrar sesión:
1. Haz clic en el botón **"🚪 Cerrar Sesión"** en la esquina superior derecha
2. Serás redirigido automáticamente al login

---

## 🌐 Seguridad Híbrida

### Web Pública (Clientes)
- Los clientes pueden ver el catálogo de productos sin autenticación
- Tablas públicas: `sales_prices`, `catalog_composition`
- Ideal para una futura web de pedidos online

### ERP Privado (Equipo)
- Requiere autenticación para acceder
- Control de acceso basado en roles
- Protección de datos sensibles (costos, inventario)

---

## 📝 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

---

## 🐛 Solución de Problemas

### Error: "No se encontró el perfil del usuario"
- Asegúrate de haber ejecutado la migración `22_user_profiles_and_auth.sql`
- Verifica que tu perfil de director esté creado en la tabla `user_profiles`

### Error: "Acceso Denegado"
- Verifica que tu rol sea correcto en la tabla `user_profiles`
- Asegúrate de haber ejecutado la migración `23_rls_policies.sql`

### El servidor no inicia
- Ejecuta `npm install` para instalar dependencias
- Verifica que el puerto 3000 no esté en uso

---

## 🎯 Próximos Pasos

1. ✅ Crear usuarios adicionales (gerentes, asistentes) desde Supabase Dashboard
2. ✅ Personalizar los permisos según tus necesidades
3. ✅ Probar el acceso con diferentes roles
4. ✅ Configurar la web pública de clientes (opcional)

---

## 📞 Soporte

Si tienes algún problema, revisa:
1. La consola del navegador (F12) para errores de JavaScript
2. Los logs de Supabase para errores de base de datos
3. El terminal donde corre `npm run dev` para errores del servidor

¡Disfruta tu nuevo sistema de autenticación! 🎉
