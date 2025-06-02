/**
 * VALID Assessment Tool - Database Interface Module
 * Purpose: Manages all database operations and data persistence.
 * 
 * This module handles:
 * - User data storage and retrieval
 * - Assessment results persistence
 * - Data encryption and security
 * - Database connections and transactions
 * - Backup and recovery operations
 */

import { logger } from './logger.js';
import supabaseClient from './supabase-client.js';

// Local storage keys
const STORAGE_KEYS = {
    ASSESSMENTS: 'valid_assessments',
    CURRENT_ASSESSMENT: 'valid_current_assessment',
    OFFLINE_QUEUE: 'valid_offline_queue'
};

// Initialize Supabase client with better error handling
let supabase = null;
let isOnline = false;
let offlineQueue = [];
let initializationInProgress = false;
let initializationPromise = null;

// Load offline queue from storage
try {
    offlineQueue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
} catch (error) {
    logger.warn('Failed to load offline queue:', error);
    offlineQueue = [];
}

async function initializeDatabase() {
    // Return existing initialization promise if already in progress
    if (initializationPromise) {
        return initializationPromise;
    }

    // Create new initialization promise
    initializationPromise = (async () => {
        if (initializationInProgress) {
            logger.warn('Database initialization already in progress');
            return false;
        }

        initializationInProgress = true;
        
        try {
            logger.debug('Starting database initialization');
            
            // Initialize Supabase with retries
            let retryCount = 3;
            let lastError = null;
            
            while (retryCount > 0) {
                try {
                    logger.debug(`Attempting Supabase initialization (${retryCount} retries left)`);
                    
                    // Wait for Supabase client initialization
                    supabase = await supabaseClient.initialize();
                    
                    if (!supabase) {
                        throw new Error('Supabase client initialization returned null');
                    }
                    
                    // Test connection
                    const { data, error } = await supabase
                        .from('questions')
                        .select('count')
                        .limit(1)
                        .maybeSingle();
                        
                    if (error) {
                        throw error;
                    }
                    
                    isOnline = true;
                    logger.info('Database initialization successful');
                    
                    // Process offline queue if we're online
                    if (offlineQueue.length > 0) {
                        logger.info(`Processing ${offlineQueue.length} offline operations`);
                        await processOfflineQueue();
                    }
                    
                    return true;
                } catch (error) {
                    lastError = error;
                    logger.warn(`Initialization attempt failed (${retryCount} retries left):`, {
                        error: error.message,
                        stack: error.stack
                    });
                    retryCount--;
                    
                    if (retryCount > 0) {
                        const delay = Math.min(1000 * Math.pow(2, 3 - retryCount), 5000);
                        logger.debug(`Waiting ${delay}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            throw lastError || new Error('Failed to initialize database after all retries');
        } catch (error) {
            logger.error('Database initialization failed:', {
                error: error.message,
                stack: error.stack,
                isOnline,
                hasSupabase: !!supabase,
                queueLength: offlineQueue.length
            });
            
            // Clear supabase client
            supabase = null;
            isOnline = false;
            
            throw error;
        } finally {
            initializationInProgress = false;
            initializationPromise = null;
        }
    })();

    return initializationPromise;
}

// Initialize database connection with retries
let retryCount = 3;
let retryDelay = 1000; // 1 second

async function initializeDatabaseWithRetry() {
    try {
        logger.debug('Attempting database initialization');
        const result = await initializeDatabase();
        return result;
    } catch (error) {
        if (retryCount > 0) {
            retryCount--;
            logger.warn(`Database initialization failed, retrying... (${retryCount} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            // Increase delay for next retry
            retryDelay *= 2;
            return initializeDatabaseWithRetry();
        }
        logger.error('All database initialization attempts failed:', error);
        // Continue in offline mode
        isOnline = false;
        supabase = null;
        return false;
    }
}

// Process offline queue
async function processOfflineQueue() {
    if (!isOnline || !supabase || offlineQueue.length === 0) return;

    logger.info(`Processing offline queue: ${offlineQueue.length} items`);
    
    const failedOperations = [];
    
    for (const operation of offlineQueue) {
        try {
            switch (operation.type) {
                case 'create':
                    await supabase.from(operation.table).insert(operation.data);
                    break;
                case 'update':
                    await supabase.from(operation.table)
                        .update(operation.data)
                        .match(operation.conditions);
                    break;
                default:
                    logger.warn('Unknown operation type:', operation.type);
            }
        } catch (error) {
            logger.error('Failed to process offline operation:', {
                operation,
                error: error.message
            });
            failedOperations.push(operation);
        }
    }

    // Update offline queue with failed operations
    offlineQueue = failedOperations;
    try {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
    } catch (error) {
        logger.error('Failed to update offline queue:', error);
    }
}

// Add operation to offline queue
function addToOfflineQueue(operation) {
    offlineQueue.push(operation);
    try {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
    } catch (error) {
        logger.error('Failed to save to offline queue:', error);
    }
}

/**
 * Clear any existing questions from the database
 */
async function clearDatabaseQuestions() {
    try {
        if (supabase) {
            await supabase.from('questions').delete().neq('id', '');
            logger.info('Cleared questions from database');
        }
    } catch (error) {
        logger.warn('Failed to clear database questions:', error);
    }
}

/**
 * Local storage fallback for offline/development use
 */
class LocalStorageDB {
    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            logger.error('LocalStorage read error:', error);
            return null;
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('LocalStorage write error:', error);
            return false;
        }
    }

    static generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Error handler for database operations
 * @param {Error} error - The error object
 * @param {string} operation - The name of the operation that failed
 * @throws {Error} Enhanced error with operation context
 */
const handleDatabaseError = (error, operation) => {
    console.error(`Database Error during ${operation}:`, error);
    const errorMessage = error.message || 'Unknown error occurred';
    const details = error.details ? `: ${error.details}` : '';
    throw new Error(`Failed to ${operation}${details}. ${errorMessage}`);
};

/**
 * Validates assessment data before saving
 * @param {Object} data - The data to validate
 * @throws {Error} If validation fails
 */
const validateAssessmentData = (data) => {
    if (!data.email || !data.email.includes('@')) {
        throw new Error('Invalid email address');
    }
    if (!data.department) {
        throw new Error('Department is required');
    }
    if (!data.role) {
        throw new Error('Role is required');
    }
    if (!data.experience) {
        throw new Error('Experience is required');
    }
};

/**
 * Creates a new assessment in the database or local storage
 * @param {Object} data Assessment data
 * @returns {Promise<Object>} Created assessment
 */
async function createNewAssessment(data) {
    logger.debug('Creating new assessment with data:', data);
    
    try {
        validateAssessmentData(data);

        const assessmentData = {
            id: LocalStorageDB.generateId(),
            email: data.email,
            demographics: {
                department: data.department,
                role: data.role,
                experience: data.experience
            },
            status: 'started',
            current_question: 0,
            answers: {},
            created_at: new Date().toISOString()
        };

        // Try Supabase first
        if (isOnline && supabase) {
            try {
                const { data: assessment, error } = await supabase
                    .from('assessments')
                    .insert(assessmentData)
                    .select()
                    .single();

                if (error) throw error;
                if (assessment) {
                    logger.info('Assessment created in Supabase:', assessment.id);
                    return assessment;
                }
            } catch (error) {
                logger.warn('Supabase storage failed, adding to offline queue:', error);
                addToOfflineQueue({
                    type: 'create',
                    table: 'assessments',
                    data: assessmentData
                });
            }
        } else {
            // Add to offline queue for later sync
            addToOfflineQueue({
                type: 'create',
                table: 'assessments',
                data: assessmentData
            });
        }

        // Store in local storage
        const assessments = LocalStorageDB.getItem(STORAGE_KEYS.ASSESSMENTS) || [];
        assessments.push(assessmentData);
        LocalStorageDB.setItem(STORAGE_KEYS.ASSESSMENTS, assessments);
        LocalStorageDB.setItem(STORAGE_KEYS.CURRENT_ASSESSMENT, assessmentData);
        
        logger.info('Assessment created in local storage:', assessmentData.id);
        return assessmentData;
    } catch (error) {
        logger.error('Failed to create assessment:', error);
        throw error;
    }
}

/**
 * Saves final assessment results
 * @param {string} session_id - The assessment session ID
 * @param {Object} scores - Assessment scores
 * @param {Object} completion_data - Completion metadata
 * @returns {Promise<void>}
 */
export const saveResults = async (session_id, scores, completion_data) => {
    try {
        const { error } = await supabase
            .from('assessments')
            .update({
                verity_score: scores.verity,
                association_score: scores.association,
                lived_score: scores.lived,
                institutional_score: scores.institutional,
                desire_score: scores.desire,
                completed_at: new Date().toISOString(),
                duration_minutes: completion_data.duration_minutes,
                status: 'completed'
            })
            .eq('session_id', session_id);

        if (error) throw error;
    } catch (error) {
        handleDatabaseError(error, 'save results');
    }
};

/**
 * Retrieves assessment data by session ID
 * @param {string} session_id - The assessment session ID
 * @returns {Promise<Object>} The assessment data
 */
export const getAssessment = async (session_id) => {
    try {
        const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('session_id', session_id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleDatabaseError(error, 'get assessment');
    }
};

/**
 * Retrieves all completed assessments for admin dashboard
 * @returns {Promise<Array>} Array of completed assessments
 */
export const getAllCompletedAssessments = async () => {
    try {
        const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        handleDatabaseError(error, 'get all completed assessments');
    }
};

/**
 * Validates if a session exists and is active
 * @param {string} session_id - The assessment session ID
 * @returns {Promise<boolean>} Whether the session is valid
 */
export const validateSession = async (session_id) => {
    try {
        const { data, error } = await supabase
            .from('assessments')
            .select('status')
            .eq('session_id', session_id)
            .single();

        if (error) throw error;
        return data && data.status !== 'completed';
    } catch (error) {
        handleDatabaseError(error, 'validate session');
    }
};

// Initialize database connection
await initializeDatabaseWithRetry().catch(error => {
    logger.error('All database initialization attempts failed:', error);
    // Continue with offline mode
    isOnline = false;
    supabase = null;
});

// Export functions and initialized client
export {
    supabase,
    createNewAssessment,
    saveResults,
    getAssessment,
    validateSession,
    isOnline,
    processOfflineQueue
}; 