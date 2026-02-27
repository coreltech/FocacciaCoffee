-- MIGRATION 54: Añadir Instrucciones a Recetas V2
-- Permite registrar el proceso de preparación paso a paso.

ALTER TABLE public.v2_recipes 
    ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Nota: No es necesario reiniciar el esquema, solo añadir la columna.
