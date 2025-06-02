import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';
import { logger } from './logger.js';

let supabaseInstance = null;
let initializationAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function initialize(retryCount = 0) {
    try {
        // Log initialization attempt
        logger.info('Starting Supabase initialization', {
            attempt: retryCount + 1,
            maxRetries: MAX_RETRIES,
            hasInstance: !!supabaseInstance
        });

        // Check environment
        if (!window.__env__) {
            logger.error('Environment not loaded', {
                env: typeof window.__env__,
                windowKeys: Object.keys(window)
            });
            throw new Error('Environment variables not loaded');
        }

        const { SUPABASE_URL, SUPABASE_ANON_KEY, VALID_ENV } = window.__env__;
        
        // Log environment status
        logger.info('Environment check', {
            hasUrl: !!SUPABASE_URL,
            urlLength: SUPABASE_URL?.length,
            hasKey: !!SUPABASE_ANON_KEY,
            keyLength: SUPABASE_ANON_KEY?.length,
            environment: VALID_ENV
        });
        
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logger.error('Missing Supabase configuration', {
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_ANON_KEY
            });
            throw new Error('Missing Supabase configuration');
        }

        // Create client
        logger.info('Creating Supabase client...');
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        });

        // Test basic connectivity
        logger.info('Testing basic connectivity...');
        const { data: versionData, error: versionError } = await supabaseInstance
            .rpc('version')
            .select();

        if (versionError) {
            logger.warn('Basic connectivity test failed', {
                error: versionError.message,
                code: versionError.code,
                details: versionError.details,
                hint: versionError.hint
            });
        } else {
            logger.info('Basic connectivity test passed', { version: versionData });
        }

        // Test table access
        logger.info('Testing questions table access...');
        const { data, error } = await supabaseInstance
            .from('questions')
            .select('count')
            .limit(1);

        if (error) {
            logger.error('Questions table test failed', {
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        logger.info('Supabase client initialized successfully', {
            hasData: !!data,
            dataType: typeof data,
            connectionStatus: supabaseInstance.connectionStatus
        });
        
        return supabaseInstance;
    } catch (error) {
        logger.error('Failed to initialize Supabase client', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            attempt: retryCount + 1,
            stack: error.stack
        });

        if (retryCount < MAX_RETRIES) {
            logger.info(`Retrying Supabase initialization in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return initialize(retryCount + 1);
        }

        throw new Error(`Failed to initialize Supabase after ${MAX_RETRIES} attempts: ${error.message}`);
    }
}

// Add connection status check
function getConnectionStatus() {
    if (!supabaseInstance) {
        return {
            status: 'not_initialized',
            error: null
        };
    }
    
    return {
        status: 'initialized',
        connectionStatus: supabaseInstance.connectionStatus,
        hasInstance: true,
        auth: {
            session: supabaseInstance.auth.session(),
            user: supabaseInstance.auth.user()
        }
    };
}

export default {
    initialize,
    getInstance() {
        if (!supabaseInstance) {
            logger.error('Supabase client accessed before initialization');
            throw new Error('Supabase client not initialized. Call initialize() first.');
        }
        return supabaseInstance;
    },
    isInitialized() {
        return !!supabaseInstance;
    },
    getStatus: getConnectionStatus
}; 