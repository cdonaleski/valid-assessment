// Environment Test Script
import { logger } from './logger.js';
import supabaseClient from './supabase-client.js';

async function testEnvironment() {
    logger.info('Starting environment test...');

    // 1. Check environment variables
    const envCheck = window.checkEnvironment();
    logger.info('Environment check', envCheck);

    // 2. Test Supabase connection
    try {
        await supabaseClient.initialize();
        logger.info('Supabase initialization successful');

        // 3. Check health
        const healthStatus = await supabaseClient.checkHealth();
        logger.info('Health check', healthStatus);

        if (!healthStatus.healthy) {
            throw new Error(`Health check failed: ${healthStatus.error}`);
        }

        // 4. Test basic database operations
        const instance = supabaseClient.getInstance();
        
        // Test read operation
        const { data: readData, error: readError } = await instance
            .from('questions')
            .select('count')
            .limit(1);

        if (readError) {
            throw readError;
        }

        logger.info('Database read test successful', { data: readData });

        return {
            success: true,
            environment: window.__env__?.VALID_ENV,
            supabase: {
                status: supabaseClient.getStatus(),
                health: healthStatus
            },
            logs: logger.getLogs()
        };
    } catch (error) {
        logger.error('Environment test failed', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });

        return {
            success: false,
            error: error.message,
            environment: window.__env__?.VALID_ENV,
            supabase: supabaseClient.getStatus(),
            logs: logger.getLogs()
        };
    }
}

// Make test function available globally
window.testEnvironment = testEnvironment;

// Auto-run test when script is loaded
testEnvironment().then(result => {
    console.log('Environment test complete:', result);
}).catch(error => {
    console.error('Environment test failed:', error);
}); 