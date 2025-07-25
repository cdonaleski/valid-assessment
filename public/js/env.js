/**
 * VALID Assessment Tool - Environment Configuration
 * Centralizes all environment-related configuration and initialization
 */

import { developmentConfig } from './env.development.js';

// Environment types
const ENV_TYPES = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

// Environment detection
const detectEnvironment = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local')) {
        return ENV_TYPES.DEVELOPMENT;
    }
    if (hostname.includes('staging') || hostname.includes('test')) {
        return ENV_TYPES.STAGING;
    }
    return ENV_TYPES.PRODUCTION;
};

// Default configuration
const DEFAULT_CONFIG = {
    VALID_ENV: detectEnvironment(),
    DEBUG: true,
    LOG_LEVEL: 'debug',
    SANDBOX_EMAIL: 'test@example.com'
};

// Required environment variables per environment
const REQUIRED_ENV_VARS = {
    [ENV_TYPES.DEVELOPMENT]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    [ENV_TYPES.STAGING]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_USER_ID'],
    [ENV_TYPES.PRODUCTION]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_USER_ID']
};

// Initialize environment
const initializeEnvironment = () => {
    try {
        const env = detectEnvironment();
        
        // Use development config in development, otherwise use window.__env__
        const envVars = env === ENV_TYPES.DEVELOPMENT 
            ? developmentConfig 
            : (window.__env__ || {});
        
        // Merge with defaults
        window.__env__ = {
            ...DEFAULT_CONFIG,
            ...envVars
        };

        // Validate required variables
        const required = REQUIRED_ENV_VARS[env];
        const missing = required.filter(key => !window.__env__[key]);
        
        if (missing.length > 0) {
            console.warn(`Missing required environment variables for ${env}:`, missing);
            window.__env_status__ = {
                isInitialized: true,
                hasError: true,
                error: `Missing required variables: ${missing.join(', ')}`,
                environment: env
            };
        } else {
            window.__env_status__ = {
                isInitialized: true,
                hasError: false,
                environment: env
            };
        }

        // Log initialization status
        console.log('Environment initialized:', {
            environment: env,
            debug: window.__env__.DEBUG,
            hasSupabaseConfig: !!(window.__env__.SUPABASE_URL && window.__env__.SUPABASE_ANON_KEY)
        });

    } catch (error) {
        console.error('Failed to initialize environment:', error);
        window.__env_status__ = {
            isInitialized: false,
            hasError: true,
            error: error.message,
            environment: 'unknown'
        };
    }
};

// Environment status check
const checkEnvironment = () => {
    return window.__env_status__ || {
        isInitialized: false,
        hasError: true,
        error: 'Environment not initialized',
        environment: 'unknown'
    };
};

// Initialize on load
initializeEnvironment();

// Exports
export const ENV = ENV_TYPES;
export { checkEnvironment };
export default window.__env__ || DEFAULT_CONFIG; 