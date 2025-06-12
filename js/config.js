/**
 * VALID Assessment Tool - Configuration Module
 * Purpose: Central configuration management for the VALID assessment system.
 * 
 * This module handles:
 * - Environment settings
 * - API endpoints
 * - Assessment parameters
 * - System-wide constants
 * - Feature flags
 */

// VALID Assessment Tool - Configuration Module
// Secure configuration management with environment variable support

const ENV = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

// Environment detection with more robust checks
const isDevelopment = () => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('.local') ||
           hostname.includes('.test');
};

const isStaging = () => {
    const hostname = window.location.hostname;
    return hostname.includes('-staging.') || 
           hostname.includes('.staging.') ||
           window.__env__?.VALID_ENV === ENV.STAGING;
};

const isProduction = () => {
    return !isDevelopment() && !isStaging();
};

// Get environment with fallback chain
const CURRENT_ENV = window.__env__?.VALID_ENV || 
    (isProduction() ? ENV.PRODUCTION : 
     isStaging() ? ENV.STAGING : 
     ENV.DEVELOPMENT);

// Required environment variables per environment
const REQUIRED_ENV_VARS = {
    [ENV.DEVELOPMENT]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    [ENV.STAGING]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_USER_ID'],
    [ENV.PRODUCTION]: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_USER_ID']
};

// Validate environment variables
const validateEnvVars = (env) => {
    const required = REQUIRED_ENV_VARS[env];
    const missing = required.filter(key => !window.__env__?.[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables for ${env}: ${missing.join(', ')}`);
    }
};

// Try to validate environment variables
try {
    validateEnvVars(CURRENT_ENV);
} catch (error) {
    console.error('Environment validation failed:', error);
    // Don't throw here, let the application handle it
}

// EmailJS configuration
const EMAILJS_SERVICE_ID = window.__env__?.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = window.__env__?.EMAILJS_TEMPLATE_ID;
const EMAILJS_USER_ID = window.__env__?.EMAILJS_USER_ID;

// Assessment configuration
const maxQuestionsPerSection = 10;
const timeoutDuration = 1800; // 30 minutes in seconds

// Feature flags with environment-specific defaults
const features = {
    enableAnalytics: CURRENT_ENV !== ENV.DEVELOPMENT,
    enablePDFExport: true,
    enableEmailNotifications: CURRENT_ENV !== ENV.DEVELOPMENT,
    enableDebugPanel: true,
    enableOfflineMode: true,
    enableAutoSave: true
};

// API configuration
const apiConfig = {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

// Configuration object with environment-specific values
const config = {
    env: CURRENT_ENV,
    isDev: CURRENT_ENV === ENV.DEVELOPMENT,
    isStaging: CURRENT_ENV === ENV.STAGING,
    isProd: CURRENT_ENV === ENV.PRODUCTION,
    supabase: {
        url: window.__env__?.SUPABASE_URL,
        anonKey: window.__env__?.SUPABASE_ANON_KEY
    },
    email: {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID,
        userId: EMAILJS_USER_ID,
        sandboxEmail: window.__env__?.SANDBOX_EMAIL || 'test@example.com'
    },
    maxQuestionsPerSection,
    timeoutDuration,
    features,
    api: apiConfig,
    debugMode: CURRENT_ENV === ENV.DEVELOPMENT,
    logLevel: CURRENT_ENV === ENV.DEVELOPMENT ? 'debug' : 'error'
};

// Log initialization status
console.log('Configuration initialized:', {
    env: config.env,
    hasUrl: !!config.supabase.url,
    hasKey: !!config.supabase.anonKey,
    features: Object.keys(config.features).reduce((acc, key) => ({
        ...acc,
        [key]: config.features[key]
    }), {})
});

// Export configuration
export const SUPABASE_URL = config.supabase.url;
export const SUPABASE_ANON_KEY = config.supabase.anonKey;
export { ENV };
export default config; 