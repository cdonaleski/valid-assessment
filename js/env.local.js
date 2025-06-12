// Local Environment Configuration
(function() {
    const ENV_DEFAULTS = {
        VALID_ENV: 'development',
        SUPABASE_URL: '',  // Will be loaded from process.env
        SUPABASE_ANON_KEY: '',  // Will be loaded from process.env
        EMAILJS_SERVICE_ID: 'test_service',
        EMAILJS_TEMPLATE_ID: 'test_template',
        EMAILJS_USER_ID: 'test_user',
        SANDBOX_EMAIL: 'test@example.com'
    };

    try {
        // Initialize environment variables with defaults
        window.__env__ = {
            ...ENV_DEFAULTS
        };

        // Log initialization
        console.log('Local environment initialized:', {
            env: window.__env__.VALID_ENV,
            hasSupabaseUrl: !!window.__env__.SUPABASE_URL,
            hasSupabaseKey: !!window.__env__.SUPABASE_ANON_KEY
        });

    } catch (error) {
        console.error('Failed to initialize local environment:', error);
        window.__env_error__ = {
            message: error.message,
            timestamp: new Date().toISOString(),
            error: error.stack
        };
    }

    // Export environment check function
    window.checkEnvironment = function() {
        return {
            isInitialized: !!window.__env__,
            hasError: !!window.__env_error__,
            error: window.__env_error__,
            environment: window.__env__?.VALID_ENV,
            hasSupabaseConfig: !!(window.__env__?.SUPABASE_URL && window.__env__?.SUPABASE_ANON_KEY)
        };
    };
})(); 