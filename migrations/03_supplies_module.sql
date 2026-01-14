-- MIGRATION: Create Supplies Table
-- This table implements the professional supply module with conversion logic.

CREATE TABLE IF NOT EXISTS supplies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    brand text,
    category text CHECK (category IN ('Secos', 'Líquidos', 'Empaquetados')),
    purchase_unit text NOT NULL, -- Ej: Bulto, Caja, Litro
    min_unit text NOT NULL,      -- Ej: Gramos, Unidades, ml
    equivalence numeric(12,4) NOT NULL DEFAULT 1, -- Cantidad de unidades mínimas por unidad de compra
    last_purchase_price numeric(12,2) DEFAULT 0,
    stock_min_units numeric(12,4) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);

-- 2. Row Level Security (RLS)
-- IMPORTANTE: Sin esto, el cliente no podrá leer ni escribir aunque la tabla exista.
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso público (Lectura/Escritura) - Ajustar según seguridad deseada
CREATE POLICY "Allow public access to supplies" ON supplies 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 3. Función para actualizar el timestamp de 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supplies_updated_at
    BEFORE UPDATE ON supplies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
