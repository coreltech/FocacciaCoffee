# Focaccia Plus & Coffee - ERP System

Sistema de gestión empresarial integral para Focaccia Plus & Coffee.

## 🚀 Despliegue en Vercel

### Prerequisitos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)

### Paso 1: Subir a GitHub

1. **Inicializar Git** (si no lo has hecho):
```bash
cd "C:\Users\Agustin Lugo\Desktop\proyectos2026\Focaccia Plus and Coffee"
git init
git add .
git commit -m "Initial commit - Focaccia ERP v2.0"
```

2. **Crear repositorio en GitHub**:
   - Ve a [github.com/new](https://github.com/new)
   - Nombre: `focaccia-erp`
   - Visibilidad: **Private** (recomendado)
   - NO inicialices con README (ya tienes uno)

3. **Conectar y subir**:
```bash
git remote add origin https://github.com/TU_USUARIO/focaccia-erp.git
git branch -M main
git push -u origin main
```

### Paso 2: Configurar Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Copia las credenciales:
   - **URL del Proyecto**: `https://xxx.supabase.co`
   - **Anon Key**: `eyJhbGc...`

### Paso 3: Desplegar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Configura las **Variables de Entorno**:
   - `VITE_SUPABASE_URL` = URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon key de Supabase
4. Haz clic en **"Deploy"**

### Paso 4: Aplicar Migraciones

Las migraciones SQL están en la carpeta `migrations/`. Debes ejecutarlas en orden en el SQL Editor de Supabase:

1. Ve a Supabase → SQL Editor
2. Ejecuta cada archivo en orden numérico (01, 02, 03... 35)
3. Verifica que no haya errores

## 📁 Estructura del Proyecto

```
Focaccia Plus and Coffee/
├── src/                    # Código fuente
│   ├── core/              # Autenticación, router, state
│   ├── modules/           # Módulos del ERP
│   └── ui/                # Estilos y componentes UI
├── migrations/            # Migraciones SQL (Supabase)
├── index.html            # Página principal
├── login.html            # Página de login
├── package.json          # Dependencias
├── vite.config.js        # Configuración Vite
├── vercel.json           # Configuración Vercel
├── .gitignore            # Archivos ignorados por Git
├── MANUAL_USUARIO.md     # Manual de usuario completo
└── README.md             # Este archivo
```

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 📚 Documentación

- [Manual de Usuario](./MANUAL_USUARIO.md) - Guía completa de todos los módulos
- [Guía de Autenticación](./GUIA_SETUP_AUTH.md) - Configuración de usuarios y roles
- [Estructura de Datos](./REPORTE_ESTRUCTURA_DATOS.md) - Esquema de base de datos

## 🔒 Seguridad

- **NO** subas archivos `.env` a GitHub
- **NO** compartas tus API keys públicamente
- Usa variables de entorno en Vercel para credenciales
- Mantén el repositorio **privado**

## 📦 Archivos que NO se suben a GitHub

El `.gitignore` excluye automáticamente:
- `node_modules/` - Dependencias (se reinstalan en Vercel)
- `.env*` - Variables de entorno sensibles
- `dist/` - Build de producción (se genera en Vercel)
- `.gemini/` - Archivos de desarrollo internos

## 🆘 Soporte

Para problemas técnicos, revisa:
1. Los logs de Vercel (vercel.com/dashboard)
2. Los logs de Supabase (supabase.com/dashboard)
3. La consola del navegador (F12)

## 📝 Licencia

Propietario: Focaccia Plus & Coffee  
Todos los derechos reservados.
