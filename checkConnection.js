import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project details
const SUPABASE_URL = 'https://ivisqrqipcjqwdoqefpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXNxcnFpcGNqcXdkb3FlZnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyOTQ3MTYsImV4cCI6MjA1Nzg3MDcxNn0.MGkJU7dc5S5Ej9i9Z53vpO2tDNz3SLy0uOFs5I6hyUQ';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
    const { data, error } = await supabase.from("Inventory").select('*').limit(1);
    
    if (error) {
        console.error('Database connection failed:', error.message);
    } else {
        console.log('Database connected successfully:', data);
    }
}

checkConnection();
