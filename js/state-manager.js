/**
 * State Manager Class
 * Handles application state management and persistence
 */

import { logger } from './logger.js';
import assessmentManager from './assessment-manager.js';

export class StateManager {
    constructor() {
        this.state = {
            isInitialized: false,
            isTransitioning: false,
            currentSection: 'welcomeSection',
            demographics: null,
            answers: {},
            currentQuestion: 0,
            autoAdvance: false,
            startTime: null,
            completedAt: null,
            scores: null,
            quality: null,
            lastAnswerTimestamp: null
        };

        // Initialize listeners
        this.listeners = new Set();

        // Try to load existing state
        const savedState = localStorage.getItem(assessmentManager.STORAGE_KEYS.STATE);
        if (savedState) {
            try {
                console.log('Loading saved state from localStorage');
                const parsedState = JSON.parse(savedState);
                // Ensure we preserve isInitialized if it was true
                if (parsedState.isInitialized) {
                    this.state.isInitialized = true;
                }
                this.state = { ...this.state, ...parsedState };
                console.log('Loaded state:', this.state);
            } catch (error) {
                console.error('Error loading saved state:', error);
                localStorage.removeItem(assessmentManager.STORAGE_KEYS.STATE);
            }
        }

        logger.debug('StateManager initialized', {
            initialState: this.state
        });
    }

    async init() {
        try {
            // Ensure we're starting from welcome section if no state
            if (!this.state.currentSection) {
                this.state.currentSection = 'welcomeSection';
            }
            
            // Initialize section visibility
            this.updateSectionVisibility();

            // Check if we have a valid state
            const savedState = localStorage.getItem(assessmentManager.STORAGE_KEYS.STATE);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (parsedState.isInitialized && parsedState.demographics) {
                    this.state.isInitialized = true;
                }
            }
            
            logger.debug('State manager initialized:', this.state);
        } catch (error) {
            logger.error('Failed to initialize state:', error);
            // Clear potentially corrupted state
            localStorage.removeItem(assessmentManager.STORAGE_KEYS.STATE);
            this.state = {
                isInitialized: false,
                isTransitioning: false,
                currentSection: 'welcomeSection'
            };
        }
    }

    updateSectionVisibility() {
        try {
            // Hide all sections first
            document.querySelectorAll('.assessment-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
                section.style.opacity = '0';
            });
            
            // Show current section
            const currentSection = document.getElementById(this.state.currentSection);
            if (currentSection) {
                currentSection.style.display = 'block';
                // Force reflow
                currentSection.offsetHeight;
                currentSection.classList.add('active');
                currentSection.style.opacity = '1';
                logger.debug('Updated section visibility:', { currentSection: this.state.currentSection });
            } else {
                logger.error('Current section element not found:', this.state.currentSection);
            }
        } catch (error) {
            logger.error('Failed to update section visibility:', error);
        }
    }

    getState() {
        try {
            // Try to get state from memory first
            if (this.state) {
                logger.debug('Retrieved state from memory');
                return this.state;
            }

            // Try to get state from local storage
            const storedState = localStorage.getItem(assessmentManager.STORAGE_KEYS.STATE);
            if (!storedState) {
                logger.warn('No state found in storage');
                return null;
            }

            try {
                const parsedState = JSON.parse(storedState);
                if (!parsedState || typeof parsedState !== 'object') {
                    logger.error('Invalid state format in storage');
                    return null;
                }
                this.state = parsedState;
                logger.debug('Retrieved state from storage');
                return this.state;
            } catch (parseError) {
                logger.error('Failed to parse state from storage:', parseError);
                return null;
            }
        } catch (error) {
            logger.error('Failed to get state:', error);
            return null;
        }
    }

    async setState(updates) {
        console.log('Updating state with:', updates);
        
        const oldState = { ...this.state };
        
        try {
            // Update state
            this.state = {
                ...this.state,
                ...updates
            };

            // Save to localStorage
            localStorage.setItem(assessmentManager.STORAGE_KEYS.STATE, JSON.stringify(this.state));
            console.log('State saved successfully:', this.state);

            // Notify listeners if we have any
            this.notifyListeners(oldState, this.state);

        } catch (error) {
            logger.error('Failed to update state:', {
                error: error.message,
                stack: error.stack,
                oldState,
                attemptedUpdates: updates
            });
            
            // Revert to old state
            this.state = oldState;
            throw error;
        }

        return this.state;
    }

    getLastSection() {
        return this.state.lastSection;
    }

    async setLastSection(section) {
        try {
            // Save current section as last section
            const lastSection = this.state.currentSection;
            
            // Update state
            await this.setState({
                lastSection,
                currentSection: section
            });
            
            logger.debug('Section transition:', { from: lastSection, to: section });
        } catch (error) {
            logger.error('Failed to set last section:', error);
            throw error;
        }
    }

    getDemographics() {
        return this.state.demographics;
    }

    setDemographics(data) {
        this.setState({ demographics: data });
    }

    getAnswers() {
        return [...this.state.answers];
    }

    setAnswer(questionIndex, value) {
        const answers = [...this.state.answers];
        answers[questionIndex] = value;
        this.setState({ answers });
    }

    getCurrentQuestion() {
        return this.state.currentQuestion;
    }

    setCurrentQuestion(index) {
        this.setState({ currentQuestion: index });
    }

    getAutoAdvance() {
        return this.state.autoAdvance;
    }

    setAutoAdvance(enabled) {
        this.setState({ autoAdvance: enabled });
    }

    hasState() {
        return this.state.demographics !== null || this.state.answers.length > 0;
    }

    // Save state to local storage
    async saveState() {
        try {
            const serializedState = JSON.stringify(this.state);
            localStorage.setItem(assessmentManager.STORAGE_KEYS.STATE, serializedState);
            
            logger.debug('State saved to storage', {
                state: this.state
            });
            
            return true;
        } catch (error) {
            logger.error('Failed to save state:', {
                error: error.message,
                stack: error.stack,
                state: this.state
            });
            return false;
        }
    }

    // Load state from local storage
    async loadState() {
        try {
            const serializedState = localStorage.getItem(assessmentManager.STORAGE_KEYS.STATE);
            if (!serializedState) {
                logger.debug('No saved state found');
                return false;
            }

            const loadedState = JSON.parse(serializedState);
            this.setState(loadedState);
            
            logger.debug('State loaded from storage', {
                state: this.state
            });
            
            return true;
        } catch (error) {
            logger.error('Failed to load state:', {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    // Clear saved state
    async clearState() {
        console.log('Clearing state');
        try {
            localStorage.removeItem(assessmentManager.STORAGE_KEYS.STATE);
            localStorage.removeItem(assessmentManager.STORAGE_KEYS.DATA);
            
            // Reset to initial state
            this.setState({
                isInitialized: false,
                isTransitioning: false,
                currentSection: 'welcomeSection',
                demographics: null,
                answers: {},
                currentQuestion: 0,
                autoAdvance: false,
                startTime: null,
                completedAt: null,
                scores: null,
                quality: null,
                lastAnswerTimestamp: null
            });
            
            logger.debug('State cleared');
            return true;
        } catch (error) {
            logger.error('Failed to clear state:', {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    // State change listeners
    addListener(callback) {
        this.listeners.add(callback);
        logger.debug('State listener added', {
            listenerCount: this.listeners.size
        });
    }

    removeListener(callback) {
        this.listeners.delete(callback);
        logger.debug('State listener removed', {
            listenerCount: this.listeners.size
        });
    }

    notifyListeners(oldState, newState) {
        this.listeners.forEach(listener => {
            try {
                listener(oldState, newState);
            } catch (error) {
                logger.error('Error in state change listener:', {
                    error: error.message,
                    stack: error.stack,
                    oldState,
                    newState
                });
            }
        });
    }
}

// Create and export singleton instance
const stateManager = new StateManager();

// Add force reset method
stateManager.forceReset = async function() {
    try {
        // Clear all storage
        sessionStorage.clear();
        localStorage.clear();
        
        // Reset to initial state
        this.state = {
            currentSection: 'welcomeSection',
            demographics: null,
            answers: {},
            currentQuestion: 0,
            autoAdvance: false,
            isTransitioning: false,
            startTime: null,
            completedAt: null,
            scores: null,
            quality: null,
            lastAnswerTimestamp: null
        };
        
        // Update UI
        this.updateSectionVisibility();
        
        logger.info('State forcefully reset');
        return true;
    } catch (error) {
        logger.error('Failed to force reset state:', error);
        throw error;
    }
};

export default stateManager; 