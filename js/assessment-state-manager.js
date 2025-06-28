/**
 * Assessment State Manager
 * Handles saving, loading, and resuming assessment progress
 * Works across dashboard.html and index.html
 */

class AssessmentStateManager {
    constructor() {
        this.STORAGE_KEYS = {
            CURRENT_ASSESSMENT: 'valid_current_assessment',
            ASSESSMENT_PROGRESS: 'valid_assessment_progress',
            ASSESSMENT_RESULTS: 'valid_assessment_results',
            RESUME_FLAG: 'resumeAssessment',
            USER_ID: 'valid_user_id'
        };
        
        this.logger = window.logger || console;
    }

    /**
     * Get current user ID (from localStorage or demo user)
     */
    getCurrentUserId() {
        // Check for demo user first
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
            try {
                const user = JSON.parse(demoUser);
                return user.email || 'demo@example.com';
            } catch (e) {
                return 'demo@example.com';
            }
        }
        
        // Check for regular user
        return localStorage.getItem(this.STORAGE_KEYS.USER_ID) || 'anonymous';
    }

    /**
     * Save assessment state
     */
    saveAssessmentState(state) {
        try {
            const userId = this.getCurrentUserId();
            const assessmentData = {
                ...state,
                userId: userId,
                lastUpdated: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            localStorage.setItem(this.STORAGE_KEYS.CURRENT_ASSESSMENT, JSON.stringify(assessmentData));
            
            this.logger.info('Assessment state saved:', {
                userId: userId,
                currentQuestion: state.currentQuestion || state.currentQuestionIndex,
                answersCount: Object.keys(state.answers || {}).length,
                status: state.status
            });

            return true;
        } catch (error) {
            this.logger.error('Failed to save assessment state:', error);
            return false;
        }
    }

    /**
     * Load assessment state
     */
    loadAssessmentState() {
        try {
            const userId = this.getCurrentUserId();
            const assessmentData = localStorage.getItem(this.STORAGE_KEYS.CURRENT_ASSESSMENT);
            
            if (!assessmentData) {
                return null;
            }

            const state = JSON.parse(assessmentData);
            
            // Check if it's for the current user
            if (state.userId !== userId) {
                this.logger.warn('Assessment state belongs to different user, clearing');
                this.clearAssessmentState();
                return null;
            }

            // Check if expired
            if (state.expiresAt && state.expiresAt < Date.now()) {
                this.logger.warn('Assessment state expired, clearing');
                this.clearAssessmentState();
                return null;
            }

            this.logger.info('Assessment state loaded:', {
                userId: userId,
                currentQuestion: state.currentQuestion || state.currentQuestionIndex,
                answersCount: Object.keys(state.answers || {}).length,
                status: state.status
            });

            return state;
        } catch (error) {
            this.logger.error('Failed to load assessment state:', error);
            return null;
        }
    }

    /**
     * Save assessment results
     */
    saveAssessmentResults(results) {
        try {
            const userId = this.getCurrentUserId();
            const resultsData = {
                ...results,
                userId: userId,
                completedAt: Date.now()
            };

            // Get existing results
            const existingResults = this.loadAssessmentResults();
            existingResults.push(resultsData);

            // Keep only last 10 results
            if (existingResults.length > 10) {
                existingResults.splice(0, existingResults.length - 10);
            }

            localStorage.setItem(this.STORAGE_KEYS.ASSESSMENT_RESULTS, JSON.stringify(existingResults));
            
            this.logger.info('Assessment results saved:', {
                userId: userId,
                scores: results.scores,
                persona: results.persona?.primary
            });

            return true;
        } catch (error) {
            this.logger.error('Failed to save assessment results:', error);
            return false;
        }
    }

    /**
     * Load assessment results
     */
    loadAssessmentResults() {
        try {
            const userId = this.getCurrentUserId();
            const resultsData = localStorage.getItem(this.STORAGE_KEYS.ASSESSMENT_RESULTS);
            
            if (!resultsData) {
                return [];
            }

            const allResults = JSON.parse(resultsData);
            
            // Filter results for current user
            const userResults = allResults.filter(result => result.userId === userId);
            
            this.logger.info('Assessment results loaded:', {
                userId: userId,
                resultsCount: userResults.length
            });

            return userResults;
        } catch (error) {
            this.logger.error('Failed to load assessment results:', error);
            return [];
        }
    }

    /**
     * Check if user has incomplete assessment
     */
    hasIncompleteAssessment() {
        const state = this.loadAssessmentState();
        return state && state.status !== 'completed';
    }

    /**
     * Check if user has completed assessments
     */
    hasCompletedAssessments() {
        const results = this.loadAssessmentResults();
        return results.length > 0;
    }

    /**
     * Get assessment progress info
     */
    getAssessmentProgress() {
        const state = this.loadAssessmentState();
        if (!state) {
            return null;
        }

        const totalQuestions = state.questions?.length || 0;
        const answeredQuestions = Object.keys(state.answers || {}).length;
        const currentQuestion = state.currentQuestion || state.currentQuestionIndex || 0;

        return {
            totalQuestions,
            answeredQuestions,
            currentQuestion,
            progress: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
            status: state.status
        };
    }

    /**
     * Clear assessment state
     */
    clearAssessmentState() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_ASSESSMENT);
            localStorage.removeItem(this.STORAGE_KEYS.RESUME_FLAG);
            this.logger.info('Assessment state cleared');
            return true;
        } catch (error) {
            this.logger.error('Failed to clear assessment state:', error);
            return false;
        }
    }

    /**
     * Set resume flag
     */
    setResumeFlag() {
        localStorage.setItem(this.STORAGE_KEYS.RESUME_FLAG, 'true');
        this.logger.info('Resume flag set');
    }

    /**
     * Check resume flag
     */
    checkResumeFlag() {
        const flag = localStorage.getItem(this.STORAGE_KEYS.RESUME_FLAG);
        if (flag === 'true') {
            localStorage.removeItem(this.STORAGE_KEYS.RESUME_FLAG);
            return true;
        }
        return false;
    }

    /**
     * Mark assessment as completed
     */
    markAssessmentCompleted() {
        const state = this.loadAssessmentState();
        if (state) {
            state.status = 'completed';
            this.saveAssessmentState(state);
            this.logger.info('Assessment marked as completed');
        }
    }
}

// Create global instance
window.assessmentStateManager = new AssessmentStateManager(); 