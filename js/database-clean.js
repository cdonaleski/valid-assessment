import { initializeSupabase } from './supabase-client.js';
import { logger } from './logger.js';
import supabaseClient from './supabase-client.js';

// Encryption key generation and storage
function getEncryptionKey() {
    let key = sessionStorage.getItem('encryption_key');
    if (!key) {
        key = crypto.getRandomValues(new Uint8Array(32)).join('');
        sessionStorage.setItem('encryption_key', key);
    }
    return key;
}

// Encryption helper functions
async function encryptData(data) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(key),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encodedData
        );
        
        return {
            data: Array.from(new Uint8Array(encryptedData)),
            iv: Array.from(iv)
        };
    } catch (error) {
        logger.error('Encryption failed:', error);
        throw error;
    }
}

async function decryptData(encryptedObj) {
    try {
        const key = getEncryptionKey();
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
            cryptoKey,
            new Uint8Array(encryptedObj.data)
        );
        
        return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
        logger.error('Decryption failed:', error);
        throw error;
    }
}

// Secure storage helper
const secureStorage = {
    async setItem(key, value) {
        const encrypted = await encryptData(value);
        localStorage.setItem(key, JSON.stringify(encrypted));
    },
    
    async getItem(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return await decryptData(JSON.parse(encrypted));
    },
    
    removeItem(key) {
        localStorage.removeItem(key);
    }
};

// Database state
const state = {
    isOnline: false,
    offlineQueue: [],
    supabase: null
};

// Storage keys
const STORAGE_KEYS = {
    ASSESSMENTS: 'valid_assessments',
    CURRENT_ASSESSMENT: 'valid_current_assessment',
    OFFLINE_QUEUE: 'valid_offline_queue'
};

// Initialize Supabase client
async function initializeDatabase() {
    try {
        // Check if we're in development mode
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';

        // Show warning message for missing environment variables
        const showOfflineWarning = () => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'offline-warning';
            warningDiv.innerHTML = `
                <div class="warning-content">
                    <p><strong>⚠️ Running in Offline Mode</strong></p>
                    <p>Your progress will be saved locally in your browser.</p>
                    <button class="close-warning">✕</button>
                </div>
            `;
            document.body.appendChild(warningDiv);

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .offline-warning {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                    border-radius: 4px;
                    padding: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    z-index: 1000;
                    max-width: 300px;
                    animation: slideIn 0.3s ease-out;
                }
                .warning-content {
                    position: relative;
                    padding-right: 20px;
                }
                .close-warning {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 5px;
                    color: #856404;
                }
                .close-warning:hover {
                    color: #533f03;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            // Add close button handler
            const closeButton = warningDiv.querySelector('.close-warning');
            closeButton.addEventListener('click', () => {
                warningDiv.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => warningDiv.remove(), 300);
            });

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (document.body.contains(warningDiv)) {
                    warningDiv.style.animation = 'slideOut 0.3s ease-in forwards';
                    setTimeout(() => warningDiv.remove(), 300);
                }
            }, 10000);
        };

        if (isDevelopment) {
            logger.info('Running in development mode - using offline storage');
            state.isOnline = false;
            showOfflineWarning();
            return true;
        }

        // Initialize the Supabase client
        state.supabase = await initializeSupabase();
        
        if (!state.supabase) {
            logger.info('No Supabase configuration found - using offline storage');
            state.isOnline = false;
            showOfflineWarning();
            return true;
        }
        
        // Try to create tables if they don't exist
        const { error: createError } = await state.supabase.rpc('create_tables_if_not_exist');
        
        // Handle different error cases
        if (createError) {
            if (createError.code === '42501') { // Permission denied
                logger.warn('Permission denied when creating tables. This is expected on first run:', createError);
                // Try to verify basic connectivity without table creation
                const { error: testError } = await state.supabase
                    .from('assessments')
                    .select('count')
                    .limit(1);
                    
                if (testError && testError.code !== 'PGRST116') { // Table doesn't exist
                    throw testError;
                }
            } else if (createError.code === 'PGRST302') { // Function doesn't exist
                logger.warn('Create tables function not found. This is expected on first run:', createError);
            } else {
                logger.error('Failed to create tables:', createError);
                throw createError;
            }
        }
        
        state.isOnline = true;
        logger.info('Database initialized successfully');
        return true;
    } catch (error) {
        logger.info('Database initialization failed - using offline storage:', {
            error: error.message,
            code: error.code,
            details: error.details
        });
        state.isOnline = false;
        showOfflineWarning();
        return true;
    }
}

// Initialize database on load
initializeDatabase().catch(error => {
    logger.warn('Failed to initialize database - using offline storage:', error);
    state.isOnline = false;
});

// Load offline queue from storage
try {
    const queue = await secureStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    state.offlineQueue = queue || [];
} catch (error) {
    logger.warn('Failed to load offline queue:', error);
    state.offlineQueue = [];
}

// Process offline queue
async function processOfflineQueue() {
    if (!state.isOnline || !state.supabase || state.offlineQueue.length === 0) return;
    
    logger.info(`Processing offline queue: ${state.offlineQueue.length} items`);
    
    const failedOperations = [];
    
    for (const operation of state.offlineQueue) {
        try {
            switch (operation.type) {
                case 'create':
                    await state.supabase.from(operation.table).insert(operation.data);
                    break;
                case 'update':
                    await state.supabase.from(operation.table)
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
    state.offlineQueue = failedOperations;
    await secureStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, state.offlineQueue);
}

// Add operation to offline queue
async function addToOfflineQueue(operation) {
    state.offlineQueue.push(operation);
    await secureStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, state.offlineQueue);
}

// Export functions and initialized client
export const isOnline = () => state.isOnline;
export const getSupabase = () => state.supabase;
export const getOfflineQueue = () => state.offlineQueue;
export { processOfflineQueue, addToOfflineQueue };

// Export database interface
export default {
    supabase: () => state.supabase,
    isOnline: () => state.isOnline,
    initialize: initializeDatabase,
    
    async createAssessment(data) {
        try {
            if (!state.supabase) {
                await initializeDatabase();
                if (!state.supabase) {
                    throw new Error('Database not initialized');
                }
            }

            const { data: assessment, error } = await state.supabase
                .from('assessments')
                .insert(data)
                .select()
                .single();

            if (error) throw error;
            return assessment;
        } catch (error) {
            logger.error('Failed to create assessment:', error);
            throw error;
        }
    },

    async saveResults(session_id, scores, completion_data) {
        try {
            if (!state.supabase) {
                await initializeDatabase();
                if (!state.supabase) {
                    throw new Error('Database not initialized');
                }
            }

            const { error } = await state.supabase
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
            logger.error('Failed to save results:', error);
            throw error;
        }
    },

    async getAssessment(session_id) {
        try {
            if (!state.supabase) {
                await initializeDatabase();
                if (!state.supabase) {
                    throw new Error('Database not initialized');
                }
            }

            const { data, error } = await state.supabase
                .from('assessments')
                .select('*')
                .eq('session_id', session_id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Failed to get assessment:', error);
            throw error;
        }
    },

    async getAllCompletedAssessments() {
        try {
            if (!state.supabase) {
                await initializeDatabase();
                if (!state.supabase) {
                    throw new Error('Database not initialized');
                }
            }

            const { data, error } = await state.supabase
                .from('assessments')
                .select('*')
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Failed to get completed assessments:', error);
            throw error;
        }
    },

    async validateSession(session_id) {
        try {
            if (!state.supabase) {
                await initializeDatabase();
                if (!state.supabase) {
                    throw new Error('Database not initialized');
                }
            }

            const { data, error } = await state.supabase
                .from('assessments')
                .select('status')
                .eq('session_id', session_id)
                .single();

            if (error) throw error;
            return data && data.status !== 'completed';
        } catch (error) {
            logger.error('Failed to validate session:', error);
            throw error;
        }
    },

    async loadAssessment(token, email) {
        try {
            if (!token || !email) {
                throw new Error('Token and email are required to load assessment');
            }

            const { data, error } = await this.supabase
                .from('assessments')
                .select('*')
                .eq('token', token)
                .eq('email', email)
                .single();

            if (error) {
                logger.error('Database error loading assessment:', error);
                throw error;
            }

            if (!data) {
                throw new Error('No assessment found with provided token and email');
            }

            // Decrypt data if needed
            if (data.encrypted_state) {
                data.state = await decryptData(data.encrypted_state);
            }

            return data;
        } catch (error) {
            logger.error('Failed to load assessment:', error);
            throw error;
        }
    }
}; 