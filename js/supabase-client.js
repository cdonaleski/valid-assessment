import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { logger } from './logger.js';

let supabaseInstance = null;
let initializationAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function initialize(retryCount = 0) {
    try {
        if (!window.__env__) {
            throw new Error('Environment variables not loaded');
        }

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__env__;
        
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Missing Supabase configuration');
        }

        logger.info('Initializing Supabase client', {
            hasUrl: !!SUPABASE_URL,
            hasKey: !!SUPABASE_ANON_KEY,
            attempt: retryCount + 1
        });

        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        });

        // Test the connection
        const { data, error } = await supabaseInstance.from('test').select('count').limit(1);
        if (error) throw error;

        logger.info('Supabase client initialized successfully');
        return supabaseInstance;
    } catch (error) {
        logger.error('Failed to initialize Supabase client', {
            error: error.message,
            attempt: retryCount + 1
        });

        if (retryCount < MAX_RETRIES) {
            logger.info(`Retrying Supabase initialization in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return initialize(retryCount + 1);
        }

        throw new Error(`Failed to initialize Supabase after ${MAX_RETRIES} attempts: ${error.message}`);
    }
}

export default {
    initialize,
    getInstance() {
        if (!supabaseInstance) {
            throw new Error('Supabase client not initialized. Call initialize() first.');
        }
        return supabaseInstance;
    },
    isInitialized() {
        return !!supabaseInstance;
    }
}; 