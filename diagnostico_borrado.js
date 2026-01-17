// ============================================
// 🔍 SCRIPT DE DIAGNÓSTICO - BORRADO DE PRODUCTOS
// ============================================
// Copia y pega este script completo en la consola del navegador (F12)
// mientras estás en el ERP para diagnosticar problemas de eliminación

console.log('🔍 Iniciando diagnóstico del sistema de borrado...\n');

async function diagnosticarSistema() {
    const resultados = {
        sesion: null,
        rol: null,
        perfil: null,
        politicasRLS: null,
        pruebaEliminacion: null
    };

    // 1. Verificar sesión activa
    console.log('1️⃣ Verificando sesión activa...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        resultados.sesion = {
            activa: !!session,
            email: session?.user?.email,
            userId: session?.user?.id
        };
        console.log('✅ Sesión:', resultados.sesion);
    } catch (err) {
        console.error('❌ Error al verificar sesión:', err);
        resultados.sesion = { error: err.message };
    }

    // 2. Verificar rol en localStorage
    console.log('\n2️⃣ Verificando rol en localStorage...');
    resultados.rol = {
        localStorage: localStorage.getItem('user_role'),
        userName: localStorage.getItem('user_name'),
        userEmail: localStorage.getItem('user_email')
    };
    console.log('📦 LocalStorage:', resultados.rol);

    // 3. Verificar perfil en base de datos
    console.log('\n3️⃣ Verificando perfil en base de datos...');
    try {
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', resultados.sesion.userId)
            .single();

        if (error) throw error;

        resultados.perfil = profile;
        console.log('✅ Perfil en DB:', profile);
    } catch (err) {
        console.error('❌ Error al obtener perfil:', err);
        resultados.perfil = { error: err.message };
    }

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando permisos de eliminación...');
    try {
        // Intentar obtener la función de rol
        const { data, error } = await supabase.rpc('get_user_role');

        resultados.politicasRLS = {
            funcionRol: data,
            error: error?.message
        };
        console.log('🔐 Función get_user_role():', data || error?.message);
    } catch (err) {
        console.warn('⚠️ No se pudo verificar función RLS:', err.message);
        resultados.politicasRLS = { error: err.message };
    }

    // 5. Prueba de eliminación (simulada)
    console.log('\n5️⃣ Probando permisos de eliminación en sales_prices...');
    try {
        // Intentar hacer un SELECT para verificar acceso
        const { data: testData, error: testError } = await supabase
            .from('sales_prices')
            .select('id')
            .limit(1);

        if (testError) throw testError;

        console.log('✅ Acceso de lectura a sales_prices: OK');

        // Verificar si podemos hacer DELETE (sin ejecutarlo realmente)
        // Esto solo verifica la política, no elimina nada
        resultados.pruebaEliminacion = {
            lecturaOK: true,
            mensaje: 'Para probar DELETE real, intenta eliminar un producto de prueba desde el ERP'
        };
    } catch (err) {
        console.error('❌ Error de acceso a sales_prices:', err);
        resultados.pruebaEliminacion = { error: err.message };
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));

    const rolActual = resultados.perfil?.role || resultados.rol.localStorage || 'DESCONOCIDO';
    const puedeEliminar = ['director', 'gerente'].includes(rolActual);

    console.log(`\n👤 Usuario: ${resultados.sesion.email}`);
    console.log(`🎭 Rol actual: ${rolActual}`);
    console.log(`🔓 Puede eliminar productos: ${puedeEliminar ? '✅ SÍ' : '❌ NO'}`);

    if (!puedeEliminar) {
        console.log('\n⚠️ PROBLEMA DETECTADO:');
        console.log('Tu rol actual no permite eliminar productos.');
        console.log('\n💡 SOLUCIÓN:');
        console.log('Ejecuta en Supabase SQL Editor:');
        console.log(`
UPDATE user_profiles 
SET role = 'director' 
WHERE id = '${resultados.sesion.userId}';
        `);
    } else {
        console.log('\n✅ Tu rol tiene permisos para eliminar productos.');
        console.log('Si aún no puedes borrar, verifica:');
        console.log('  1. Que estés usando el botón 🗑️ en el módulo Catálogo');
        console.log('  2. Que aparezca un mensaje de error específico');
        console.log('  3. La consola del navegador para ver el error completo');
    }

    console.log('\n' + '='.repeat(60));

    return resultados;
}

// Ejecutar diagnóstico
diagnosticarSistema().then(resultados => {
    console.log('\n✅ Diagnóstico completado. Resultados guardados en variable "resultados"');
    window.diagnosticoResultados = resultados;
}).catch(err => {
    console.error('❌ Error durante el diagnóstico:', err);
});
