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
    OFFLINE_QUEUE: 'valid_offline_queue',
    LAST_SYNC: 'valid_last_sync'
};

// Database state
let supabase = null;
let isOnline = false;
let offlineQueue = [];
let initializationInProgress = false;
let initializationPromise = null;
let lastSyncTime = null;

// Load offline data
try {
    offlineQueue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
} catch (error) {
    logger.warn('Failed to load offline data:', error);
    offlineQueue = [];
    lastSyncTime = null;
}

/**
 * Initialize database connection with retries
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<boolean>} - True if initialization successful
 */
async function initializeDatabase(maxRetries = 3, retryDelay = 1000) {
    if (initializationInProgress) {
        return initializationPromise;
    }

    initializationInProgress = true;
    initializationPromise = (async () => {
        let retryCount = maxRetries;
        let lastError = null;
        
        while (retryCount > 0) {
            try {
                // Check environment
                if (!window.__env__?.SUPABASE_URL || !window.__env__?.SUPABASE_ANON_KEY) {
                    throw new Error('Missing Supabase configuration');
                }

                // Initialize client
                supabase = await supabaseClient.initialize();
                if (!supabase) {
                    throw new Error('Failed to initialize Supabase client');
                }
                
                // Test connection by checking if assessments table exists
                const { data, error } = await supabase
                    .from('assessments')
                    .select('count')
                    .limit(1);

                if (error && error.code === '42P01') {
                    // Table doesn't exist, create it
                    await supabase.rpc('create_tables_if_not_exist');
                    // Try the test query again
                    const retryResult = await supabase
                        .from('assessments')
                        .select('count')
                        .limit(1);
                    if (retryResult.error) throw retryResult.error;
                } else if (error) {
                    throw error;
                }

                isOnline = true;
                logger.info('Database connection established');

                // Process offline queue if any
                if (offlineQueue.length > 0) {
                    await processOfflineQueue();
                }

                return true;
            } catch (error) {
                retryCount--;
                lastError = error;
                logger.warn(`Database initialization attempt failed (${retryCount} retries left):`, error);

                if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2; // Exponential backoff
                }
            }
        }

        logger.error('Database initialization failed, falling back to offline mode:', lastError);
        isOnline = false;
        supabase = null;
        return false;
    })();

    try {
        return await initializationPromise;
    } finally {
        initializationInProgress = false;
        initializationPromise = null;
    }
}

/**
 * Process queued offline operations
 * @returns {Promise<void>}
 */
async function processOfflineQueue() {
    if (!isOnline || offlineQueue.length === 0) return;

    logger.info(`Processing ${offlineQueue.length} offline operations`);

    const failedOperations = [];
    
    for (const operation of offlineQueue) {
        try {
            const { type, data } = operation;
            
            switch (type) {
                case 'saveAssessment':
                    await saveAssessmentToDatabase(data);
                    break;
                // Add other operation types as needed
            }
        } catch (error) {
            logger.error('Failed to process offline operation:', error);
            failedOperations.push(operation);
        }
    }

    // Update offline queue with failed operations
    offlineQueue = failedOperations;
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
    
    if (failedOperations.length === 0) {
        logger.info('All offline operations processed successfully');
    } else {
        logger.warn(`${failedOperations.length} operations failed to process`);
    }
}

/**
 * Save assessment data with offline support
 * @param {Object} data - Assessment data to save
 * @returns {Promise<void>}
 */
async function saveAssessment(data) {
    try {
        validateAssessmentData(data);
        
        if (isOnline) {
            await saveAssessmentToDatabase(data);
        } else {
            // Queue for later and save locally
            offlineQueue.push({
                type: 'saveAssessment',
                data,
                timestamp: Date.now()
            });
            localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
            
            // Save to local storage
            const localAssessments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSESSMENTS) || '[]');
            localAssessments.push({
                ...data,
                id: `local_${Date.now()}`,
                synced: false
            });
            localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(localAssessments));
        }
        
        logger.info('Assessment saved', { online: isOnline });
    } catch (error) {
        logger.error('Failed to save assessment:', error);
        throw error;
    }
}

/**
 * Save assessment data to database
 * @param {Object} data - Assessment data to save
 * @returns {Promise<void>}
 */
async function saveAssessmentToDatabase(data) {
    if (!isOnline) throw new Error('Database is offline');

    const { error } = await supabase
        .from('assessments')
        .insert([data]);

    if (error) throw error;
    
    // Update last sync time
    lastSyncTime = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, lastSyncTime);
}

/**
 * Validate assessment data
 * @param {Object} data - Assessment data to validate
 * @throws {Error} If validation fails
 */
function validateAssessmentData(data) {
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
}

/**
 * Get database status
 * @returns {Object} Database status information
 */
function getDatabaseStatus() {
    return {
        isOnline,
        offlineQueueSize: offlineQueue.length,
        lastSync: lastSyncTime,
        initialized: !!supabase
    };
}

// Export functions
export {
    initializeDatabase,
    saveAssessment,
    getDatabaseStatus
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
const validateSession = async (session_id) => {
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
await initializeDatabase().catch(error => {
    logger.error('All database initialization attempts failed:', error);
    // Continue with offline mode
    isOnline = false;
    supabase = null;
});

// Export functions and initialized client
export {
    supabase,
    createNewAssessment,
    validateSession,
    isOnline,
    processOfflineQueue
};