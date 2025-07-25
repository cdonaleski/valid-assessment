/**
 * VALID Assessment Controller
 * Manages the complete assessment flow and integrates all components
 */

import { calculateScores, validateAnswer, calculateResults } from './scoring.js';
import { generatePDF } from './reports.js';
import { StateManager } from './state-manager.js';
import { setupEventHandlers } from './event-handlers.js';
import { logger } from './logger.js';
import { validateEmail, validateDemographics } from './validation.js';
import { showError } from './utils.js';
import validAssessmentData from './questions-data.js';
import assessmentManager from './assessment-manager.js';

export class AssessmentController {
    constructor() {
        logger.debug('Creating AssessmentController instance');
        
        this.stateManager = new StateManager();
        this.assessmentManager = assessmentManager; // Store reference to singleton
        this.currentSection = 'welcomeSection';
        this.sections = [
            'welcomeSection',
            'instructionsSection',
            'questionsSection',
            'summarySection',
            'resultsSection'
        ];

        // Initialize with default state
        const initialState = {
            isInitialized: false,
            isTransitioning: false,
            currentSection: 'welcomeSection',
            demographics: null,
            answers: [],
            currentQuestion: 0,
            autoAdvance: false,
            startTime: null,
            completedAt: null,
            scores: null,
            quality: null,
            lastAnswerTimestamp: null
        };

        // Set initial state in both controller and state manager
        this.state = initialState;
        this.stateManager.setState(initialState);

        this.isAdvancing = false; // Guard for auto-advance
    }

    async init() {
        try {
            // Ensure questions are loaded in assessment manager
            await this.assessmentManager.loadQuestions();

            logger.info('Initializing assessment controller...', {
                currentSection: this.currentSection,
                sections: this.sections
            });
            
            // Test questions availability
            logger.debug('Testing questions availability:', {
                hasValidAssessmentData: !!validAssessmentData,
                hasQuestions: !!validAssessmentData?.questions,
                questionsLength: validAssessmentData?.questions?.length,
                firstQuestion: validAssessmentData?.questions?.[0]?.text
            });
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            // Initialize UI components
            this.initializeUI();
            
            // Setup event handlers
            setupEventHandlers(this);
            
            // Check for in-progress assessment and auto-resume
            await this.checkAndResumeAssessment();
            
            // Show initial section
            await this.showSection(this.currentSection);
            
            // Mark as initialized
            await this.stateManager.setState({ isInitialized: true });
            this.state.isInitialized = true;
            
            logger.success('Assessment controller initialized successfully', {
                currentSection: this.currentSection,
                isInitialized: this.state.isInitialized,
                uiComponents: {
                    startButton: !!document.getElementById('startAssessment'),
                    demographicsForm: !!document.getElementById('demographicsForm')
                }
            });

            // Resume progress from Supabase or local storage
            await this.resumeProgress();

            return this;
        } catch (error) {
            logger.error('Failed to initialize assessment controller:', {
                error: error.message,
                stack: error.stack,
                state: this.state
            });
            throw error;
        }
    }

    initializeUI() {
        try {
            // Initialize UI elements - make them optional
            this.questionNumber = document.getElementById('questionNumber');
            this.questionText = document.getElementById('questionText');
            this.progressText = document.querySelector('.progress-text');
            this.progressFill = document.querySelector('.progress-fill');
            
            // Log which elements are found
            logger.debug('UI elements found:', {
                questionNumber: !!this.questionNumber,
                questionText: !!this.questionText,
                progressText: !!this.progressText,
                progressFill: !!this.progressFill
            });

            // Only initialize question display if elements exist
            if (this.questionNumber && this.questionText && this.progressText && this.progressFill) {
                const totalQuestions = validAssessmentData.questions.length;
                this.questionNumber.textContent = '1';
                this.progressText.textContent = `Question 1 of ${totalQuestions}`;
                this.progressFill.style.width = '0%';

                logger.debug('Question display initialized', {
                    questionNumber: this.questionNumber.textContent,
                    progressText: this.progressText.textContent,
                    totalQuestions
                });
            } else {
                logger.debug('Some UI elements not found, skipping question display initialization');
            }
        } catch (error) {
            logger.error('Failed to initialize UI:', error);
            // Don't throw error - allow initialization to continue
        }
    }

    async showSection(sectionId) {
        try {
            logger.debug('Attempting to show section', {
                targetSection: sectionId,
                currentSection: this.currentSection
            });

            // Validate section ID
            if (!this.sections.includes(sectionId)) {
                throw new Error(`Invalid section ID: ${sectionId}`);
            }

            // Get section elements
            const currentSection = document.getElementById(this.currentSection);
            const targetSection = document.getElementById(sectionId);

            if (!currentSection || !targetSection) {
                logger.error('Section elements not found:', {
                    currentSectionId: this.currentSection,
                    targetSectionId: sectionId,
                    currentSectionExists: !!currentSection,
                    targetSectionExists: !!targetSection
                });
                throw new Error('Section elements not found');
            }

            // Hide all sections first
            document.querySelectorAll('.assessment-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
                section.style.opacity = '0';
            });

            // Show target section
            targetSection.style.display = 'block';
            // Force reflow
            targetSection.offsetHeight;
            targetSection.classList.add('active');
            targetSection.style.opacity = '1';

            // Ensure the section is fully interactive
            targetSection.style.pointerEvents = 'auto';
            targetSection.style.zIndex = '5';

            // Update current section
            this.currentSection = sectionId;
            await this.stateManager.setState({ currentSection: sectionId });

            // Update body data-section attribute
            document.body.dataset.section = sectionId;

            // Handle any section-specific transitions
            this.handleSectionTransition(sectionId);

            // Additional debugging for section visibility
            logger.debug('Section visibility details:', {
                sectionId,
                isVisible: targetSection.classList.contains('active'),
                display: targetSection.style.display,
                opacity: targetSection.style.opacity,
                pointerEvents: targetSection.style.pointerEvents,
                zIndex: targetSection.style.zIndex,
                computedDisplay: window.getComputedStyle(targetSection).display,
                computedOpacity: window.getComputedStyle(targetSection).opacity,
                computedPointerEvents: window.getComputedStyle(targetSection).pointerEvents
            });

        } catch (error) {
            logger.error('Failed to show section:', {
                error: error.message,
                stack: error.stack,
                sectionId,
                currentSection: this.currentSection
            });
            throw error;
        }
    }

    handleSectionTransition(sectionId) {
        switch (sectionId) {
            case 'questionsSection':
                // Ensure state is properly initialized when entering questions section
                const currentState = this.stateManager.getState();
                if (!currentState || !currentState.isInitialized) {
                    logger.debug('Initializing assessment state for questions section');
                    
                    // Create a proper assessment state
                    const assessmentState = {
                        isInitialized: true,
                        isTransitioning: false,
                        currentSection: 'questionsSection',
                        demographics: currentState?.demographics || {
                            email: 'anonymous@valid.local',
                            role: 'anonymous',
                            experience: '1-3',
                            industry: 'other'
                        },
                        questions: this.assessmentManager.questions || [],
                        answers: currentState?.answers || {},
                        currentQuestion: 0,
                        autoAdvance: false,
                        startTime: new Date().toISOString(),
                        completedAt: null,
                        scores: null,
                        quality: null,
                        lastAnswerTimestamp: null
                    };
                    
                    // Update both controller state and state manager
                    this.state = { ...this.state, ...assessmentState };
                    this.stateManager.setState(assessmentState);
                    
                    logger.info('Assessment state initialized for questions section', {
                        isInitialized: this.state.isInitialized,
                        questionCount: this.state.questions?.length,
                        currentQuestion: this.state.currentQuestion
                    });
                }
                
                // Load the first question
                this.loadQuestion(this.state.currentQuestion || 0);
                break;
            case 'welcomeSection':
                // Hide token display container when returning to welcome
                const tokenContainer = document.querySelector('.token-display-container');
                if (tokenContainer) {
                    tokenContainer.classList.remove('show');
                    logger.debug('Token display container hidden on welcome section');
                }
                break;
            case 'instructionsSection':
                // Ensure begin assessment button is enabled
                const beginBtn = document.getElementById('beginAssessmentButton');
                if (beginBtn) {
                    beginBtn.disabled = false;
                }
                break;
        }
    }

    isValidEmail(email) {
        return validateEmail(email);
    }

    showError(message, elementId = null) {
        let errorContainer;
        
        if (elementId) {
            errorContainer = document.getElementById(elementId);
        } else {
            errorContainer = document.querySelector('.error-message');
        }
        
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            logger.error(message);
        }
    }

    nextSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex < this.sections.length - 1) {
            this.showSection(this.sections[currentIndex + 1]);
        }
    }

    previousSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex > 0) {
            this.showSection(this.sections[currentIndex - 1]);
        }
    }

    loadQuestion(index) {
        try {
            // Get questions from state manager
            const currentState = this.stateManager.getState();
            let questions = currentState.questions || this.assessmentManager.questions;

            // Defensive fallback: try to recover from assessmentManager if questions are missing
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                if (this.assessmentManager?.questions && Array.isArray(this.assessmentManager.questions) && this.assessmentManager.questions.length > 0) {
                    questions = this.assessmentManager.questions;
                    logger.warn('Recovered questions from assessmentManager in controller.loadQuestion', {
                        recoveredQuestions: questions.length
                    });
                } else {
                    logger.error('Questions not properly loaded in controller.loadQuestion', {
                        questions,
                        stateQuestions: currentState.questions,
                        managerQuestions: this.assessmentManager.questions
                    });
                    throw new Error('Questions not properly loaded');
                }
            }

            logger.debug('Loading question', {
                index,
                totalQuestions: questions.length,
                currentQuestion: this.state.currentQuestion,
                hasQuestions: !!questions,
                questionsFromState: !!currentState.questions,
                questionsFromManager: !!this.assessmentManager.questions
            });

            if (!questions || !Array.isArray(questions)) {
                logger.error('Questions not properly loaded', {
                    questions: questions,
                    stateQuestions: currentState.questions,
                    managerQuestions: this.assessmentManager.questions
                });
                throw new Error('Questions not properly loaded');
            }

            if (index >= 0 && index < questions.length) {
                const question = questions[index];
                this.state.currentQuestion = index;

                // Update state manager
                this.stateManager.setState({
                    currentQuestion: index
                });

                // Update question number displays
                const currentNumber = index + 1;
                const totalQuestions = questions.length;
                
                this.questionNumber.textContent = currentNumber;
                this.progressText.textContent = `Question ${currentNumber} of ${totalQuestions}`;
                this.progressFill.style.width = `${(currentNumber / totalQuestions) * 100}%`;

                // Update question text
                this.questionText.textContent = question.text;

                // Get current state from state manager
                const hasAnswer = currentState.answers && currentState.answers[index.toString()];

                // Update next button state based on auto-advance setting and answer existence
                const nextButton = document.getElementById('nextQuestion');
                if (nextButton) {
                    if (currentState.autoAdvance) {
                        nextButton.disabled = true;
                    } else {
                        const hasAnswer = currentState.answers && currentState.answers[question.id];
                        nextButton.disabled = !hasAnswer;
                    }
                }

                // First reset all buttons to default state
                document.querySelectorAll('.scale-button').forEach(button => {
                    button.classList.remove('selected');
                });

                // Then only set selected state for the answered value if it exists
                if (hasAnswer) {
                    const selectedButton = document.querySelector(`.scale-button[data-value="${hasAnswer}"]`);
                    if (selectedButton) {
                        selectedButton.classList.add('selected');
                    }
                }

                logger.debug('Question loaded successfully', {
                    questionNumber: currentNumber,
                    totalQuestions: totalQuestions,
                    hasAnswer: hasAnswer,
                    currentState: currentState
                });
            } else {
                throw new Error(`Invalid question index: ${index}`);
            }
        } catch (error) {
            logger.error('Failed to load question:', error);
            showError('Failed to load question. Please try again.');
        }
    }

    handleResponse(value) {
        try {
            logger.debug('Handling response:', { value });
            
            const state = this.stateManager.getState();
            if (!state || !state.isInitialized) {
                logger.error('Cannot handle response: assessment not initialized', {
                    hasState: !!state,
                    isInitialized: state?.isInitialized,
                    currentSection: state?.currentSection
                });
                
                // Try to initialize the assessment if we're in the questions section
                if (state?.currentSection === 'questionsSection') {
                    logger.info('Attempting to initialize assessment from handleResponse');
                    this.handleSectionTransition('questionsSection');
                    
                    // Try again after initialization
                    const newState = this.stateManager.getState();
                    if (newState && newState.isInitialized) {
                        logger.info('Assessment initialized successfully, retrying response handling');
                        this.handleResponse(value);
                        return;
                    }
                }
                
                showError('Assessment not properly initialized. Please refresh the page and try again.');
                return;
            }

            const currentQuestionIndex = state.currentQuestion || 0;
            const questions = state.questions || this.assessmentManager.questions;
            const currentQuestion = questions[currentQuestionIndex];
            
            if (!currentQuestion) {
                logger.error('No current question found', {
                    currentQuestionIndex,
                    questionsLength: questions?.length,
                    questions: questions
                });
                showError('Question not found. Please refresh the page.');
                return;
            }

            // Update answers
            const updatedAnswers = {
                ...state.answers,
                [currentQuestion.id]: value
            };

            // Update state
            const updatedState = {
                ...state,
                answers: updatedAnswers,
                currentQuestion: currentQuestionIndex,
                lastAnswerTimestamp: new Date().toISOString()
            };

            this.stateManager.setState(updatedState);
            this.state = { ...this.state, ...updatedState };

            // Save progress after each answer
            this.saveProgress();

            logger.info('Response recorded and progress saved:', {
                questionId: currentQuestion.id,
                value: value,
                answersCount: Object.keys(updatedAnswers).length,
                currentQuestion: currentQuestionIndex,
                autoAdvance: state.autoAdvance
            });

            // Only auto-advance if the setting is enabled
            if (state.autoAdvance) {
                if (this.isAdvancing) return; // Prevent double-advance
                this.isAdvancing = true;
                logger.debug('Auto-advance enabled, moving to next question');
                setTimeout(() => {
                    this.nextQuestion();
                    this.isAdvancing = false;
                }, 500);
            } else {
                logger.debug('Auto-advance disabled, staying on current question');
                // Enable Next button since we now have an answer
                const nextButton = document.getElementById('nextQuestion');
                if (nextButton) {
                    nextButton.disabled = false;
                    logger.debug('Next button enabled (auto-advance disabled, answer recorded)');
                }
                // Update the UI to show the answer was recorded
                this.updateQuestionDisplay();
            }

        } catch (error) {
            logger.error('Error handling response:', error);
            showError('Failed to record your answer. Please try again.');
        }
    }

    nextQuestion() {
        try {
            const currentState = this.stateManager.getState();
            const questions = currentState.questions || this.assessmentManager.questions;
            
            if (!currentState || !currentState.isInitialized) {
                logger.error('Cannot advance to next question: assessment not initialized');
                return;
            }
            
            if (currentState.currentQuestion < questions.length - 1) {
                const nextIndex = currentState.currentQuestion + 1;
                
                // Update state manager first
                this.stateManager.setState({
                    currentQuestion: nextIndex,
                    isTransitioning: true
                });

                // Load the next question
                this.loadQuestion(nextIndex);

                // Clear transition flag
                this.stateManager.setState({
                    isTransitioning: false
                });

                logger.debug('Moved to next question', {
                    previousQuestion: currentState.currentQuestion,
                    currentQuestion: nextIndex,
                    totalQuestions: questions.length,
                    state: this.stateManager.getState()
                });
            } else {
                logger.debug('Already at last question', {
                    currentQuestion: currentState.currentQuestion,
                    totalQuestions: questions.length
                });
                
                // Complete the assessment
                this.completeAssessment();
            }
        } catch (error) {
            logger.error('Failed to move to next question:', error);
            showError('Failed to navigate to next question. Please try again.');
            
            // Clear transition flag on error
            this.stateManager.setState({
                isTransitioning: false
            });
        }
    }

    previousQuestion() {
        try {
            const currentState = this.stateManager.getState();
            
            if (!currentState || !currentState.isInitialized) {
                logger.error('Cannot go to previous question: assessment not initialized');
                return;
            }
            
            if (currentState.currentQuestion > 0) {
                const previousIndex = currentState.currentQuestion - 1;
                this.loadQuestion(previousIndex);
                
                // Update state manager
                this.stateManager.setState({
                    currentQuestion: previousIndex
                });
                
                logger.debug('Moved to previous question', {
                    previousQuestion: currentState.currentQuestion,
                    currentQuestion: previousIndex,
                    totalQuestions: currentState.questions?.length
                });
            } else {
                logger.debug('Already at first question', {
                    currentQuestion: currentState.currentQuestion,
                    totalQuestions: currentState.questions?.length
                });
            }
        } catch (error) {
            logger.error('Failed to move to previous question:', error);
            showError('Failed to navigate to previous question. Please try again.');
        }
    }

    // Save progress using the new state manager
    async saveProgress() {
        try {
            const currentState = this.stateManager.getState();
            if (!currentState || !currentState.isInitialized) {
                logger.warn('No valid state to save');
                return;
            }

            // --- Universal Save Logic ---
            // 1. Check if user is signed in via Supabase
            if (window.supabase && window.supabase.auth) {
                const { data: { user } } = await window.supabase.auth.getUser();
                if (user && user.id) {
                    // User is signed in, save to Supabase
                    try {
                        const { error } = await window.supabase
                            .from('user_assessment_progress')
                            .upsert({
                                user_id: user.id,
                                progress: currentState,
                                updated_at: new Date().toISOString()
                            }, { onConflict: ['user_id'] });
                        if (error) {
                            logger.error('Failed to save progress to Supabase:', error);
                        } else {
                            logger.info('Progress saved to Supabase for user:', user.id);
                        }
                    } catch (err) {
                        logger.error('Supabase save error:', err);
                    }
                    return;
                }
            }

            // 2. Fallback: Save to local storage (demo/offline)
            const success = window.assessmentStateManager.saveAssessmentState(currentState);
            if (success) {
                logger.info('Progress saved successfully via state manager (local storage)');
            } else {
                logger.warn('Failed to save progress via state manager (local storage)');
            }
        } catch (error) {
            logger.error('Failed to save progress:', error);
        }
    }

    async showSaveModal() {
        try {
            logger.debug('Showing save modal');
            
            // Check if user is logged in
            const demoUser = localStorage.getItem('demoUser');
            const isLoggedIn = demoUser || (window.supabase && window.supabase.auth && window.supabase.auth.getUser);
            
            if (!isLoggedIn) {
                // Show sign-in prompt instead of save modal
                this.assessmentManager.showSignInPrompt();
                return;
            }
            
            // Get current state
            const state = this.stateManager.getState();
            if (!state || !state.demographics?.email) {
                throw new Error('Cannot save progress: no assessment in progress or missing email');
            }
            
            // Save progress
            const token = await this.assessmentManager.saveProgress(state);
            
            // Show save modal with token
            const saveModal = document.getElementById('saveModal');
            if (saveModal) {
                // Update token input
                const tokenInput = saveModal.querySelector('.token-input');
                if (tokenInput) {
                    tokenInput.value = token;
                }
                
                // Show modal
                saveModal.style.display = 'block';
                setTimeout(() => saveModal.classList.add('active'), 10);
                
                // Setup copy functionality
                const copyButtons = saveModal.querySelectorAll('.copy-token');
                copyButtons.forEach(button => {
                    button.onclick = () => {
                        tokenInput.select();
                        document.execCommand('copy');
                        button.textContent = 'Copied!';
                        setTimeout(() => {
                            button.innerHTML = `
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 0H6C4.9 0 4 0.9 4 2V3H2C0.9 3 0 3.9 0 5V14C0 15.1 0.9 16 2 16H9C10.1 16 11 15.1 11 14V13H13C14.1 13 15 12.1 15 11V2C15 0.9 14.1 0 13 0ZM9 14H2V5H9V14ZM13 11H11V5C11 3.9 10.1 3 9 3H6V2H13V11Z" fill="currentColor"/>
                                </svg>
                            `;
                        }, 2000);
                    };
                });
                
                // Setup close functionality
                const closeButtons = saveModal.querySelectorAll('.close-modal');
                closeButtons.forEach(button => {
                    button.onclick = () => {
                        saveModal.classList.remove('active');
                        setTimeout(() => saveModal.style.display = 'none', 300);
                    };
                });
                
                logger.info('Save modal shown with token:', token);
            } else {
                throw new Error('Save modal element not found');
            }
            
        } catch (error) {
            logger.error('Failed to show save modal:', error);
            throw error;
        }
    }

    async showResumeModal() {
        const resumeModal = document.getElementById('resumeModal');
        if (resumeModal) {
            resumeModal.style.display = 'block';
            resumeModal.classList.add('active');

            // Setup close handlers
            const closeModal = () => {
                resumeModal.classList.remove('active');
                setTimeout(() => {
                    resumeModal.style.display = 'none';
                }, 300);
            };

            // Close button handler
            const closeButton = resumeModal.querySelector('#cancelResume');
            if (closeButton) {
                closeButton.addEventListener('click', closeModal);
            }

            // Click outside handler
            resumeModal.addEventListener('click', (e) => {
                if (e.target === resumeModal) {
                    closeModal();
                }
            });

            // Escape key handler
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });
        }
    }

    async resumeAssessment(token, email) {
        try {
            logger.debug('Attempting to resume assessment', { token, email });

            // Validate inputs
            if (!token || !email) {
                throw new Error('Token and email are required');
            }

            // Basic email validation
            if (!email.includes('@')) {
                throw new Error('Invalid email format');
            }

            // Try to resume assessment
            const success = await this.assessmentManager.resumeAssessment(token, email);
            if (!success) {
                throw new Error('Failed to resume assessment');
            }

            // Show token display container when starting assessment
            const tokenContainer = document.querySelector('.token-display-container');
            if (tokenContainer) {
                tokenContainer.classList.add('show');
                logger.debug('Token display container shown when resuming assessment');
            }
            
            // Show questions section
            await this.showSection('questionsSection');

            // Load the question where the user left off
            const state = this.stateManager.getState();
            let questionIndex = 0;
            if (typeof state.currentQuestion === 'number') {
                questionIndex = state.currentQuestion;
            } else if (typeof state.currentQuestionIndex === 'number') {
                questionIndex = state.currentQuestionIndex;
            }
            this.loadQuestion(questionIndex);

            logger.info('Assessment resumed successfully');
            return true;
        } catch (error) {
            logger.error('Failed to resume assessment:', error);
            throw error;
        }
    }

    async completeAssessment() {
        try {
            logger.info('Completing assessment...');
            
            const state = this.stateManager.getState();
            if (!state || !state.initialized) {
                throw new Error('Cannot complete assessment: no assessment in progress');
            }

            // Calculate results
            const results = await this.calculateResults(state);
            
            // Save results using the new state manager
            if (window.assessmentStateManager) {
                window.assessmentStateManager.saveAssessmentResults(results);
                window.assessmentStateManager.markAssessmentCompleted();
                logger.info('Results saved via state manager');
            }

            // Also save via the old system for backward compatibility
            try {
                await this.assessmentManager.completeAssessment();
                logger.info('Assessment completed via assessment manager');
            } catch (error) {
                logger.warn('Failed to complete via assessment manager:', error);
            }

            // Update state
            await this.stateManager.setState({
                ...state,
                status: 'completed',
                results: results
            });

            // Display results
            await this.displayResults(results);
            
            logger.success('Assessment completed successfully');
            
        } catch (error) {
            logger.error('Failed to complete assessment:', error);
            throw error;
        }
    }

    // Calculate results from assessment state
    async calculateResults(state) {
        try {
            logger.info('Calculating results...');
            
            // Use the assessment manager's scoring logic
            const results = await this.assessmentManager.calculateResults(state);
            
            logger.info('Results calculated successfully:', {
                scores: results.scores,
                persona: results.persona?.primary,
                development: results.development?.area
            });
            
            return results;
        } catch (error) {
            logger.error('Failed to calculate results:', error);
            throw error;
        }
    }

    async displayResults(results) {
        try {
            // Get current state
            const state = this.stateManager.getState();
            if (!state || !state.answers) {
                throw new Error('No assessment data found');
            }

            logger.debug('Displaying results with state:', {
                answersCount: Object.keys(state.answers).length,
                state: state
            });

            // Calculate results
            const results = calculateResults(state.answers);
            if (!results || !results.scores) {
                throw new Error('Failed to calculate results');
            }

            logger.debug('Calculated results:', results);

            // Update radar chart if it exists
            if (window.radarChart) {
                // Update chart data
                window.radarChart.data.datasets[0].data = [
                    results.scores.V,
                    results.scores.A,
                    results.scores.L,
                    results.scores.I,
                    results.scores.D
                ];
                window.radarChart.update();
                
                logger.debug('Updated radar chart with scores:', {
                    scores: results.scores,
                    chartData: window.radarChart.data.datasets[0].data
                });
            } else {
                logger.warn('Radar chart not found');
            }
            
            // Update score bars with animation
            Object.entries(results.scores).forEach(([dimension, score]) => {
                const bar = document.getElementById(`score${dimension}Bar`);
                const valueSpan = document.querySelector(`#score${dimension} .score-value`);
                
                if (bar && valueSpan) {
                    // Set initial width to 0
                    bar.style.width = '0%';
                    
                    // Update the score value immediately
                    valueSpan.textContent = `${Math.round(score)}%`;
                    
                    // Animate the bar fill after a short delay
                    setTimeout(() => {
                        bar.style.width = `${score}%`;
                    }, 100);

                    logger.debug('Updated score bar', {
                        dimension,
                        score,
                        barWidth: bar.style.width,
                        valueText: valueSpan.textContent
                    });
                } else {
                    logger.warn('Score bar elements not found:', {
                        dimension,
                        barId: `score${dimension}Bar`,
                        valueSpanSelector: `#score${dimension} .score-value`
                    });
                }
            });

            // Update persona section
            const personaDescription = document.getElementById('personaDescription');
            if (personaDescription && results.persona) {
                let personaHTML = `
                    <h4>${results.persona.primary}</h4>
                    <p>${results.persona.description}</p>
                `;
                if (results.persona.secondary) {
                    personaHTML += `<p>Secondary style: ${results.persona.secondary}</p>`;
                }
                if (results.confidence) {
                    personaHTML += `<p>Confidence: ${results.confidence.description}</p>`;
                }
                personaDescription.innerHTML = personaHTML;
            }

            // Update development area
            const developmentArea = document.getElementById('developmentArea');
            if (developmentArea && results.development) {
                developmentArea.innerHTML = `
                    <h4>${results.development.area}</h4>
                    <p>${results.development.description}</p>
                `;
            }

            logger.info('Results displayed successfully:', {
                scores: results.scores,
                persona: results.persona?.primary,
                development: results.development?.area
            });
        } catch (error) {
            logger.error('Failed to display results:', error);
            throw error;
        }
    }

    // Check for in-progress assessment and auto-resume
    async checkAndResumeAssessment() {
        try {
            logger.debug('Checking for in-progress assessment...');
            
            // Check for resume flag from dashboard
            if (window.assessmentStateManager && window.assessmentStateManager.checkResumeFlag()) {
                logger.info('Resume flag detected, attempting to resume assessment...');
            }
            
            // Check for current assessment using the new state manager
            if (window.assessmentStateManager) {
                const savedState = window.assessmentStateManager.loadAssessmentState();
                if (savedState && savedState.status !== 'completed') {
                    logger.info('Found in-progress assessment via state manager, resuming...', { 
                        currentQuestion: savedState.currentQuestion || savedState.currentQuestionIndex,
                        answersCount: Object.keys(savedState.answers || {}).length
                    });
                    await this.resumeFromState(savedState);
                    return;
                }
            }
            
            // Fallback to old system for backward compatibility
            const currentAssessment = localStorage.getItem('valid_current_assessment');
            if (currentAssessment) {
                try {
                    const assessment = JSON.parse(currentAssessment);
                    if (assessment && assessment.status !== 'completed') {
                        logger.info('Found in-progress assessment via old system, resuming...', { assessmentId: assessment.id });
                        await this.resumeCurrentAssessment(assessment);
                        return;
                    }
                } catch (error) {
                    logger.warn('Error parsing current assessment:', error);
                }
            }
            
            // Check for saved progress (old system)
            const progressData = localStorage.getItem('valid_assessment_progress');
            if (progressData) {
                try {
                    const progress = JSON.parse(progressData);
                    const latestProgress = Object.values(progress).sort((a, b) => b.timestamp - a.timestamp)[0];
                    
                    if (latestProgress && latestProgress.expiresAt > Date.now()) {
                        logger.info('Found saved progress via old system, resuming...', { 
                            token: latestProgress.token,
                            email: latestProgress.email 
                        });
                        await this.resumeFromProgress(latestProgress);
                        return;
                    }
                } catch (error) {
                    logger.warn('Error parsing saved progress:', error);
                }
            }
            
            logger.debug('No in-progress assessment found');
        } catch (error) {
            logger.error('Error checking for in-progress assessment:', error);
        }
    }

    // Resume from saved state using the new state manager
    async resumeFromState(savedState) {
        try {
            logger.info('Resuming from saved state...', { 
                currentQuestion: savedState.currentQuestion || savedState.currentQuestionIndex,
                answersCount: Object.keys(savedState.answers || {}).length
            });
            
            // Load questions if needed
            await this.assessmentManager.loadQuestions();
            
            // Ensure questions are available
            if (!this.assessmentManager.questions || this.assessmentManager.questions.length === 0) {
                throw new Error('Failed to load questions for assessment resume');
            }
            
            // Set state from saved state
            const state = {
                ...savedState,
                questions: this.assessmentManager.questions,
                isInitialized: true,
                isRestored: true
            };
            
            await this.stateManager.setState(state);
            this.state = { ...this.state, ...state };
            
            // Show questions section
            await this.showSection('questionsSection');
            
            // Load the current question
            const currentQuestion = savedState.currentQuestion || savedState.currentQuestionIndex || 0;
            await this.loadQuestion(currentQuestion);
            
            logger.success('Assessment resumed successfully from state', {
                currentQuestion: currentQuestion,
                answersCount: Object.keys(savedState.answers || {}).length,
                questionsInState: state.questions?.length
            });
            
        } catch (error) {
            logger.error('Failed to resume from state:', error);
            throw error;
        }
    }

    // Resume from current assessment data
    async resumeCurrentAssessment(assessment) {
        try {
            logger.info('Resuming current assessment...', { assessmentId: assessment.id });
            
            // Load questions if needed
            await this.assessmentManager.loadQuestions();
            
            logger.debug('Resuming assessment with questions:', {
                managerQuestionsLength: this.assessmentManager.questions?.length,
                firstQuestion: this.assessmentManager.questions?.[0]?.text
            });
            
            // Ensure questions are available
            if (!this.assessmentManager.questions || this.assessmentManager.questions.length === 0) {
                throw new Error('Failed to load questions for assessment resume');
            }
            
            // Set state from assessment
            const state = {
                assessment: assessment,
                demographics: assessment.demographics,
                currentQuestion: assessment.current_question || 0,
                answers: assessment.answers || {},
                startTime: assessment.created_at || assessment.startTime,
                status: 'in_progress',
                isInitialized: true,
                isRestored: true,
                questions: this.assessmentManager.questions
            };
            
            await this.stateManager.setState(state);
            this.state = { ...this.state, ...state };
            
            // Show questions section
            await this.showSection('questionsSection');
            
            // Load the current question
            await this.loadQuestion(state.currentQuestion);
            
            logger.success('Assessment resumed successfully', {
                currentQuestion: state.currentQuestion,
                answersCount: Object.keys(state.answers).length,
                questionsInState: state.questions?.length
            });
            
        } catch (error) {
            logger.error('Failed to resume current assessment:', error);
            throw error;
        }
    }

    // Resume from saved progress
    async resumeFromProgress(progress) {
        try {
            logger.info('Resuming from saved progress...', { 
                token: progress.token,
                email: progress.email 
            });
            
            // Ensure questions are loaded first
            await this.assessmentManager.loadQuestions();
            
            // Use the assessment manager to load progress
            const state = await this.assessmentManager.loadProgress(progress.token, progress.email);
            
            // Ensure questions are included in the state
            const stateWithQuestions = {
                ...state,
                questions: this.assessmentManager.questions
            };
            
            // Validate that questions are available
            if (!stateWithQuestions.questions || stateWithQuestions.questions.length === 0) {
                throw new Error('Failed to load questions for progress resume');
            }
            
            // Set state
            await this.stateManager.setState(stateWithQuestions);
            this.state = { ...this.state, ...stateWithQuestions };
            
            // Show questions section
            await this.showSection('questionsSection');
            
            // Load the current question
            await this.loadQuestion(state.currentQuestion || state.currentQuestionIndex || 0);
            
            logger.success('Progress resumed successfully', {
                currentQuestion: state.currentQuestion || state.currentQuestionIndex,
                answersCount: Object.keys(state.answers || {}).length,
                questionsInState: stateWithQuestions.questions?.length
            });
            
        } catch (error) {
            logger.error('Failed to resume from progress:', error);
            throw error;
        }
    }

    updateQuestionDisplay() {
        try {
            // Update the question display to show the answer was recorded
            const state = this.stateManager.getState();
            const currentQuestionIndex = state.currentQuestion || 0;
            const questions = state.questions || this.assessmentManager.questions;
            const currentQuestion = questions[currentQuestionIndex];
            
            if (!currentQuestion) {
                logger.error('No current question found for display update');
                return;
            }

            // Update question number and progress
            if (this.questionNumber) {
                this.questionNumber.textContent = currentQuestionIndex + 1;
            }
            
            if (this.progressText) {
                this.progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
            }
            
            if (this.progressFill) {
                const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
                this.progressFill.style.width = `${progressPercentage}%`;
            }

            // Show a brief visual confirmation that the answer was recorded
            const questionContainer = document.querySelector('.question-container');
            if (questionContainer) {
                questionContainer.classList.add('answer-recorded');
                setTimeout(() => {
                    questionContainer.classList.remove('answer-recorded');
                }, 300);
            }

            // Update Next button state based on auto-advance setting
            const nextButton = document.getElementById('nextQuestion');
            if (nextButton) {
                if (state.autoAdvance) {
                    // Auto-advance enabled, always disable Next button
                    nextButton.disabled = true;
                } else {
                    // Auto-advance disabled, enable Next button if we have an answer
                    const hasAnswer = state.answers && state.answers[currentQuestion.id];
                    nextButton.disabled = !hasAnswer;
                }
            }

            logger.debug('Question display updated', {
                questionNumber: currentQuestionIndex + 1,
                totalQuestions: questions.length,
                progressPercentage: ((currentQuestionIndex + 1) / questions.length) * 100
            });
        } catch (error) {
            logger.error('Failed to update question display:', error);
        }
    }

    // Resume progress from Supabase or local storage
    async resumeProgress() {
        // 1. Check if user is signed in via Supabase
        if (window.supabase && window.supabase.auth) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user && user.id) {
                // User is signed in, try to fetch progress from Supabase
                try {
                    const { data, error } = await window.supabase
                        .from('user_assessment_progress')
                        .select('progress')
                        .eq('user_id', user.id)
                        .single();
                    if (error) {
                        logger.warn('No Supabase progress found or error:', error);
                    } else if (data && data.progress) {
                        logger.info('Loaded progress from Supabase for user:', user.id);
                        // Set currentQuestion to first unanswered
                        const progress = data.progress;
                        const questions = progress.questions || [];
                        const answers = progress.answers || {};
                        let firstUnanswered = 0;
                        for (let i = 0; i < questions.length; i++) {
                            if (!answers[questions[i].id]) {
                                firstUnanswered = i;
                                break;
                            } else {
                                firstUnanswered = i + 1;
                            }
                        }
                        progress.currentQuestion = Math.min(firstUnanswered, questions.length - 1);
                        this.stateManager.setState(progress);
                        this.state = { ...this.state, ...progress };
                        return true;
                    }
                } catch (err) {
                    logger.error('Supabase resume error:', err);
                }
            }
        }
        // 2. Fallback: Resume from local storage
        const localState = window.assessmentStateManager.loadAssessmentState();
        if (localState && localState.isInitialized) {
            logger.info('Loaded progress from local storage');
            // Set currentQuestion to first unanswered
            const questions = localState.questions || [];
            const answers = localState.answers || {};
            let firstUnanswered = 0;
            for (let i = 0; i < questions.length; i++) {
                if (!answers[questions[i].id]) {
                    firstUnanswered = i;
                    break;
                } else {
                    firstUnanswered = i + 1;
                }
            }
            localState.currentQuestion = Math.min(firstUnanswered, questions.length - 1);
            this.stateManager.setState(localState);
            this.state = { ...this.state, ...localState };
            return true;
        }
        logger.info('No saved progress found for resume');
        return false;
    }
}