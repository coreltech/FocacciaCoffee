-- MIGRATION: Patch Global Trigger Function (FIXED)
-- The operator '?' only works on JSONB, not JSON.
-- We cast row_to_json(NEW) to JSONB to correctly check for the key.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the record 'NEW' has the key 'updated_at'
    -- Cast to JSONB because '?' operator requires jsonb
    IF (row_to_json(NEW)::jsonb ? 'updated_at') THEN
        NEW.updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Force reload schema to ensure this new function definition is picked up
NOTIFY pgrst, 'reload schema';
