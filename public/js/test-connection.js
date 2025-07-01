import supabaseClient from './supabase-client.js';
import { logger } from './logger.js';

async function testConnection() {
    try {
        logger.info('Starting Supabase connection test...');
        
        // Initialize client
        const supabase = await supabaseClient.initialize();
        
        // Test database connection
        logger.info('Testing database connection...');
        const { error: tableError } = await supabase.rpc('create_tables_if_not_exist');
        
        if (tableError && tableError.code !== 'PGRST302') { // Ignore function not found error
            throw tableError;
        }
        
        // Test table access
        const { data, error } = await supabase
            .from('questions')
            .select('count')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        logger.info('Connection test successful!', { data });
        return { success: true, data };
    } catch (error) {
        logger.error('Connection test failed:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return { success: false, error };
    }
}

// Run test when script is loaded
testConnection().then(result => {
    console.log('Test result:', result);
}); 