import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';
import { logger } from './logger.js';

// Singleton instance
let supabaseInstance = null;
let initializationPromise = null;
const MAX_RETRIES = 5; // Reduced retries to fail faster
const RETRY_DELAY = 1000; // Increased delay between retries
let isOfflineMode = false;

// Helper function to validate Supabase URL format
function isValidSupabaseUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && 
               (parsed.host.includes('supabase.co') || parsed.host.includes('supabase.in'));
    } catch (e) {
        return false;
    }
}

// Helper function to validate Supabase key format
function isValidSupabaseKey(key) {
    // Supabase anon keys are typically long base64 strings
    return typeof key === 'string' && key.length > 20;
}

// Offline mode fallback functions
const offlineFallback = {
    async from(table) {
        logger.warn('Operating in offline mode - using localStorage fallback');
        return {
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: { message: 'Offline mode - data not saved' } }),
            update: () => ({ data: null, error: { message: 'Offline mode - data not updated' } }),
            delete: () => ({ data: null, error: { message: 'Offline mode - data not deleted' } })
        };
    },
    async rpc() {
        return { data: null, error: { message: 'Offline mode - RPC not available' } };
    }
};

// Initialize Supabase with retry logic
async function initializeSupabase(attempt = 1, maxRetries = 5) {
    const env = window.__env__ || {};
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

    if (isDevelopment) {
        logger.info('Development environment detected - using offline mode');
        isOfflineMode = true;
        return offlineFallback;
    }

    const hasEnv = !!(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL);

    logger.debug('Starting Supabase initialization:', {
        attempt,
        maxRetries,
        hasInstance: !!supabaseInstance,
        env: {
            VALID_ENV: env.VALID_ENV,
            SUPABASE_URL: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? '[KEY EXISTS]' : undefined,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[KEY EXISTS]' : undefined,
            EMAILJS_SERVICE_ID: env.EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID: env.EMAILJS_TEMPLATE_ID,
            EMAILJS_USER_ID: env.EMAILJS_USER_ID,
            SANDBOX_EMAIL: env.SANDBOX_EMAIL
        },
        hasEnv
    });

    if (!hasEnv) {
        logger.info('No Supabase configuration found - using offline mode');
        isOfflineMode = true;
        return offlineFallback;
    }

    if (supabaseInstance) {
        return supabaseInstance;
    }

    const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Validate URL and key
    if (!isValidSupabaseUrl(supabaseUrl)) {
        logger.info('Invalid Supabase URL format - using offline mode');
        isOfflineMode = true;
        return offlineFallback;
    }

    if (!isValidSupabaseKey(supabaseKey)) {
        logger.info('Invalid Supabase key format - using offline mode');
        isOfflineMode = true;
        return offlineFallback;
    }

    logger.debug('Creating Supabase client with URL:', supabaseUrl);

    try {
        // Create client with timeout
        const client = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            realtime: {
                timeout: 20000
            }
        });
        
        // Test connectivity with timeout
        logger.debug('Testing basic connectivity...');
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        
        await Promise.race([
            client.from('assessments').select('count').limit(1),
            timeoutPromise
        ]);
        
        supabaseInstance = client;
        isOfflineMode = false;
        logger.info('Supabase client initialized successfully');
        return client;

    } catch (error) {
        logger.debug('Basic connectivity test failed', {
            error: error.message,
            code: error.code || '',
            details: error.toString(),
            hint: error.hint || ''
        });

        if (attempt < maxRetries && !isDevelopment) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            logger.debug(`Retrying Supabase initialization in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return initializeSupabase(attempt + 1, maxRetries);
        }

        logger.info('Using offline mode after failed connection attempts');
        isOfflineMode = true;
        return offlineFallback;
    }
}

// Database operations with offline fallback
async function createTables() {
    if (isOfflineMode) {
        logger.warn('Failed to create tables:', { message: 'Offline mode - RPC not available' });
        return;
    }

    try {
        const client = await initializeSupabase();
        if (!client) return;

        // Create tables if they don't exist
        await client.rpc('create_tables');
        logger.debug('Tables created successfully');

    } catch (error) {
        logger.error('Failed to create tables:', error);
        isOfflineMode = true;
    }
}

// Save assessment data with offline fallback
async function saveAssessment(data) {
    if (isOfflineMode) {
        // Store in localStorage as fallback
        const key = `assessment_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
        return { id: key, offline: true };
    }

    try {
        const client = await initializeSupabase();
        if (!client) throw new Error('No Supabase client available');

        const { data: result, error } = await client
            .from('assessments')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;

    } catch (error) {
        logger.error('Failed to save assessment:', error);
        // Fallback to localStorage
        const key = `assessment_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
        return { id: key, offline: true };
    }
}

// Get assessment by ID with offline fallback
async function getAssessment(id) {
    if (isOfflineMode) {
        const data = localStorage.getItem(id);
        return data ? JSON.parse(data) : null;
    }

    try {
        const client = await initializeSupabase();
        if (!client) throw new Error('No Supabase client available');

        const { data, error } = await client
            .from('assessments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        logger.error('Failed to get assessment:', error);
        // Try localStorage as fallback
        const data = localStorage.getItem(id);
        return data ? JSON.parse(data) : null;
    }
}

// Add connection status check with detailed diagnostics
function getConnectionStatus() {
    if (isOfflineMode) {
        return {
            status: 'offline_mode',
            error: 'Operating in offline fallback mode',
            timestamp: new Date().toISOString()
        };
    }
    
    if (!supabaseInstance) {
        return {
            status: 'not_initialized',
            error: null,
            timestamp: new Date().toISOString()
        };
    }
    
    return {
        status: 'initialized',
        connectionStatus: supabaseInstance?.connectionStatus,
        hasInstance: true,
        timestamp: new Date().toISOString(),
        environment: window.__env__?.VALID_ENV || 'unknown'
    };
}

// Add health check function
async function checkHealth() {
    if (isOfflineMode) {
        return {
            healthy: false,
            error: 'Operating in offline mode',
            timestamp: new Date().toISOString(),
            mode: 'offline'
        };
    }

    if (!supabaseInstance) {
        return {
            healthy: false,
            error: 'Client not initialized',
            timestamp: new Date().toISOString()
        };
    }

    try {
        const { error } = await Promise.race([
            supabaseInstance
                .from('questions')
                .select('count')
                .limit(1),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), 3000)
            )
        ]);

        return {
            healthy: !error,
            error: error?.message,
            timestamp: new Date().toISOString(),
            details: error ? {
                code: error.code,
                hint: error.hint
            } : null
        };
    } catch (e) {
        return {
            healthy: false,
            error: e.message,
            timestamp: new Date().toISOString(),
            details: {
                stack: e.stack
            }
        };
    }
}

// Helper to get current Supabase Auth user (user_id)
function getCurrentUserId() {
    if (!supabaseInstance) return null;
    const user = supabaseInstance.auth && supabaseInstance.auth.getUser ? supabaseInstance.auth.getUser() : null;
    // getUser() returns a promise in v2, so handle that
    if (user && typeof user.then === 'function') {
        // Async version for callers
        return user.then(res => res.data?.user?.id || null).catch(() => null);
    }
    // For v1 or if already resolved
    return user?.id || null;
}

// Export functions and initialized client
export {
    initializeSupabase,
    getConnectionStatus,
    checkHealth,
    saveAssessment,
    getAssessment,
    createTables,
    getCurrentUserId
};

// Default export for backward compatibility
export default {
    getInstance() {
        return supabaseInstance;
    },
    isInitialized() {
        return !!supabaseInstance;
    }
}; 