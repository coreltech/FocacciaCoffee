
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Detecting schema for 'operational_expenses'...");
    const { data, error } = await supabase
        .from('operational_expenses')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (data.length > 0) {
            console.log("Keys found:", Object.keys(data[0]));
            console.log("Sample Data:", data[0]);
        } else {
            console.log("Table is empty. Cannot detect keys automatically.");
            // Fallback: Try to insert a dummy to see error or successful keys if I knew them, but better to ask user or assume standard keys if empty.
            // or try to select standard keys
            const { error: err2 } = await supabase.from('operational_expenses').select('id, amount, description, date').limit(1);
            if (!err2) console.log("Standard keys (id, amount, description, date) seem to exist.");
            else console.log("Standard keys error:", err2.message);
        }
    }
}

checkSchema();
