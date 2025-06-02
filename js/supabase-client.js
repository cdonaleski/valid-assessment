import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';
import config from './config.js';

let supabaseClient = null;
let isInitialized = false;
let initializationPromise = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

async function testConnection(client) {
    try {
        const { data, error } = await client.from('questions')
            .select('count')
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        logger.error('Connection test failed:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

export async function initializeSupabase() {
    // Return existing initialization promise if already in progress
    if (initializationPromise) {
        return initializationPromise;
    }

    // Create new initialization promise
    initializationPromise = (async () => {
        try {
            logger.debug('Starting Supabase initialization');

            // Check if already initialized
            if (isInitialized && supabaseClient) {
                logger.debug('Supabase already initialized');
                return supabaseClient;
            }

            // Check environment variables
            if (!window.__env__) {
                throw new Error('Environment variables not loaded');
            }

            // Get and validate Supabase configuration
            const { url, anonKey } = config.supabase;
            if (!url || !anonKey) {
                throw new Error(`Invalid Supabase configuration: url=${!!url}, anonKey=${!!anonKey}`);
            }

            // Initialize with retries
            while (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
                try {
                    logger.debug(`Creating Supabase client (attempt ${initializationAttempts + 1}/${MAX_INITIALIZATION_ATTEMPTS})`);
                    
                    // Create client
                    supabaseClient = createClient(url, anonKey, {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true
                        }
                    });
                    
                    // Test connection
                    await testConnection(supabaseClient);
                    
                    // Success
                    isInitialized = true;
                    logger.info('Supabase client initialized successfully');
                    return supabaseClient;
                } catch (error) {
                    initializationAttempts++;
                    logger.warn(`Initialization attempt ${initializationAttempts} failed:`, {
                        error: error.message,
                        stack: error.stack,
                        remainingAttempts: MAX_INITIALIZATION_ATTEMPTS - initializationAttempts
                    });

                    if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
                        const delay = Math.min(1000 * Math.pow(2, initializationAttempts), 5000);
                        logger.debug(`Waiting ${delay}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw error;
                    }
                }
            }

            throw new Error(`Failed to initialize Supabase client after ${MAX_INITIALIZATION_ATTEMPTS} attempts`);
        } catch (error) {
            logger.error('Supabase initialization failed:', {
                error: error.message,
                stack: error.stack,
                attempts: initializationAttempts,
                config: {
                    hasUrl: !!config.supabase?.url,
                    hasKey: !!config.supabase?.anonKey,
                    env: config.env,
                    isInitialized
                }
            });
            
            // Clear initialization state on error
            supabaseClient = null;
            isInitialized = false;
            initializationPromise = null;
            
            throw error;
        }
    })();

    return initializationPromise;
}

export function getSupabaseClient() {
    if (!isInitialized || !supabaseClient) {
        throw new Error('Supabase client not initialized');
    }
    return supabaseClient;
}

export function isSupabaseInitialized() {
    return isInitialized && !!supabaseClient;
}

export default {
    initialize: initializeSupabase,
    getClient: getSupabaseClient,
    isInitialized: isSupabaseInitialized
}; 