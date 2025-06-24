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
            this.questions = validAssessmentData.questions;
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
        try {
            if (!state || !state.demographics?.email) {
                throw new Error('Invalid state or missing email');
            }

            const token = this.generateToken(state.demographics.email);
            const progress = {
                token,
                email: state.demographics.email,
                timestamp: Date.now(),
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                state: {
                    currentQuestion: state.currentQuestion || 0,
                    answers: state.answers || [],
                    demographics: state.demographics,
                    startTime: state.startTime
                }
            };

            // Get existing progress data
            const existingData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRESS) || '{}');
            
            // Add new progress
            existingData[token] = progress;
            
            // Save back to storage
            localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(existingData));
            
            logger.info('Progress saved successfully', { token });
            return token;
        } catch (error) {
            logger.error('Failed to save progress:', error);
            throw error;
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
        try {
            const state = await this.loadProgress(token, email);
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

            if (!state.questions || !Array.isArray(state.questions) || state.questions.length === 0) {
                logger.error('No questions available in state');
                return null;
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
                answersCount: Object.keys(state.answers).length
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