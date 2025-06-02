// This file will be generated at build time with the actual environment variables
(function() {
    const ENV_DEFAULTS = {
        VALID_ENV: 'development',
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: '',
        EMAILJS_SERVICE_ID: '',
        EMAILJS_TEMPLATE_ID: '',
        EMAILJS_USER_ID: '',
        SANDBOX_EMAIL: 'test@example.com'
    };

    try {
        // Initialize environment variables with defaults
        window.__env__ = {
            ...ENV_DEFAULTS,
            VALID_ENV: '__VALID_ENV__',
            SUPABASE_URL: '__SUPABASE_URL__',
            SUPABASE_ANON_KEY: '__SUPABASE_ANON_KEY__',
            EMAILJS_SERVICE_ID: '__EMAILJS_SERVICE_ID__',
            EMAILJS_TEMPLATE_ID: '__EMAILJS_TEMPLATE_ID__',
            EMAILJS_USER_ID: '__EMAILJS_USER_ID__',
            SANDBOX_EMAIL: '__SANDBOX_EMAIL__'
        };

        // Function to validate environment variable
        const validateEnvVar = (key, value) => {
            // Check if the value is a placeholder
            if (value === `__${key}__`) {
                // For development environment, use defaults for non-critical vars
                if (window.__env__.VALID_ENV === 'development' && !['SUPABASE_URL', 'SUPABASE_ANON_KEY'].includes(key)) {
                    return ENV_DEFAULTS[key];
                }
                throw new Error(`Environment variable not set: ${key}`);
            }
            return value;
        };

        // Validate and clean environment variables
        const cleanEnv = {
            VALID_ENV: validateEnvVar('VALID_ENV', window.__env__.VALID_ENV) || 'development',
            SUPABASE_URL: validateEnvVar('SUPABASE_URL', window.__env__.SUPABASE_URL),
            SUPABASE_ANON_KEY: validateEnvVar('SUPABASE_ANON_KEY', window.__env__.SUPABASE_ANON_KEY),
            EMAILJS_SERVICE_ID: validateEnvVar('EMAILJS_SERVICE_ID', window.__env__.EMAILJS_SERVICE_ID),
            EMAILJS_TEMPLATE_ID: validateEnvVar('EMAILJS_TEMPLATE_ID', window.__env__.EMAILJS_TEMPLATE_ID),
            EMAILJS_USER_ID: validateEnvVar('EMAILJS_USER_ID', window.__env__.EMAILJS_USER_ID),
            SANDBOX_EMAIL: validateEnvVar('SANDBOX_EMAIL', window.__env__.SANDBOX_EMAIL)
        };

        // Update window.__env__ with validated values
        window.__env__ = cleanEnv;

        // Log initialization status
        const envStatus = {
            env: window.__env__.VALID_ENV,
            hasSupabaseUrl: !!window.__env__.SUPABASE_URL,
            hasSupabaseKey: !!window.__env__.SUPABASE_ANON_KEY,
            timestamp: new Date().toISOString()
        };

        console.log('Environment variables loaded:', envStatus);

        // Add environment status to window for debugging
        window.__env_status__ = envStatus;
    } catch (error) {
        console.error('Failed to initialize environment variables:', error);
        
        // Set detailed error information
        window.__env_error__ = {
            message: error.message,
            timestamp: new Date().toISOString(),
            details: {
                hasSupabaseUrl: !!window.__env__?.SUPABASE_URL,
                hasSupabaseKey: !!window.__env__?.SUPABASE_ANON_KEY,
                env: window.__env__?.VALID_ENV || 'unknown'
            },
            error: error.stack
        };

        // In development, provide more context
        if (window.__env__?.VALID_ENV === 'development') {
            console.warn('Development environment detected. Using fallback values where possible.');
            window.__env__ = {
                ...ENV_DEFAULTS,
                VALID_ENV: 'development'
            };
        } else {
            // In production, clear sensitive data
            window.__env__ = null;
        }
    }

    // Export environment check function
    window.checkEnvironment = function() {
        return {
            isInitialized: !!window.__env__,
            hasError: !!window.__env_error__,
            error: window.__env_error__,
            status: window.__env_status__,
            environment: window.__env__?.VALID_ENV,
            hasSupabaseConfig: !!(window.__env__?.SUPABASE_URL && window.__env__?.SUPABASE_ANON_KEY)
        };
    };
})(); 