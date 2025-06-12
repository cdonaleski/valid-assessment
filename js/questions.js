/**
 * VALID Assessment Tool - Questions Module
 * Purpose: Manages the assessment questions and their presentation.
 * 
 * This module handles:
 * - Question bank management
 * - Question sequencing and logic
 * - Response validation
 * - Question categories and weights
 * - Dynamic question generation
 */ 

/**
 * VALID Assessment Question Management System
 * Handles question loading, randomization, scoring, and progress tracking
 * for the VALID decision-making style assessment.
 */

import validAssessmentData from "./questions-data.js";
import database from "./database-clean.js";
import { logger } from "./logger.js";
import assessmentManager from './assessment-manager.js';

const { supabase, isOnline } = database;

/**
 * Manages the assessment questions and user responses
 */
class QuestionManager {
    constructor() {
        try {
            this.currentQuestionIndex = 0;
            this.questions = [];
            this.sessionId = null;
            this.answers = {};
            this.totalQuestions = validAssessmentData.questions.length;
            this.isInitialized = false;

            // Clear any existing cache
            localStorage.removeItem(assessmentManager.STORAGE_KEYS.CURRENT);

            // Load questions directly from questions-data.js
            this.questions = validAssessmentData.questions.map((q, index) => ({
                id: q.id,
                text: q.text,
                category: q.dimension.charAt(0).toUpperCase(),
                order_num: index + 1,
                dimension: q.dimension,
                reverse: q.reverse || false
            }));

            this.isInitialized = true;
            
            logger.info('QuestionManager initialized with official questions:', {
                questionCount: this.questions.length,
                firstQuestion: this.questions[0]?.text,
                isInitialized: this.isInitialized
            });
        } catch (error) {
            logger.error('Failed to construct QuestionManager:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Get static questions as fallback
     */
    getStaticQuestions() {
        try {
            return validAssessmentData.questions.map((q, index) => ({
                id: q.id,
                text: q.text,
                category: q.dimension.charAt(0).toUpperCase(),
                order_num: index + 1,
                dimension: q.dimension,
                reverse: q.reverse || false
            }));
        } catch (error) {
            logger.error('Failed to get static questions:', error);
            throw new Error('Failed to load questions: ' + error.message);
        }
    }

    /**
     * Initialize a new assessment session
     */
    async initializeSession(sessionId) {
        try {
            if (!sessionId) {
                throw new Error('Session ID is required');
            }

            logger.info('Initializing session:', { sessionId });
            
            // Always use the latest questions from questions-data.js
            this.questions = this.getStaticQuestions();
            
            this.sessionId = sessionId;
            this.currentQuestionIndex = 0;
            this.answers = {};

            this.isInitialized = true;
            logger.info('Session initialized successfully:', {
                sessionId: this.sessionId,
                questionCount: this.questions.length,
                currentIndex: this.currentQuestionIndex,
                firstQuestion: this.questions[0]?.text
            });
            return true;
        } catch (error) {
            logger.error('Failed to initialize session:', {
                error: error.message,
                stack: error.stack,
                sessionId
            });
            throw error;
        }
    }

    /**
     * Get the current question
     */
    async getCurrentQuestion() {
        try {
            // Always ensure we have the latest questions from questions-data.js
            if (!this.questions || this.questions.length === 0) {
                this.questions = this.getStaticQuestions();
                logger.info('Loaded latest questions from questions-data.js');
            }

            if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) {
                throw new Error('Invalid question index');
            }

            const question = this.questions[this.currentQuestionIndex];
            logger.debug('Getting current question:', {
                index: this.currentQuestionIndex,
                question: question.text,
                id: question.id
            });

            return question;
        } catch (error) {
            logger.error('Error in getCurrentQuestion:', error);
            throw error;
        }
    }

    /**
     * Move to the next question
     */
    async nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            await this.saveProgress();
            return this.questions[this.currentQuestionIndex];
        }
        return null;
    }

    /**
     * Move to the previous question
     */
    async previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return this.questions[this.currentQuestionIndex];
        }
        return null;
    }

    /**
     * Save the answer for the current question
     */
    async saveAnswer(value) {
        try {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            this.answers[currentQuestion.id] = {
                questionId: currentQuestion.id,
                value: value,
                category: currentQuestion.category,
                timestamp: new Date().toISOString()
            };

            await this.saveProgress();
            return true;
        } catch (error) {
            logger.error('Failed to save answer:', error);
            throw error;
        }
    }

    /**
     * Save current progress to the database and local storage
     */
    async saveProgress() {
        try {
            if (!this.sessionId) {
                logger.error('No active session');
                throw new Error('No active session');
            }

            logger.debug('Saving progress for session:', this.sessionId);

            const progressData = {
                current_question: this.currentQuestionIndex,
                answers: this.answers
            };

            // Try to save to database first
            if (this.supabase) {
                try {
                    const { error: updateError } = await this.supabase
                        .from('assessments')
                        .update(progressData)
                        .eq('id', this.sessionId);

                    if (!updateError) {
                        logger.info('Progress saved to database');
                    } else {
                        logger.warn('Failed to save to database:', updateError);
                    }
                } catch (error) {
                    logger.warn('Database save failed:', error);
                }
            }

            // Always save to local storage as backup
            const currentAssessment = localStorage.getItem(assessmentManager.STORAGE_KEYS.CURRENT);
            if (currentAssessment) {
                const assessment = JSON.parse(currentAssessment);
                const updatedAssessment = { ...assessment, ...progressData };
                localStorage.setItem(assessmentManager.STORAGE_KEYS.CURRENT, JSON.stringify(updatedAssessment));
                logger.info('Progress saved to local storage');
            }

            return true;
        } catch (error) {
            logger.error('Failed to save progress:', error);
            throw error;
        }
    }

    /**
     * Calculate scores for each category
     */
    calculateScores() {
        const scores = {
            V: 0, // Verity
            A: 0, // Association
            L: 0, // Lived Experience
            I: 0, // Institutional Knowledge
            D: 0  // Desire-Based
        };

        let counts = { V: 0, A: 0, L: 0, I: 0, D: 0 };

        // Calculate total for each category
        Object.values(this.answers).forEach(answer => {
            if (answer.value) {
                scores[answer.category] += parseInt(answer.value);
                counts[answer.category]++;
            }
        });

        // Calculate averages
        Object.keys(scores).forEach(category => {
            if (counts[category] > 0) {
                scores[category] = scores[category] / counts[category];
            }
        });

        return scores;
    }

    /**
     * Determine the dominant decision-making style
     */
    determinePersona() {
        const scores = this.calculateScores();
        const maxScore = Math.max(...Object.values(scores));
        const dominantStyles = Object.entries(scores)
            .filter(([_, score]) => score === maxScore)
            .map(([category]) => category);

        // Map categories to full names
        const categoryNames = {
            V: 'Verity-Driven',
            A: 'Association-Based',
            L: 'Experience-Led',
            I: 'Institution-Aligned',
            D: 'Desire-Guided'
        };

        return dominantStyles.map(style => categoryNames[style]).join(' & ');
    }

    /**
     * Get the current question index
     */
    getCurrentQuestionIndex() {
        return this.currentQuestionIndex;
    }

    /**
     * Get the total number of questions
     */
    getTotalQuestions() {
        return this.totalQuestions;
    }

    /**
     * Check if all questions have been answered
     */
    isComplete() {
        return Object.keys(this.answers).length === this.totalQuestions;
    }

    /**
     * Get the answer for a specific question
     */
    getAnswer(questionId) {
        return this.answers[questionId]?.value || null;
    }

    /**
     * Validate a response value
     */
    validateResponse(value) {
        return Number.isInteger(value) && value >= 1 && value <= 7;
    }

    /**
     * Clear any cached questions from localStorage
     */
    clearCache() {
        try {
            localStorage.removeItem(assessmentManager.STORAGE_KEYS.CURRENT);
            logger.info('Question cache cleared successfully');
            return true;
        } catch (error) {
            logger.error('Failed to clear question cache:', error);
            return false;
        }
    }
}

export default QuestionManager;

// Export validation helpers
export const { scale, dimensions } = validAssessmentData.metadata;

// Export response validation helper
export const validateResponse = (value) => {
    const { min, max } = scale;
    const numValue = Number(value);
    return !isNaN(numValue) && numValue >= min && numValue <= max;
}; 