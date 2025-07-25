/**
 * Configuration Manager - Hybrid Environment + Supabase Configuration
 * 
 * Security-first approach:
 * - Sensitive data (API keys) from environment variables ONLY
 * - Non-sensitive, dynamic config from Supabase
 * - Automatic caching and fallback to defaults
 */

class ConfigManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.configCache = new Map();
        this.cacheExpiry = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.isLoaded = false;
        
        // Default configuration (fallback values)
        this.defaults = {
            // Email Configuration
            email_from_name: 'VALID Assessment Team',
            email_subject_template: 'Your VALID Assessment Results - {firstName}',
            email_enabled: true,
            
            // Assessment Configuration
            assessment_title: 'VALID Assessment',
            results_show_scores: true,
            results_show_recommendations: true,
            allow_retake: true,
            
            // UI Configuration
            brand_primary_color: '#667eea',
            brand_secondary_color: '#764ba2',
            show_progress_bar: true,
            auto_advance_questions: true,
            
            // Content Configuration
            welcome_message: 'Ready to Begin?',
            completion_message: 'Thank you for completing the VALID assessment!',
            privacy_policy_url: '',
            terms_of_service_url: '',
            
            // Analytics Configuration
            track_session_analytics: true,
            track_time_per_question: true,
            
            // Integration Configuration
            webhook_timeout_seconds: 30,
            max_webhook_retries: 3
        };
    }

    /**
     * Initialize configuration - load from Supabase
     */
    async init() {
        try {
            if (this.supabase && this.supabase.isConnected) {
                await this.loadFromSupabase();
            } else {
                console.log('📊 Using default configuration (Supabase not connected)');
            }
            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load configuration from Supabase:', error);
            console.log('📊 Falling back to default configuration');
            this.isLoaded = true;
        }
    }

    /**
     * Load configuration from Supabase
     */
    async loadFromSupabase() {
        try {
            const { data, error } = await this.supabase.client
                .from('config_view')
                .select('config_key, config_value');

            if (error) {
                console.warn('Failed to load config from Supabase:', error);
                return;
            }

            // Update cache with Supabase values
            data.forEach(item => {
                const value = this.parseConfigValue(item.config_value);
                this.setCache(item.config_key, value);
            });

            console.log(`📊 Loaded ${data.length} configuration items from Supabase`);
        } catch (error) {
            console.error('Error loading Supabase configuration:', error);
        }
    }

    /**
     * Parse JSONB config value from Supabase
     */
    parseConfigValue(jsonValue) {
        try {
            // The value is stored as JSONB, so it might be a string, number, boolean, etc.
            return jsonValue;
        } catch (error) {
            console.warn('Failed to parse config value:', jsonValue);
            return jsonValue;
        }
    }

    /**
     * Set cache value with expiry
     */
    setCache(key, value) {
        this.configCache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.cacheTimeout);
    }

    /**
     * Check if cache value is expired
     */
    isCacheExpired(key) {
        const expiry = this.cacheExpiry.get(key);
        return !expiry || Date.now() > expiry;
    }

    /**
     * Get configuration value with fallback hierarchy:
     * 1. Environment variable (for sensitive data)
     * 2. Supabase cache (for dynamic config)
     * 3. Default value
     */
    async get(key, defaultValue = null) {
        // 1. Check environment variables first (security priority)
        const envValue = this.getFromEnvironment(key);
        if (envValue !== null) {
            return envValue;
        }

        // 2. Check cache
        if (this.configCache.has(key) && !this.isCacheExpired(key)) {
            return this.configCache.get(key);
        }

        // 3. Try to refresh from Supabase if cache expired
        if (this.supabase && this.supabase.isConnected) {
            try {
                const { data, error } = await this.supabase.client
                    .from('config_view')
                    .select('config_value')
                    .eq('config_key', key)
                    .single();

                if (!error && data) {
                    const value = this.parseConfigValue(data.config_value);
                    this.setCache(key, value);
                    return value;
                }
            } catch (error) {
                console.warn(`Failed to refresh config key ${key}:`, error);
            }
        }

        // 4. Fall back to default
        return defaultValue || this.defaults[key] || null;
    }

    /**
     * Get value from environment variables
     * Maps config keys to environment variable names
     */
    getFromEnvironment(key) {
        const envMap = {
            // Sensitive configuration (ALWAYS from environment)
            mailersend_api_key: process.env.MAILERSEND_API_KEY,
            supabase_url: process.env.SUPABASE_URL,
            supabase_anon_key: process.env.SUPABASE_ANON_KEY,
            
            // Non-sensitive config (can be overridden by environment)
            from_email: process.env.FROM_EMAIL,
            from_name: process.env.FROM_NAME,
            webhook_base_url: process.env.WEBHOOK_BASE_URL,
            
            // Server configuration
            port: process.env.PORT,
            node_env: process.env.NODE_ENV
        };

        return envMap[key] || null;
    }

    /**
     * Get multiple configuration values at once
     */
    async getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    /**
     * Get all configuration for a category
     */
    async getCategory(category) {
        const result = {};
        const categoryKeys = Object.keys(this.defaults).filter(key => 
            key.startsWith(category + '_')
        );
        
        for (const key of categoryKeys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    /**
     * Check if email functionality is properly configured
     */
    async isEmailConfigured() {
        const apiKey = await this.get('mailersend_api_key');
        const fromEmail = await this.get('from_email');
        const emailEnabled = await this.get('email_enabled');
        
        return !!(apiKey && fromEmail && emailEnabled);
    }

    /**
     * Get email configuration
     */
    async getEmailConfig() {
        return {
            apiKey: await this.get('mailersend_api_key'),
            fromEmail: await this.get('from_email'),
            fromName: await this.get('email_from_name'),
            subjectTemplate: await this.get('email_subject_template'),
            enabled: await this.get('email_enabled')
        };
    }

    /**
     * Get UI theme configuration
     */
    async getThemeConfig() {
        return {
            primaryColor: await this.get('brand_primary_color'),
            secondaryColor: await this.get('brand_secondary_color'),
            showProgressBar: await this.get('show_progress_bar'),
            autoAdvanceQuestions: await this.get('auto_advance_questions')
        };
    }

    /**
     * Refresh configuration from Supabase
     */
    async refresh() {
        this.configCache.clear();
        this.cacheExpiry.clear();
        await this.loadFromSupabase();
    }

    /**
     * Template string replacement helper
     */
    interpolateTemplate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    /**
     * Get interpolated email subject
     */
    async getEmailSubject(variables = {}) {
        const template = await this.get('email_subject_template');
        return this.interpolateTemplate(template, variables);
    }

    /**
     * Development helper: log current configuration
     */
    async debugConfig() {
        if (process.env.NODE_ENV !== 'development') return;
        
        console.log('🔧 Current Configuration:');
        console.log('========================');
        
        const categories = ['email', 'assessment', 'ui', 'content', 'analytics', 'integration'];
        
        for (const category of categories) {
            console.log(`\n📋 ${category.toUpperCase()}:`);
            const config = await this.getCategory(category);
            Object.entries(config).forEach(([key, value]) => {
                const displayValue = key.includes('api_key') ? '[HIDDEN]' : value;
                console.log(`  ${key}: ${displayValue}`);
            });
        }
        
        console.log('\n========================');
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else {
    window.ConfigManager = ConfigManager;
} 