/**
 * VALID Assessment State Manager
 * Provides a centralized state management solution with persistence
 */

import { logger } from './logger.js';

class StateManager {
    constructor() {
        // Initialize default state
        const defaultState = {
            initialized: false,
            currentSection: 'welcomeSection',
            assessment: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            demographics: null,
            scores: null,
            quality: null,
            startTime: null,
            completedAt: null,
            status: 'not_started'
        };

        // Clear any existing state to prevent race conditions
        sessionStorage.removeItem('validState');

        // Set initial state
        this.state = defaultState;
        logger.debug('State manager initialized with default state');
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Update the application state
     * @param {Object} newState - New state values to merge
     */
    async setState(newState) {
        try {
            // Get current state
            const currentState = this.getState();

            // Validate question-related state updates
            if (newState.hasOwnProperty('currentQuestionIndex')) {
                // Ensure questions array exists
                if (!currentState.questions || !Array.isArray(currentState.questions)) {
                    throw new Error('Cannot update question index: questions array not initialized');
                }

                // Validate index bounds
                if (newState.currentQuestionIndex < 0 || newState.currentQuestionIndex >= currentState.questions.length) {
                    throw new Error(`Invalid question index: ${newState.currentQuestionIndex}`);
                }

                // Ensure the question at this index exists
                const question = currentState.questions[newState.currentQuestionIndex];
                if (!question || !question.id) {
                    throw new Error(`Invalid question at index ${newState.currentQuestionIndex}`);
                }

                logger.debug('Updating question index:', {
                    from: currentState.currentQuestionIndex,
                    to: newState.currentQuestionIndex,
                    questionId: question.id
                });
            }

            // Validate answers updates
            if (newState.hasOwnProperty('answers')) {
                const answers = newState.answers;
                if (typeof answers !== 'object') {
                    throw new Error('Invalid answers format');
                }

                // Validate each answer
                Object.entries(answers).forEach(([questionId, value]) => {
                    if (!questionId || typeof value !== 'number' || value < 1 || value > 7) {
                        throw new Error(`Invalid answer for question ${questionId}: ${value}`);
                    }
                });

                logger.debug('Updating answers:', {
                    previousCount: Object.keys(currentState.answers || {}).length,
                    newCount: Object.keys(answers).length
                });
            }

            // Merge states
            const mergedState = {
                ...currentState,
                ...newState,
                lastUpdated: new Date().toISOString()
            };

            // Save to session storage
            sessionStorage.setItem('validState', JSON.stringify(mergedState));
            
            logger.debug('State updated successfully:', {
                updates: Object.keys(newState),
                currentSection: mergedState.currentSection
            });

            return mergedState;
        } catch (error) {
            logger.error('Error updating state:', error);
            throw error;
        }
    }

    /**
     * Validate section transitions
     */
    validateSectionTransition(from, to) {
        const validTransitions = {
            welcomeSection: ['demographicsSection'],
            demographicsSection: ['instructionsSection', 'welcomeSection'],
            instructionsSection: ['assessmentSection', 'demographicsSection'],
            assessmentSection: ['resultsSection'],
            resultsSection: ['demographicsSection'] // For retaking assessment
        };

        if (!validTransitions[from]?.includes(to)) {
            logger.error('Invalid section transition:', {
                from,
                to,
                validTransitions: validTransitions[from]
            });
            throw new Error(`Invalid section transition from ${from} to ${to}`);
        }
    }

    /**
     * Reset state to default
     */
    async resetState() {
        try {
            // Clear session storage
            sessionStorage.removeItem('validState');

            // Reset to default state
            await this.setState({
                initialized: false,
                currentSection: 'welcomeSection',
                assessment: null,
                questions: [],
                currentQuestionIndex: 0,
                answers: {},
                demographics: null,
                scores: null,
                quality: null,
                startTime: null,
                completedAt: null,
                status: 'not_started',
                isReset: true
            });

            logger.info('State reset to default');
            return true;
        } catch (error) {
            logger.error('Error resetting state:', error);
            throw error;
        }
    }

    /**
     * Restore state from session storage
     */
    async restoreState() {
        try {
            const savedState = sessionStorage.getItem('validState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                await this.setState(parsedState);
                logger.info('State restored from session storage');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error restoring state:', error);
            return false;
        }
    }
}

// Export singleton instance
export default new StateManager(); 