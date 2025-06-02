// Test Supabase connection
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

async function testSupabaseConnection() {
    try {
        console.log('Starting Supabase connection test...');
        
        // Get environment variables
        const env = window.__env__;
        if (!env) {
            throw new Error('Environment variables not loaded');
        }

        console.log('Environment status:', window.checkEnvironment());

        // Create client
        console.log('Creating Supabase client...', {
            hasUrl: !!env.SUPABASE_URL,
            hasKey: !!env.SUPABASE_ANON_KEY,
            urlLength: env.SUPABASE_URL?.length,
            keyLength: env.SUPABASE_ANON_KEY?.length
        });

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        });

        // Test basic query
        console.log('Testing database query...');
        const { data, error } = await supabase
            .from('questions')
            .select('count')
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        console.log('Query successful:', data);

        // Test auth status
        const { data: authData } = await supabase.auth.getSession();
        console.log('Auth status:', {
            hasSession: !!authData?.session,
            sessionExpires: authData?.session?.expires_at
        });

        // Test realtime
        console.log('Testing realtime connection...');
        const channel = supabase.channel('test');
        const status = await new Promise((resolve) => {
            channel
                .subscribe((status) => {
                    resolve(status);
                });
        });
        console.log('Realtime status:', status);
        channel.unsubscribe();

        console.log('All tests passed! Supabase connection is working.');
        return true;
    } catch (error) {
        console.error('Supabase test failed:', {
            message: error.message,
            stack: error.stack,
            details: error.details || {},
            hint: error.hint || '',
            code: error.code || ''
        });
        return false;
    }
}

// Add test function to window for easy access
window.testSupabase = testSupabaseConnection;

// Auto-run test when loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Running Supabase connection test...');
    testSupabaseConnection();
}); 