// Development Environment Configuration
(function() {
    // Initialize environment variables
    window.__env__ = {
        VALID_ENV: 'development',
        SUPABASE_URL: 'https://txqtbblkrqmydkjztaip.supabase.co',  // Supabase project URL
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cXRiYmxrcnFteWRranp0YWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDE4OTIsImV4cCI6MjA2NDI3Nzg5Mn0.OAzay39eq3ZhVmkZYlbpNhkGANu1SOTsA7GekzM9OnM',  // Supabase anon key
        EMAILJS_SERVICE_ID: '',
        EMAILJS_TEMPLATE_ID: '',
        EMAILJS_USER_ID: '',
        SANDBOX_EMAIL: 'test@example.com'
    };

    // Log initialization status without exposing sensitive data
    const envStatus = {
        env: window.__env__.VALID_ENV,
        hasSupabaseUrl: !!window.__env__.SUPABASE_URL,
        hasSupabaseKey: !!window.__env__.SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
    };

    console.log('Development environment initialized:', envStatus);

    // Add environment check function
    window.checkEnvironment = function() {
        return {
            isInitialized: !!window.__env__,
            hasError: false,
            environment: window.__env__.VALID_ENV,
            hasSupabaseConfig: !!(window.__env__.SUPABASE_URL && window.__env__.SUPABASE_ANON_KEY)
        };
    };
})(); 