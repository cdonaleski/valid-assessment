/**
 * VALID Assessment Manager
 * Handles core assessment functionality with offline-first approach
 */

import { logger } from './logger.js';
import validAssessmentData from './questions-data.js';
import stateManager from './state-manager.js';
import { supabase, isOnline } from './database.js';
import { calculateScores, validateAnswer } from './scoring.js';

// Debug log the raw imported data
logger.debug('Raw imported validAssessmentData:', {
    hasData: !!validAssessmentData,
    isObject: typeof validAssessmentData === 'object',
    hasQuestions: !!validAssessmentData?.questions,
    questionsIsArray: Array.isArray(validAssessmentData?.questions),
    questionCount: validAssessmentData?.questions?.length,
    firstQuestion: validAssessmentData?.questions?.[0],
    lastQuestion: validAssessmentData?.questions?.[validAssessmentData?.questions?.length - 1]
});

// Validate the imported questions data
try {
    if (!validAssessmentData) {
        throw new Error('validAssessmentData module failed to load');
    }

    if (!validAssessmentData.questions || !Array.isArray(validAssessmentData.questions)) {
        throw new Error('Invalid questions array in validAssessmentData');
    }

    const attentionChecks = validAssessmentData.questions.filter(q => q.dimension === 'attention_check');
    logger.info('Validated questions data on import:', {
        totalQuestions: validAssessmentData.questions.length,
        attentionChecks: attentionChecks.map(q => ({ id: q.id, correctAnswer: q.correctAnswer }))
    });
} catch (error) {
    logger.error('Error validating questions data:', error);
    throw error;
}

class AssessmentManager {
    constructor() {
        this.isOffline = false;
        this.questions = [];
        this.initialized = false;
        this.startTime = null;

        // Clear any cached questions to ensure we use the latest version
        try {
            localStorage.removeItem('valid_questions');
            localStorage.removeItem('valid_current_assessment');
            logger.info('Cleared question cache on startup');
        } catch (error) {
            logger.warn('Failed to clear question cache:', error);
        }

        // Debug log the validAssessmentData in constructor
        logger.debug('AssessmentManager constructor - validAssessmentData:', {
            hasData: !!validAssessmentData,
            questionCount: validAssessmentData?.questions?.length,
            attentionChecks: validAssessmentData?.questions?.filter(q => q.dimension === 'attention_check')?.length
        });
    }

    /**
     * Load and randomize questions from the validAssessmentData module
     */
    async loadQuestions() {
        try {
            logger.debug('Starting loadQuestions...');
            
            // Debug log the validAssessmentData state
            logger.debug('validAssessmentData state in loadQuestions:', {
                hasData: !!validAssessmentData,
                isObject: typeof validAssessmentData === 'object',
                hasQuestions: !!validAssessmentData?.questions,
                questionsIsArray: Array.isArray(validAssessmentData?.questions),
                questionCount: validAssessmentData?.questions?.length
            });
            
            // Validate questions data
            if (!validAssessmentData?.questions?.length) {
                logger.error('Invalid or empty questions data:', { validAssessmentData });
                throw new Error('Questions data is invalid or empty');
            }

            // Log all questions with attention_check dimension
            const allQuestions = validAssessmentData.questions;
            logger.debug('All questions with dimensions:', allQuestions.map(q => ({
                id: q.id,
                dimension: q.dimension,
                category: q.category
            })));

            // Get attention check questions with detailed logging
            const attentionChecks = allQuestions.filter(q => {
                const isAttentionCheck = q.dimension === 'attention_check';
                logger.debug('Question check:', {
                    id: q.id,
                    dimension: q.dimension,
                    isAttentionCheck,
                    dimensionType: typeof q.dimension
                });
                return isAttentionCheck;
            });

            logger.debug('Attention check filtering results:', {
                totalQuestions: allQuestions.length,
                attentionChecks: attentionChecks.map(q => ({
                    id: q.id,
                    dimension: q.dimension,
                    correctAnswer: q.correctAnswer
                }))
            });

            // Separate core questions from quality checks
            const coreQuestions = allQuestions.filter(q => 
                !q.dimension.includes('social_desirability') && !q.dimension.includes('attention_check')
            );
            const qualityQuestions = allQuestions.filter(q => 
                q.dimension.includes('social_desirability') || q.dimension.includes('attention_check')
            );

            // Log question categorization results
            logger.debug('Question categorization:', {
                total: allQuestions.length,
                core: coreQuestions.length,
                quality: qualityQuestions.length,
                attentionChecks: attentionChecks.length
            });

            // Validate we have enough core questions
            if (coreQuestions.length < 10) {
                logger.error('Insufficient core questions:', { count: coreQuestions.length });
                throw new Error('Insufficient number of core questions');
            }

            // Randomize core questions
            const randomizedCore = [...coreQuestions].sort(() => Math.random() - 0.5);

            // Get and validate attention check questions
            const attentionCheck1 = attentionChecks.find(q => q.id === 'AC-01');
            const attentionCheck2 = attentionChecks.find(q => q.id === 'AC-02');

            if (!attentionCheck1 || !attentionCheck2) {
                logger.error('Missing attention check questions:', {
                    totalAttentionChecks: attentionChecks.length,
                    hasAC1: !!attentionCheck1,
                    hasAC2: !!attentionCheck2,
                    availableIds: attentionChecks.map(q => q.id)
                });
                throw new Error('Required attention check questions not found');
            }

            // Validate attention check questions have correct properties
            [attentionCheck1, attentionCheck2].forEach(q => {
                if (!q.correctAnswer || typeof q.correctAnswer !== 'number') {
                    logger.error('Invalid attention check question:', { question: q });
                    throw new Error(`Invalid attention check question: ${q.id}`);
                }
            });

            // Calculate positions for attention checks (30% and 70% through the assessment)
            const attentionCheck1Position = Math.floor(randomizedCore.length * 0.3);
            const attentionCheck2Position = Math.floor(randomizedCore.length * 0.7);

            // Insert attention checks
            randomizedCore.splice(attentionCheck1Position, 0, attentionCheck1);
            randomizedCore.splice(attentionCheck2Position, 0, attentionCheck2);

            // Get and validate social desirability questions
            const sdQuestions = validAssessmentData.questions.filter(q => q.dimension === 'social_desirability');
            if (sdQuestions.length === 0) {
                logger.error('No social desirability questions found');
                throw new Error('Required social desirability questions not found');
            }

            // Calculate interval for social desirability questions
            const sdInterval = Math.floor(randomizedCore.length / (sdQuestions.length + 1));

            // Insert social desirability questions at regular intervals
            sdQuestions.forEach((q, i) => {
                const position = Math.min((i + 1) * sdInterval, randomizedCore.length);
                randomizedCore.splice(position, 0, q);
            });

            // Validate final question set
            const invalidQuestions = randomizedCore.filter(q => !q || !q.id || !q.text || !q.dimension);
            if (invalidQuestions.length > 0) {
                logger.error('Invalid questions in final set:', {
                    invalidCount: invalidQuestions.length,
                    invalidQuestions
                });
                throw new Error('Invalid questions detected in final question set');
            }

            // Assign the validated question set
            this.questions = randomizedCore;
            
            // Log final question distribution
            logger.info('Questions loaded and randomized successfully:', {
                totalQuestions: this.questions.length,
                coreQuestions: coreQuestions.length,
                qualityChecks: qualityQuestions.length,
                attentionChecks: 2,
                sdQuestions: sdQuestions.length,
                questionDistribution: this.questions.reduce((acc, q) => {
                    acc[q.dimension] = (acc[q.dimension] || 0) + 1;
                    return acc;
                }, {}),
                firstQuestion: this.questions[0]?.id,
                lastQuestion: this.questions[this.questions.length - 1]?.id
            });

            return this.questions;
        } catch (error) {
            logger.error('Failed to load questions:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Start a new assessment
     * @param {Object} demographics - User demographic information
     */
    async startAssessment(demographics) {
        try {
            logger.info('Starting new assessment');

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
                startTime: Date.now(),
                demographics,
                questions: this.questions,
                currentQuestionIndex: 0,
                answers: {},
                status: 'in_progress',
                initialized: true
            };

            // Update state
            await stateManager.setState(assessmentState);

            logger.info('Assessment started successfully:', {
                id: assessmentState.id,
                questionCount: this.questions.length,
                email: demographics.email
            });

            return assessmentState;
        } catch (error) {
            logger.error('Failed to start assessment:', {
                error: error.message,
                stack: error.stack,
                demographics: demographics ? { ...demographics, email: '[REDACTED]' } : null
            });
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
        try {
            const state = stateManager.getState();

            // Validate all questions are answered
            const unansweredQuestions = state.questions.filter(q => !state.answers[q.id]);
            if (unansweredQuestions.length > 0) {
                throw new Error(`${unansweredQuestions.length} questions remain unanswered`);
            }

            // Calculate scores
            const results = calculateScores(state.answers, state.startTime);

            // Update state with results
            await stateManager.setState({
                status: 'completed',
                completedAt: new Date().toISOString(),
                scores: results.scores,
                quality: results.quality
            });

            logger.info('Assessment completed:', {
                scores: results.scores,
                quality: results.quality
            });

            return results;
        } catch (error) {
            logger.error('Error completing assessment:', error);
            throw error;
        }
    }

    /**
     * Generate and email assessment report
     */
    async emailReport(email) {
        try {
            const state = stateManager.getState();
            if (!state.scores) {
                throw new Error('No scores available');
            }

            // TODO: Implement email report generation and sending
            logger.info('Email report requested:', { email });
            return true;
        } catch (error) {
            logger.error('Error sending email report:', error);
            throw error;
        }
    }

    /**
     * Generate and download assessment report
     */
    async downloadReport() {
        try {
            const state = stateManager.getState();
            if (!state.scores) {
                throw new Error('No scores available');
            }

            // TODO: Implement report download
            logger.info('Download report requested');
            return true;
        } catch (error) {
            logger.error('Error downloading report:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new AssessmentManager(); 