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
            'demographicsSection',
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
    }

    async init() {
        try {
            logger.info('Initializing assessment controller...', {
                currentSection: this.currentSection,
                sections: this.sections
            });
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            // Initialize UI components
            this.initializeUI();
            
            // Setup event handlers
            setupEventHandlers(this);
            
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
            // Initialize UI elements
            this.questionNumber = document.getElementById('questionNumber');
        this.questionText = document.getElementById('questionText');
        this.progressText = document.querySelector('.progress-text');
        this.progressFill = document.querySelector('.progress-fill');
            
            // Validate required elements
            if (!this.questionNumber || !this.questionText || !this.progressText || !this.progressFill) {
                throw new Error('Required UI elements not found');
            }

            // Initialize question display
            const totalQuestions = validAssessmentData.questions.length;
            this.questionNumber.textContent = '1';
            this.progressText.textContent = `Question 1 of ${totalQuestions}`;
            this.progressFill.style.width = '0%';

            logger.debug('UI elements initialized', {
                questionNumber: this.questionNumber.textContent,
                progressText: this.progressText.textContent,
                totalQuestions
            });
        } catch (error) {
            logger.error('Failed to initialize UI:', error);
            throw error;
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

            // Update current section
            this.currentSection = sectionId;
            await this.stateManager.setState({ currentSection: sectionId });

            // Update body data-section attribute
            document.body.dataset.section = sectionId;

            // Handle any section-specific transitions
            this.handleSectionTransition(sectionId);

            logger.info('Section transition complete', {
                currentSection: this.currentSection,
                isVisible: targetSection.classList.contains('active'),
                display: targetSection.style.display,
                opacity: targetSection.style.opacity,
                bodySectionAttribute: document.body.dataset.section
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
                if (!this.state.isInitialized) {
                    this.state = {
                        ...this.state,
                        isInitialized: true,
                        demographics: this.state.demographics || {
                            email: 'anonymous@valid.local',
                            role: 'anonymous',
                            experience: '1-3',
                            industry: 'other'
                        }
                    };
                    // Update state manager
                    this.stateManager.setState(this.state);
                }
                this.loadQuestion(this.state.currentQuestion || 0);
                break;
            case 'demographicsSection':
                // Clear any previous error messages
                document.querySelectorAll('.error-message').forEach(el => {
                    el.textContent = '';
                    el.style.display = 'none';
                });
                // Focus first input if available
                const firstInput = document.querySelector('#demographicsForm input');
                if (firstInput) {
                    firstInput.focus();
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

    async handleDemographicsSubmit(event) {
        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            
            // Validate form data
            if (!this.validateDemographics(data)) {
                return;
            }
            
            // Start assessment with demographics
            const assessmentState = await assessmentManager.startAssessment(data);
            
            // Update controller state
            this.state = {
                ...this.state,
                isInitialized: true,
                isTransitioning: false,
                assessment: {
                    id: assessmentState.id,
                    startTime: assessmentState.startTime
                },
                demographics: data,
                questions: assessmentState.questions,
                answers: [],
                currentQuestion: 0,
                autoAdvance: false,
                startTime: new Date().toISOString(),
                completedAt: null,
                scores: null,
                quality: null,
                lastAnswerTimestamp: null
            };

            // Update state manager
            await this.stateManager.setState(this.state);
            
            // Show instructions section
            await this.showSection('instructionsSection');
            
            logger.info('Demographics submitted and assessment started:', {
                assessmentId: assessmentState.id,
                questionCount: assessmentState.questions.length
            });
        } catch (error) {
            logger.error('Failed to handle demographics submit:', error);
            showError('Failed to start assessment. Please try again.');
        }
    }

    validateDemographics(formData) {
        try {
            validateDemographics(formData);
            return true;
        } catch (error) {
            logger.error('Demographics validation failed:', error);
            this.showError(error.message);
            return false;
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
            const questions = validAssessmentData.questions;
            
            logger.debug('Loading question', {
                index,
                totalQuestions: questions.length,
                currentQuestion: this.state.currentQuestion
            });

            if (!questions || !Array.isArray(questions)) {
                throw new Error('Questions not properly initialized');
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
                const currentState = this.stateManager.getState();
                const hasAnswer = currentState.answers && currentState.answers[index];

                // Update next button state based on whether there's an answer
                const nextButton = document.getElementById('nextQuestion');
                if (nextButton) {
                    nextButton.disabled = !hasAnswer;
                }

                // First reset all buttons to default state
                document.querySelectorAll('.scale-button').forEach(button => {
                    button.classList.remove('selected');
                });

                // Then only set selected state for the answered value if it exists
                if (hasAnswer) {
                    const selectedButton = document.querySelector(`.scale-button[data-value="${hasAnswer.value}"]`);
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
        // Log the response
        logger.response(`Question ${this.state.currentQuestion + 1} Response`, {
            question: this.questionText.textContent,
            response: value,
            timestamp: new Date().toISOString()
        });

            // Initialize answers array if it doesn't exist
            if (!this.state.answers) {
                this.state.answers = [];
            }

            // Save the response in the array at the current question index
            this.state.answers[this.state.currentQuestion] = {
                questionIndex: this.state.currentQuestion,
                value: value,
                timestamp: new Date().toISOString()
            };

            // Update state manager with complete state
            this.stateManager.setState({
                answers: this.state.answers,
                currentQuestion: this.state.currentQuestion,
                lastAnswerTimestamp: new Date().toISOString()
            });

            // Get next question index
            const nextQuestion = this.state.currentQuestion + 1;
            const isLastQuestion = nextQuestion >= validAssessmentData.questions.length;

            // If this is the last question, show completion section after a short delay
            if (isLastQuestion) {
                setTimeout(async () => {
                    try {
                        // Complete the assessment and calculate scores
                        await this.completeAssessment();

                        // Hide questions section and show completion section
                        document.querySelectorAll('.assessment-section').forEach(section => {
                            section.classList.remove('active');
                        });
                        document.getElementById('completionSection').classList.add('active');

                        // Set up event listeners for the completion buttons
                        document.getElementById('viewReportButton').addEventListener('click', async () => {
                            document.querySelectorAll('.assessment-section').forEach(section => {
                                section.classList.remove('active');
                            });
                            document.getElementById('resultsSection').classList.add('active');
                            await this.displayResults();
                        });

                        document.getElementById('downloadReportButton').addEventListener('click', () => {
                            generatePDF();
                        });
                    } catch (error) {
                        logger.error('Failed to complete assessment:', error);
                        showError('Failed to complete the assessment. Please try again.');
                    }
                }, 500);
            } else {
                // Get the current auto-advance state from the checkbox
                const autoAdvanceCheckbox = document.getElementById('autoAdvance');
                const shouldAutoAdvance = autoAdvanceCheckbox && autoAdvanceCheckbox.checked;
                
                // Only auto-advance if the checkbox is checked
                if (shouldAutoAdvance) {
                    setTimeout(() => {
                        this.loadQuestion(nextQuestion);
                    }, 300);
                }
            }
        } catch (error) {
            logger.error('Error handling response:', error);
            showError('Failed to save your answer. Please try again.');
        }
    }

    nextQuestion() {
        try {
            const currentState = this.stateManager.getState();
            
            if (this.state.currentQuestion < this.state.questions.length - 1) {
                const nextIndex = this.state.currentQuestion + 1;
                
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
                    previousQuestion: this.state.currentQuestion - 1,
                    currentQuestion: nextIndex,
                    totalQuestions: this.state.questions.length,
                    state: this.stateManager.getState()
                });
            } else {
                logger.debug('Already at last question', {
                    currentQuestion: this.state.currentQuestion,
                    totalQuestions: this.state.questions.length
                });
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
        if (this.state.currentQuestion > 0) {
            this.loadQuestion(this.state.currentQuestion - 1);
                logger.debug('Moved to previous question', {
                    previousQuestion: this.state.currentQuestion + 1,
                    currentQuestion: this.state.currentQuestion,
                    totalQuestions: this.state.questions.length
                });
            } else {
                logger.debug('Already at first question', {
                    currentQuestion: this.state.currentQuestion,
                    totalQuestions: this.state.questions.length
                });
            }
        } catch (error) {
            logger.error('Failed to move to previous question:', error);
            showError('Failed to navigate to previous question. Please try again.');
        }
    }

    async saveProgress() {
        try {
            const state = this.stateManager.getState();
            if (!state || !state.demographics?.email) {
                throw new Error('Cannot save progress: no assessment in progress or missing email');
            }

            const token = await this.assessmentManager.saveProgress(state);
            return token;
        } catch (error) {
            logger.error('Failed to save progress:', error);
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

            // Show questions section
            await this.showSection('questionsSection');

            logger.info('Assessment resumed successfully');
            return true;
        } catch (error) {
            logger.error('Failed to resume assessment:', error);
            throw error;
        }
    }

    async completeAssessment() {
        try {
            // Calculate scores
            const scores = calculateScores(this.state.answers);

            // Save assessment data
            const assessmentData = {
                scores: scores.scores,
                quality: scores.quality,
                answers: this.state.answers,
                completedAt: new Date().toISOString(),
                demographics: this.state.demographics
            };
            localStorage.setItem(this.assessmentManager.STORAGE_KEYS.DATA, JSON.stringify(assessmentData));

            // Also save to state storage for redundancy
            const currentState = this.stateManager.getState();
            localStorage.setItem(this.assessmentManager.STORAGE_KEYS.STATE, JSON.stringify({
                ...currentState,
                scores: scores.scores,
                quality: scores.quality,
                completedAt: new Date().toISOString()
            }));

            // Create URL hash with encoded results data
            const resultsData = {
                scores: scores.scores,
                quality: scores.quality,
                answers: currentState.answers,
                timestamp: Date.now()
            };
            const encodedData = btoa(JSON.stringify(resultsData));

            logger.info('Assessment completed successfully', {
                scores: scores.scores,
                quality: scores.quality,
                completedAt: new Date().toISOString()
            });

            // Redirect to results page with hash containing results
            window.location.href = `/results.html#results=${encodedData}`;

            return scores;
        } catch (error) {
            logger.error('Failed to complete assessment:', error);
            throw error;
        }
    }

    async displayResults() {
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

    async startAssessment(demographics) {
        try {
            logger.info('Starting assessment with demographics:', demographics);

            // Validate demographics
            if (!this.validateDemographics(demographics)) {
                throw new Error('Invalid demographics data');
            }

            // Initialize assessment state
            const initialState = {
                isInitialized: true,
                isTransitioning: false,
                currentSection: 'questionsSection',
                demographics: demographics,
                answers: [],
                currentQuestion: 0,
                autoAdvance: false,
                startTime: new Date().toISOString(),
                completedAt: null,
                scores: null,
                quality: null,
                lastAnswerTimestamp: null
            };

            // Update state manager
            await this.stateManager.setState(initialState);

            // Ensure state is properly saved to localStorage
            localStorage.setItem(this.assessmentManager.STORAGE_KEYS.STATE, JSON.stringify(initialState));

            // Double check state was saved
            const savedState = this.stateManager.getState();
            if (!savedState || !savedState.isInitialized) {
                throw new Error('Failed to initialize assessment state');
            }

            // Show questions section
            await this.showSection('questionsSection');

            // Load first question
            this.loadQuestion(0);

            logger.info('Assessment started successfully', {
                demographics: demographics,
                questionCount: this.questions?.length || 0,
                state: savedState
            });

            return true;
        } catch (error) {
            logger.error('Failed to start assessment:', error);
            this.showError('Failed to start assessment. Please try again.');
            throw error;
        }
    }

    async showSaveModal() {
        try {
            // Get current state from state manager
            const state = this.stateManager.getState();
            
            // Validate required state - check isInitialized and currentSection
            if (!state || !state.isInitialized || !state.currentSection) {
                logger.error('Invalid state for saving progress:', { state });
                throw new Error('Assessment not properly initialized');
            }

            // Generate and save progress token
            let token;
            try {
                token = await assessmentManager.saveProgress();
                if (!token) {
                    throw new Error('No token returned from saveProgress');
                }
            } catch (error) {
                logger.error('Failed to generate progress token:', error);
                throw new Error('Failed to generate progress token');
            }

            // Get modal elements
            const saveModal = document.getElementById('saveModal');
            if (!saveModal) {
                logger.error('Save modal element not found');
                throw new Error('Save modal element not found');
            }

            const tokenInput = saveModal.querySelector('.token-input');
            if (!tokenInput) {
                logger.error('Token input element not found');
                throw new Error('Token input element not found');
            }

            // Set token value
            tokenInput.value = token;

            // Setup copy button
            const copyButton = saveModal.querySelector('.copy-token');
            if (copyButton) {
                const copyHandler = async () => {
                    try {
                        await navigator.clipboard.writeText(token);
                        copyButton.classList.add('copied');
                        setTimeout(() => copyButton.classList.remove('copied'), 2000);
                    } catch (clipboardError) {
                        logger.warn('Failed to use modern clipboard API, falling back:', clipboardError);
                        try {
                            // Fallback to older clipboard API
                            tokenInput.select();
                            document.execCommand('copy');
                            copyButton.classList.add('copied');
                            setTimeout(() => copyButton.classList.remove('copied'), 2000);
                        } catch (fallbackError) {
                            logger.error('Failed to copy token (fallback):', fallbackError);
                            throw new Error('Failed to copy token to clipboard');
                        }
                    }
                };
                
                // Remove old handler if any
                copyButton.removeEventListener('click', copyHandler);
                // Add new handler
                copyButton.addEventListener('click', copyHandler);
            }

            // Show modal with animation
            saveModal.style.display = 'block';
            // Force reflow
            saveModal.offsetHeight;
            saveModal.classList.add('active');

            // Update header token display
            const headerTokenInput = document.getElementById('headerProgressToken');
            if (headerTokenInput) {
                headerTokenInput.value = token;
            }

            logger.info('Save modal shown successfully', { token });
            return token;
        } catch (error) {
            logger.error('Failed to show save modal:', {
                error: error.message,
                stack: error.stack
            });
            this.showError('Failed to save progress. Please try again.');
            throw error;
        }
    }
}

// Download PDF button handler
// Export the controller
export default AssessmentController; 