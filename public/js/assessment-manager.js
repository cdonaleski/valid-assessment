/**
 * VALID Assessment Manager
 * Handles core assessment functionality with offline-first approach
 */

import { logger } from './logger.js';
import validAssessmentData from './questions-data.js';
import stateManager from './state-manager.js';
import database from "./database-clean.js";
import sessionManager from './session-manager.js';
const { supabase, isOnline } = database;
import { calculateScores, validateAnswer } from './scoring.js';

// Helper: Check if user is logged in (real or demo)
function isUserLoggedIn() {
    // Check for Supabase Auth user or demo user in localStorage
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) return true;
    if (window.supabase && window.supabase.auth) {
        const user = window.supabase.auth.getUser && window.supabase.auth.getUser();
        if (user && user.id) return true;
    }
    return false;
}

// Helper: Check if user is a team admin
function isTeamAdmin(user) {
    return user && user.team_role === 'admin';
}

// Helper: Check if user is a super admin
function isSuperAdmin(user) {
    return user && user.role === 'super_admin';
}

// Helper: Check if a profile field is editable by the user
function canEditProfileField(user, field) {
    if (!user) return false;
    if (user.synced_from_hris && !isSuperAdmin(user)) return false;
    if (user.team_id && ['job_title', 'department', 'location'].includes(field)) return false;
    return true;
}

class AssessmentManager {
    constructor() {
        // Storage keys
        this.STORAGE_KEYS = {
            PROGRESS: 'valid_assessment_progress',
            CURRENT: 'valid_current_assessment',
            STATE: 'validAssessmentState',
            DATA: 'validAssessmentData',
            COMPLETED: 'valid_completed_assessments',
            SYNC_QUEUE: 'valid_sync_queue'
        };
        this.OPERATION_TIMEOUT = 10000; // 10 seconds
        this.questions = [];
        
        // Handle page unload
        window.addEventListener('beforeunload', this.handleSessionEnd.bind(this));
        
        // Initialize questions on construction
        this.initializeQuestions();
    }

    async initializeQuestions() {
        try {
            await this.loadQuestions();
            logger.debug('Questions initialized in constructor:', {
                questionsLength: this.questions?.length,
                firstQuestion: this.questions?.[0]?.text
            });
        } catch (error) {
            logger.error('Failed to initialize questions in constructor:', error);
        }
    }

    handleSessionEnd(event) {
        try {
            const state = stateManager.getState();
            if (state && state.isInitialized) {
                localStorage.setItem(this.STORAGE_KEYS.STATE, JSON.stringify(state));
            }
        } catch (error) {
            logger.error('Failed to save state on unload:', error);
        }
    }

    async loadQuestions() {
        try {
            // Use the already imported questions data
            // Version: 2024-01-15 - Fixed for Vercel deployment
            // DEPLOYMENT TEST: This should load questions from module, not JSON file
            logger.debug('Loading questions from validAssessmentData:', {
                hasValidAssessmentData: !!validAssessmentData,
                hasQuestions: !!validAssessmentData?.questions,
                questionsLength: validAssessmentData?.questions?.length,
                firstQuestion: validAssessmentData?.questions?.[0]?.text
            });
            
            this.questions = validAssessmentData.questions;
            
            logger.debug('Questions loaded into assessment manager:', {
                questionsLength: this.questions?.length,
                firstQuestion: this.questions?.[0]?.text
            });
            
            return this.questions;
        } catch (error) {
            logger.error('Failed to load questions:', error);
            throw error;
        }
    }

    generateToken(email) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}-${email.split('@')[0]}`.toUpperCase();
    }

    async saveProgress(state) {
        logger.debug('saveProgress called with state:', { 
            hasState: !!state,
            hasDemographics: !!state?.demographics,
            hasEmail: !!state?.demographics?.email,
            email: state?.demographics?.email,
            hasAnswers: !!state?.answers,
            answersCount: state?.answers ? Object.keys(state.answers).length : 0,
            isLoggedIn: isUserLoggedIn(),
        });
        
        if (!isUserLoggedIn()) {
            logger.warn('User not logged in, showing sign-in prompt');
            // Show sign-in modal instead of alert
            this.showSignInPrompt();
            throw new Error('User not logged in');
        }
        
        try {
            if (!state || !state.demographics?.email) {
                logger.error('Invalid state or missing email:', { 
                    hasState: !!state, 
                    hasDemographics: !!state?.demographics,
                    email: state?.demographics?.email 
                });
                throw new Error('Invalid state or missing email');
            }
            
            const token = this.generateToken(state.demographics.email);
            const progress = {
                token,
                email: state.demographics.email,
                timestamp: Date.now(),
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                state: {
                    currentQuestion: state.currentQuestionIndex || state.currentQuestion || 0,
                    answers: state.answers || [],
                    demographics: state.demographics,
                    startTime: state.startTime
                }
            };
            
            logger.debug('Generated progress data:', { token, email: progress.email });
            
            // Get existing progress data
            const existingData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRESS) || '{}');
            // Add new progress
            existingData[token] = progress;
            // Save back to storage
            localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(existingData));
            
            logger.debug('Progress saved to localStorage:', { 
                token, 
                existingTokens: Object.keys(existingData).length 
            });
            
            // Also save to database if online
            if (database.isOnline()) {
                try {
                    await database.createAssessment({
                        email: state.demographics.email,
                        demographics: state.demographics,
                        status: 'in_progress',
                        current_question: state.currentQuestionIndex || state.currentQuestion || 0,
                        answers: state.answers || {},
                        created_at: new Date().toISOString()
                    });
                    logger.info('Progress also saved to database');
                } catch (dbError) {
                    logger.warn('Failed to save to database:', dbError);
                }
            } else {
                logger.debug('Database offline, saved to localStorage only');
            }
            
            logger.info('Progress saved successfully', { token });
            if (typeof window.showInProgressIndicator === 'function') {
                window.showInProgressIndicator(true);
            }
            return token;
        } catch (error) {
            logger.error('Failed to save progress:', error);
            throw error;
        }
    }

    // Show sign-in prompt modal
    showSignInPrompt() {
        const modal = document.createElement('div');
        modal.className = 'signin-modal';
        modal.innerHTML = `
            <div class="signin-modal-content">
                <h3>Sign In Required</h3>
                <p>You need to sign in to save your progress and access your results.</p>
                <div class="signin-options">
                    <button class="btn btn-primary" onclick="window.location.href='/dashboard.html'">
                        Go to Dashboard
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.signin-modal').remove()">
                        Continue Without Saving
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    // Check if user has incomplete assessment
    async hasIncompleteAssessment(email) {
        if (!email) return false;
        
        try {
            // Check database first
            if (database.isOnline()) {
                const { data, error } = await database.supabase()
                    .from('assessments')
                    .select('id, status, current_question, created_at')
                    .eq('email', email)
                    .eq('status', 'in_progress')
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    return data[0];
                }
            }
            
            // Check local storage as fallback
            const savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRESS) || '{}');
            for (const [token, progress] of Object.entries(savedData)) {
                if (progress.email.toLowerCase() === email.toLowerCase() && 
                    progress.expiresAt > Date.now()) {
                    return { token, ...progress.state };
                }
            }
            
            return false;
        } catch (error) {
            logger.error('Error checking incomplete assessment:', error);
            return false;
        }
    }

    // Auto-save progress periodically
    startAutoSave() {
        logger.info('Starting auto-save with 30-second interval');
        if (typeof window.showAutoSaveIndicator === 'function') {
            window.showAutoSaveIndicator(true);
        }
        this.autoSaveInterval = setInterval(async () => {
            try {
                const state = stateManager.getState();
                logger.debug('Auto-save check - State:', { 
                    hasState: !!state, 
                    isInitialized: state?.isInitialized,
                    hasDemographics: !!state?.demographics,
                    hasAnswers: !!state?.answers,
                    answersCount: state?.answers ? Object.keys(state.answers).length : 0,
                    isLoggedIn: isUserLoggedIn()
                });
                
                // Check if we have a valid state to save
                if (state && 
                    state.demographics && 
                    state.demographics.email && 
                    isUserLoggedIn()) {
                    
                    // Only save if we have some progress (answers or current question > 0)
                    const hasProgress = (state.answers && Object.keys(state.answers).length > 0) || 
                                      (state.currentQuestion && state.currentQuestion > 0) ||
                                      (state.currentQuestionIndex && state.currentQuestionIndex > 0);
                    
                    if (hasProgress) {
                        logger.info('Auto-save: Saving progress...');
                        await this.saveProgress(state);
                        logger.info('Auto-save: Progress saved successfully');
                        if (typeof window.showInProgressIndicator === 'function') {
                            window.showInProgressIndicator(true);
                        }
                    } else {
                        logger.debug('Auto-save: No progress to save yet');
                    }
                } else {
                    logger.debug('Auto-save: Conditions not met for saving', {
                        hasState: !!state,
                        hasDemographics: !!state?.demographics,
                        hasEmail: !!state?.demographics?.email,
                        isLoggedIn: isUserLoggedIn()
                    });
                }
            } catch (error) {
                logger.warn('Auto-save failed:', error);
            }
        }, 30000); // Save every 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    async loadProgress(token, email) {
        return this.executeWithTimeout(async () => {
            try {
                // Validate inputs
                if (!token || !email) {
                    throw new Error('Token and email are required');
                }

                logger.debug('Loading progress with token:', { token, email });

                // Get all saved progress
                const savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRESS) || '{}');
                
                // Find matching progress
                const progress = savedData[token];
                
                if (!progress) {
                    throw new Error('No saved progress found for this token');
                }

                if (progress.email.toLowerCase() !== email.toLowerCase()) {
                    throw new Error('Email does not match the one used to save progress');
                }

                if (progress.expiresAt < Date.now()) {
                    throw new Error('This resume token has expired');
                }

                // Load questions if needed
                if (!this.questions.length) {
                    await this.loadQuestions();
                }

                // Return state in the expected format
                return {
                    ...progress.state,
                    questions: this.questions,
                    token,
                    isInitialized: true,
                    isRestored: true,
                    status: 'in_progress'
                };
            } catch (error) {
                logger.error('Failed to load progress:', error);
                throw error;
            }
        });
    }

    async resumeAssessment(token, email) {
            logger.debug('resumeAssessment called with:', { token, email });
        try {
            const state = await this.loadProgress(token, email);
            logger.debug('Loaded progress state:', { state });
            logger.debug('Setting state in stateManager:', { state });
            await stateManager.setState(state);
            return true;
        } catch (error) {
            logger.error('Failed to resume assessment:', error);
            throw error;
        }
    }

    /**
     * Start a new assessment
     * @param {Object} demographics - User demographic information
     */
    async startAssessment(demographics) {
        return this.executeWithTimeout(async () => {
            try {
                logger.info('Starting new assessment');

                // Check session status
                if (!sessionManager.checkSession()) {
                    throw new Error('Invalid session');
                }

                // Validate demographics
                if (!demographics || !demographics.email) {
                    logger.error('Invalid demographics data:', { demographics });
                    throw new Error('Invalid demographics data');
                }

                // Load and validate questions first
                await this.loadQuestions();
                logger.debug('Questions loaded in startAssessment:', {
                    questionsLength: this.questions?.length,
                    firstQuestion: this.questions?.[0]?.text,
                    hasQuestions: !!this.questions
                });
                
                if (!this.questions || this.questions.length === 0) {
                    logger.error('No questions available after loading');
                    throw new Error('Failed to load assessment questions');
                }

                // Initialize assessment state
                const assessmentState = {
                    id: crypto.randomUUID(),
                    startTime: new Date().toISOString(),
                    demographics: demographics,
                    questions: this.questions,
                    status: 'in_progress'
                };

                logger.debug('Assessment state created:', {
                    assessmentId: assessmentState.id,
                    questionsInState: assessmentState.questions?.length,
                    firstQuestionInState: assessmentState.questions?.[0]?.text
                });

                // Save assessment state and start session
                try {
                    await Promise.all([
                        this.saveAssessmentState(assessmentState),
                        sessionManager.startSession()
                    ]);
                } catch (error) {
                    logger.error('Failed to initialize assessment:', error);
                    throw error;
                }

                logger.info('Assessment started successfully:', {
                    id: assessmentState.id,
                    questionCount: this.questions.length,
                    startTime: assessmentState.startTime,
                    isOnline: database.isOnline()
                });

                return assessmentState;
            } catch (error) {
                logger.error('Error starting assessment:', error);
                throw error;
            }
        });
    }

    async saveAssessmentState(assessmentState) {
        try {
            // Initialize database if needed
            if (!database.isOnline()) {
                logger.info('Database not connected, attempting to initialize...');
                await database.initialize();
            }

            if (database.isOnline()) {
                logger.info('Saving assessment to database...');
                await database.createAssessment({
                    id: assessmentState.id,
                    email: assessmentState.demographics.email,
                    demographics: assessmentState.demographics,
                    status: assessmentState.status,
                    created_at: assessmentState.startTime
                });
                logger.info('Assessment saved to database successfully');
            } else {
                logger.warn('Database offline, proceeding with local storage only');
            }

            // Save assessment locally
            try {
                localStorage.setItem(this.STORAGE_KEYS.CURRENT, JSON.stringify(assessmentState));
                logger.info('Assessment saved locally');
            } catch (storageError) {
                logger.error('Error saving assessment locally:', storageError);
                // Continue even if local storage fails
            }

            // Update state manager
            try {
                await stateManager.setState({
                    assessment: assessmentState,
                    questions: this.questions,
                    currentQuestionIndex: 0,
                    answers: {},
                    demographics: assessmentState.demographics,
                    startTime: assessmentState.startTime,
                    status: 'in_progress',
                    isInitializing: true
                });
            } catch (stateError) {
                logger.error('Error updating state manager:', stateError);
                throw stateError;
            }
        } catch (error) {
            logger.error('Failed to save assessment state:', error);
            throw error;
        }
    }

    /**
     * Get the current question
     */
    getCurrentQuestion() {
        try {
            const state = stateManager.getState();
            
            // Validate state
            if (!state.initialized) {
                logger.error('Assessment not initialized');
                return null;
            }

            // Ensure questions are loaded
            if (!this.questions || this.questions.length === 0) {
                logger.warn('No questions in manager, attempting to load...');
                this.loadQuestions().catch(error => {
                    logger.error('Failed to load questions in getCurrentQuestion:', error);
                });
                return null;
            }

            if (!state.questions || !Array.isArray(state.questions) || state.questions.length === 0) {
                logger.warn('No questions in state, using manager questions as fallback');
                // Use manager questions as fallback
                if (!state.currentQuestionIndex && state.currentQuestionIndex !== 0) {
                    logger.error('No current question index in state');
                    return null;
                }
                if (state.currentQuestionIndex < 0 || state.currentQuestionIndex >= this.questions.length) {
                    logger.error('Invalid question index:', {
                        index: state.currentQuestionIndex,
                        totalQuestions: this.questions.length
                    });
                    return null;
                }
                return this.questions[state.currentQuestionIndex];
            }

            if (typeof state.currentQuestionIndex !== 'number' || 
                state.currentQuestionIndex < 0 || 
                state.currentQuestionIndex >= state.questions.length) {
                logger.error('Invalid question index:', {
                    index: state.currentQuestionIndex,
                    totalQuestions: state.questions.length
                });
                return null;
            }

            const question = state.questions[state.currentQuestionIndex];
            
            if (!question) {
                logger.error('No question found at index:', {
                    index: state.currentQuestionIndex,
                    totalQuestions: state.questions.length
                });
                return null;
            }

            logger.debug('Getting current question:', {
                index: state.currentQuestionIndex,
                questionId: question.id,
                totalQuestions: state.questions.length,
                answersCount: Object.keys(state.answers || {}).length
            });

            return question;
        } catch (error) {
            logger.error('Error getting current question:', error);
            return null;
        }
    }

    /**
     * Record an answer for the current question
     */
    async recordAnswer(value) {
        try {
            const state = stateManager.getState();
            const currentQuestion = this.getCurrentQuestion();

            if (!currentQuestion) {
                throw new Error('No current question available');
            }

            // Validate answer
            if (!validateAnswer(currentQuestion.id, value)) {
                throw new Error('Invalid answer value');
            }

            // Update answers in state
            await stateManager.setState({
                answers: {
                    ...state.answers,
                    [currentQuestion.id]: value
                }
            });

            logger.debug('Answer recorded:', {
                questionId: currentQuestion.id,
                value,
                totalAnswers: Object.keys(state.answers).length + 1
            });

            return true;
        } catch (error) {
            logger.error('Error recording answer:', error);
            throw error;
        }
    }

    /**
     * Complete the assessment and calculate scores
     */
    async completeAssessment() {
        return this.executeWithTimeout(async () => {
            try {
                const state = stateManager.getState();

                // Validate all questions are answered
                const unansweredQuestions = state.questions.filter(q => !state.answers[q.id]);
                if (unansweredQuestions.length > 0) {
                    throw new Error(`${unansweredQuestions.length} questions remain unanswered`);
                }

                // Calculate scores
                const results = calculateScores(state.answers, state.startTime);

                // Save results locally first
                try {
                    const resultsData = {
                        id: state.assessment.id,
                        timestamp: new Date().toISOString(),
                        scores: results.scores,
                        quality: results.quality,
                        demographics: state.demographics,
                        answers: state.answers
                    };
                    
                    // Save to local storage
                    const savedResults = localStorage.getItem(this.STORAGE_KEYS.COMPLETED);
                    const completedAssessments = savedResults ? JSON.parse(savedResults) : [];
                    completedAssessments.push(resultsData);
                    localStorage.setItem(this.STORAGE_KEYS.COMPLETED, JSON.stringify(completedAssessments));
                    
                    logger.info('Results saved locally');
                } catch (storageError) {
                    logger.error('Failed to save results locally:', storageError);
                }

                // Try to save to database if online
                if (database.isOnline()) {
                    try {
                        await database.saveResults(state.assessment.id, results.scores, {
                            duration_minutes: Math.round((Date.now() - new Date(state.startTime).getTime()) / 60000)
                        });
                        logger.info('Results saved to database');
                    } catch (dbError) {
                        logger.error('Failed to save results to database:', dbError);
                        // Queue for later sync
                        this.queueForSync(state.assessment.id);
                    }
                } else {
                    // Queue for later sync
                    this.queueForSync(state.assessment.id);
                }

                // Update state with results
                await stateManager.setState({
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    scores: results.scores,
                    quality: results.quality
                });

                logger.info('Assessment completed:', {
                    scores: results.scores,
                    quality: results.quality,
                    savedLocally: true,
                    savedToDatabase: database.isOnline()
                });

                return results;
            } catch (error) {
                logger.error('Error completing assessment:', error);
                throw error;
            }
        });
    }

    /**
     * Queue an assessment for later sync
     */
    queueForSync(assessmentId) {
        try {
            const syncQueue = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE) || '[]');
            if (!syncQueue.includes(assessmentId)) {
                syncQueue.push(assessmentId);
                localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
                logger.info('Assessment queued for sync:', assessmentId);
            }
        } catch (error) {
            logger.error('Failed to queue for sync:', error);
        }
    }

    /**
     * Execute an operation with timeout
     */
    async executeWithTimeout(operation) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Operation timed out')), this.OPERATION_TIMEOUT)
            )
        ]);
    }
}

// Create and export a singleton instance
const assessmentManager = new AssessmentManager();
export default assessmentManager;