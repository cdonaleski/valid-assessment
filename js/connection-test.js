// Supabase Connection Test
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

window.testSupabaseConnection = async function() {
    console.group('Supabase Connection Test');
    try {
        // Check environment
        const envCheck = window.checkEnvironment();
        console.log('Environment Check:', envCheck);

        if (!envCheck.hasSupabaseConfig) {
            throw new Error('Missing Supabase configuration');
        }

        // Create client
        console.log('Creating Supabase client...');
        const supabase = createClient(
            window.__env__.SUPABASE_URL,
            window.__env__.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                }
            }
        );

        // Test connection
        console.log('Testing connection...');
        const { data, error } = await supabase.from('test').select('*').limit(1);
        
        if (error) throw error;
        
        console.log('Connection successful!', { data });
        return { success: true, data };
    } catch (error) {
        console.error('Connection test failed:', error);
        return { 
            success: false, 
            error: error.message,
            details: {
                env: window.__env__?.VALID_ENV,
                url: window.__env__?.SUPABASE_URL?.substring(0, 10) + '...',
                hasKey: !!window.__env__?.SUPABASE_ANON_KEY
            }
        };
    } finally {
        console.groupEnd();
    }
}; 