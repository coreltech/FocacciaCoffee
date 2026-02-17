import { createClient } from '@supabase/supabase-js';

// Hardcoded based on previous success
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("📡 Testing Supabase Connection...");
    const start = Date.now();

    try {
        const { data, error } = await supabase.from('sales_orders').select('count').limit(1).single();

        if (error) throw error;

        const duration = Date.now() - start;
        console.log(`✅ Connection OK! Latency: ${duration}ms`);
        console.log("Data received:", data);
    } catch (err) {
        console.error("❌ Connection FAILED:", err.message);
    }
}

testConnection();
