// Supabase Connection Test
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';
import { logger } from './logger.js';

window.testSupabaseConnection = async function() {
    logger.info('Starting Supabase connection test');
    try {
        // Check environment
        const envCheck = window.checkEnvironment();
        logger.info('Environment check', envCheck);

        if (!envCheck.hasSupabaseConfig) {
            logger.error('Missing Supabase configuration', envCheck);
            throw new Error('Missing Supabase configuration');
        }

        // Create client
        logger.info('Creating Supabase client...', {
            urlPrefix: window.__env__.SUPABASE_URL?.substring(0, 10) + '...',
            hasKey: !!window.__env__.SUPABASE_ANON_KEY,
            env: window.__env__.VALID_ENV
        });

        const supabase = createClient(
            window.__env__.SUPABASE_URL,
            window.__env__.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                }
            }
        );

        // Test basic connection first
        logger.info('Testing basic connection...');
        const { data: versionData, error: versionError } = await supabase
            .rpc('version')
            .select();
        
        if (versionError) {
            logger.warn('Basic connection test failed', {
                error: versionError.message,
                code: versionError.code,
                details: versionError.details,
                hint: versionError.hint
            });
        } else {
            logger.info('Basic connection successful', { version: versionData });
        }

        // Now test table access
        logger.info('Testing questions table access...');
        const { data, error } = await supabase
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
        
        logger.info('Connection test successful', { data });
        return { 
            success: true, 
            data,
            logs: logger.getLogs()
        };
    } catch (error) {
        logger.error('Connection test failed', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            stack: error.stack,
            env: {
                validEnv: window.__env__?.VALID_ENV,
                urlPrefix: window.__env__?.SUPABASE_URL?.substring(0, 10) + '...',
                hasKey: !!window.__env__?.SUPABASE_ANON_KEY
            }
        });
        return { 
            success: false, 
            error: error.message,
            details: {
                env: window.__env__?.VALID_ENV,
                urlPrefix: window.__env__?.SUPABASE_URL?.substring(0, 10) + '...',
                hasKey: !!window.__env__?.SUPABASE_ANON_KEY
            },
            logs: logger.getLogs()
        };
    }
}; 