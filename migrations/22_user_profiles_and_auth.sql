-- ============================================
-- MIGRATION 22: User Profiles and Authentication
-- ============================================
-- Este script crea la tabla de perfiles de usuario y configura
-- el sistema de autenticación con roles (director, gerente, asistente)

-- 1. Crear tabla user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role text NOT NULL CHECK (role IN ('director', 'gerente', 'asistente')),
    full_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 4. Política: Solo el director puede ver todos los perfiles
CREATE POLICY "Directors can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'director'
        )
    );

-- 5. Crear función para auto-crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        'asistente', -- Rol por defecto
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATOS INICIALES
-- ============================================

-- IMPORTANTE: Reemplaza 'USUARIO_ID_DE_AGUSTIN' con el UUID real del usuario director
-- Puedes obtenerlo ejecutando: SELECT id, email FROM auth.users;

-- Ejemplo (DEBES CAMBIAR EL ID):
-- INSERT INTO public.user_profiles (id, email, role, full_name)
-- VALUES (
--     'USUARIO_ID_DE_AGUSTIN',
--     'agustin@focaccia.com',
--     'director',
--     'Agustín Lugo'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'director', full_name = 'Agustín Lugo';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Después de ejecutar esta migración, debes crear el perfil del director manualmente
-- 2. Para crear nuevos usuarios, usa el panel de Supabase Authentication
-- 3. Los nuevos usuarios se crearán automáticamente con rol 'asistente'
-- 4. Solo el director puede cambiar roles (esto se debe hacer desde el panel de Supabase)
