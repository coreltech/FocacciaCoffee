import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// 🔐 FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{success: boolean, user: object|null, error: string|null}>}
 */
export async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error de login:', error);
            return { success: false, user: null, error: error.message };
        }

        // Obtener el perfil del usuario con su rol
        const profile = await getUserProfile(data.user.id);

        if (!profile) {
            return {
                success: false,
                user: null,
                error: 'No se encontró el perfil del usuario'
            };
        }

        // Guardar información en localStorage
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('user_role', profile.role);
        localStorage.setItem('user_name', profile.full_name || data.user.email);

        return {
            success: true,
            user: { ...data.user, profile },
            error: null
        };

    } catch (err) {
        console.error('Error inesperado en login:', err);
        return {
            success: false,
            user: null,
            error: 'Error de conexión. Intenta nuevamente.'
        };
    }
}

/**
 * Cierra la sesión del usuario
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function logout() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error al cerrar sesión:', error);
            return { success: false, error: error.message };
        }

        // Limpiar localStorage
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');

        return { success: true, error: null };

    } catch (err) {
        console.error('Error inesperado en logout:', err);
        return { success: false, error: 'Error al cerrar sesión' };
    }
}

/**
 * Obtiene el perfil del usuario desde la tabla user_profiles
 * @param {string} userId - ID del usuario
 * @returns {Promise<object|null>} - Perfil del usuario o null
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error al obtener perfil:', error);
            return null;
        }

        return data;

    } catch (err) {
        console.error('Error inesperado al obtener perfil:', err);
        return null;
    }
}

/**
 * Obtiene el rol del usuario actual desde localStorage
 * @returns {string|null} - 'director', 'gerente', 'asistente' o null
 */
export function getCurrentRole() {
    return localStorage.getItem('user_role');
}

/**
 * Obtiene el nombre del usuario actual desde localStorage
 * @returns {string|null}
 */
export function getCurrentUserName() {
    return localStorage.getItem('user_name');
}

/**
 * Verifica si hay una sesión activa
 * @returns {Promise<{isAuthenticated: boolean, user: object|null}>}
 */
export async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            return { isAuthenticated: false, user: null };
        }

        // Verificar que también tengamos el rol en localStorage
        const role = getCurrentRole();
        if (!role) {
            // Si no hay rol, obtenerlo de nuevo
            const profile = await getUserProfile(session.user.id);
            if (profile) {
                localStorage.setItem('user_role', profile.role);
                localStorage.setItem('user_name', profile.full_name || session.user.email);
            }
        }

        return {
            isAuthenticated: true,
            user: session.user
        };

    } catch (err) {
        console.error('Error al verificar autenticación:', err);
        return { isAuthenticated: false, user: null };
    }
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} requiredRole - Rol requerido ('director', 'gerente', 'asistente')
 * @returns {boolean}
 */
export function hasRole(requiredRole) {
    const currentRole = getCurrentRole();
    return currentRole === requiredRole;
}

/**
 * Verifica si el usuario tiene al menos uno de los roles especificados
 * @param {string[]} allowedRoles - Array de roles permitidos
 * @returns {boolean}
 */
export function hasAnyRole(allowedRoles) {
    const currentRole = getCurrentRole();
    return allowedRoles.includes(currentRole);
}
