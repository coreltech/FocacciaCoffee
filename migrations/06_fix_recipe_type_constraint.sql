-- MIGRATION 06: Fix Recipe Type Constraint
-- Updates allowed values for 'tipo_receta' to match the Professional Module.

-- 1. Eliminar el constraint anterior (buscando por nombre estándar si es posible o forzando la actualización)
-- Si no conoces el nombre exacto, el siguiente bloque busca y elimina el constraint de tipo CHECK para esa columna.

DO $$
DECLARE
    const_name TEXT;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' 
      AND rel.relname = 'recipes' 
      AND con.contype = 'c' 
      AND con.conname LIKE '%tipo_receta%';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE recipes DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

-- 2. Agregar el nuevo constraint con los tipos profesionales
ALTER TABLE recipes 
    ADD CONSTRAINT recipes_tipo_receta_check 
    CHECK (tipo_receta IN ('MASA', 'TRADICIONAL'));

-- 3. (Opcional) Migrar datos antiguos si existían
UPDATE recipes SET tipo_receta = 'TRADICIONAL' WHERE tipo_receta IN ('estandar', 'receta');
UPDATE recipes SET tipo_receta = 'MASA' WHERE tipo_receta IN ('base', 'panadera');
