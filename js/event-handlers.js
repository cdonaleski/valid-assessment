import { logger } from './logger.js';
import assessmentManager from './assessment-manager.js';
import stateManager from './state-manager.js';
import { showError } from './utils.js';
import { validateDemographics } from './validation.js';
import { calculateResults } from './scoring.js';

// Helper function to transition between sections
async function transitionToSection(fromSection, toSection) {
    try {
        logger.debug('Starting section transition:', { from: fromSection, to: toSection });
        
        // Update state first
        await stateManager.setState({
            currentSection: toSection,
            isTransitioning: true
        });
        
        // Log sections before update
        const sectionsBeforeUpdate = Array.from(document.querySelectorAll('.assessment-section')).map(section => ({
            id: section.id,
            isActive: section.classList.contains('active')
        }));
        logger.debug('Sections before update:', sectionsBeforeUpdate);
        
        // Then update UI
        document.querySelectorAll('.assessment-section').forEach(section => {
            section.classList.remove('active');
            logger.debug(`Removed active class from section: ${section.id}`);
        });
        
        const targetSection = document.getElementById(toSection);
        logger.debug('Target section found:', { exists: !!targetSection });
        
        if (!targetSection) {
            throw new Error(`Target section not found: ${toSection}`);
        }
        
        targetSection.classList.add('active');
        logger.debug(`Added active class to section: ${toSection}`);
        
        // Log sections after update
        const sectionsAfterUpdate = Array.from(document.querySelectorAll('.assessment-section')).map(section => ({
            id: section.id,
            isActive: section.classList.contains('active')
        }));
        logger.debug('Sections after update:', sectionsAfterUpdate);
        
        // Update state
        await stateManager.setState({
            isTransitioning: false
        });
    } catch (error) {
        logger.error('Failed to transition sections:', error);
        throw error;
    }
}

// Helper function to cleanup event handlers
function cleanupEventHandlers() {
    try {
        logger.debug('Cleaning up event handlers');
        
        // Remove start button handler
        const startButton = document.getElementById('startAssessment');
        if (startButton) {
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newStartButton, startButton);
        }
        
        // Remove demographics form handler
        const demographicsForm = document.getElementById('demographicsForm');
        if (demographicsForm) {
            const newDemographicsForm = demographicsForm.cloneNode(true);
            demographicsForm.parentNode.replaceChild(newDemographicsForm, demographicsForm);
        }
        
        // Remove begin assessment button handler
        const beginAssessmentButton = document.getElementById('beginAssessmentButton');
        if (beginAssessmentButton) {
            const newBeginAssessmentButton = beginAssessmentButton.cloneNode(true);
            beginAssessmentButton.parentNode.replaceChild(newBeginAssessmentButton, beginAssessmentButton);
        }
        
        logger.debug('Event handlers cleaned up');
    } catch (error) {
        logger.error('Failed to cleanup event handlers:', error);
    }
}

/**
 * VALID Assessment Event Handlers
 * Sets up all event listeners for the assessment interface
 */

export function setupEventHandlers(controller) {
    logger.debug('Setting up event handlers', {
        hasController: !!controller,
        controllerState: controller?.state,
        currentSection: controller?.currentSection
    });

    try {
        // Setup copy buttons
        setupCopyButtons();

        // Setup start button
        setupStartButton(controller);

        // Setup other buttons
        setupBackButton(controller);
        setupSaveButton(controller);
        setupResumeButton(controller);
        setupBeginAssessmentButton(controller);

        // Setup forms
        setupDemographicsForm(controller);
        setupResumeForm(controller);

        // Setup navigation buttons
        setupNavigationButtons(controller);

        // Setup scale buttons and auto-advance
        setupScaleButtons(controller);
        setupAutoAdvance(controller);

        // Setup scenario selector
        setupScenarioSelector(controller);

        logger.debug('Event handlers setup complete', {
            elements: {
                startButton: !!document.getElementById('startAssessment'),
                backButton: !!document.getElementById('backButton'),
                saveButton: !!document.getElementById('saveProgressBtn'),
                resumeButton: !!document.getElementById('resumeAssessment'),
                demographicsForm: !!document.getElementById('demographicsForm'),
                resumeForm: !!document.getElementById('resumeForm'),
                beginAssessmentButton: !!document.getElementById('beginAssessmentButton'),
                scaleButtons: document.querySelectorAll('.scale-button').length,
                autoAdvanceToggle: !!document.getElementById('autoAdvance'),
                scenarioSelector: !!document.querySelector('.scenario-selector select')
            }
        });
    } catch (error) {
        logger.error('Failed to setup event handlers:', {
            error: error.message,
            stack: error.stack
        });
    }
}

function setupStartButton(controller) {
    // Log initial state
    logger.debug('Setting up start button - Initial state', {
        hasController: !!controller,
        controllerState: controller?.state,
        currentSection: controller?.currentSection
    });

    const startButton = document.getElementById('startAssessment');
    const quickTestButton = document.getElementById('quickTest');
    
    // Check parent elements
    if (!startButton) {
        logger.error('Start button not found in DOM');
        return;
    }

    // Remove any existing click handlers
    startButton.replaceWith(startButton.cloneNode(true));
    const newStartButton = document.getElementById('startAssessment');

    // Add click handler
    newStartButton.addEventListener('click', async (e) => {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            logger.debug('Start button clicked', {
                timestamp: new Date().toISOString(),
                currentSection: controller?.currentSection,
                isTransitioning: controller?.state?.isTransitioning
            });

            // Disable button to prevent double-clicks
            newStartButton.disabled = true;
            newStartButton.classList.add('loading');

            // Verify controller state
            if (!controller) {
                throw new Error('Controller not initialized');
            }

            // Clear controller state before transitioning
            await controller.stateManager.clearState();

            // Reset state before transitioning
            await controller.stateManager.setState({
                isInitialized: false,
                isTransitioning: false,
                currentSection: 'instructionsSection',
                demographics: null,
                answers: [],
                currentQuestion: 0,
                autoAdvance: false
            });

            // Attempt to show instructions section
            await controller.showSection('instructionsSection');

        } catch (error) {
            logger.error('Failed to start assessment:', {
                error: error.message,
                stack: error.stack,
                controllerState: controller?.state
            });
            showError('Failed to start assessment. Please try again.');
        } finally {
            // Always re-enable button
            newStartButton.disabled = false;
            newStartButton.classList.remove('loading');
        }
    });

    // Setup quick test button if it exists
    if (quickTestButton) {
        quickTestButton.replaceWith(quickTestButton.cloneNode(true));
        const newQuickTestButton = document.getElementById('quickTest');

        newQuickTestButton.addEventListener('click', async (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
                
                logger.debug('Quick test button clicked');
                
                // Disable button to prevent double-clicks
                newQuickTestButton.disabled = true;
                newQuickTestButton.classList.add('loading');

                // Verify controller state
                if (!controller) {
                    throw new Error('Controller not initialized');
                }

                // Reset state before transitioning
                await controller.stateManager.setState({
                    isInitialized: true,
                    isTransitioning: false,
                    currentSection: 'questionsSection',
                    demographics: {
                        department: 'Test',
                        role: 'Test',
                        experience: '0-2',
                        email: 'test@example.com'
                    },
                    answers: [],
                    currentQuestion: 0,
                    autoAdvance: false
                });

                // Skip to questions section
                await controller.showSection('questionsSection');

            } catch (error) {
                logger.error('Failed to start quick test:', error);
                showError('Failed to start quick test. Please try again.');
            } finally {
                newQuickTestButton.disabled = false;
                newQuickTestButton.classList.remove('loading');
            }
        });
    }

    logger.debug('Start button setup complete');
}

// Helper functions
async function updateQuestion() {
    try {
        const state = stateManager.getState();
        const currentQuestion = assessmentManager.getCurrentQuestion();
        
        if (!currentQuestion) {
            throw new Error('No current question available');
        }

        // Update question text
        const questionText = document.getElementById('questionText');
        if (questionText) {
            questionText.textContent = currentQuestion.text;
        }

        // Update progress
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `Question ${state.currentQuestionIndex + 1} of ${state.questions.length}`;
        }

        // Update scale buttons
        const scaleButtons = document.querySelectorAll('.scale-button');
        scaleButtons.forEach(button => {
            const value = parseInt(button.dataset.value);
            button.classList.toggle('selected', state.answers[currentQuestion.id] === value);
            button.classList.remove('disabled');
        });

        // Update navigation buttons
        const prevButton = document.getElementById('prevQuestion');
        const nextButton = document.getElementById('nextQuestion');

        if (prevButton) {
            prevButton.disabled = state.currentQuestionIndex === 0;
        }
        if (nextButton) {
            nextButton.disabled = !state.answers[currentQuestion.id];
        }

        // Update auto-advance toggle
        const autoAdvanceToggle = document.getElementById('autoAdvance');
        if (autoAdvanceToggle) {
            autoAdvanceToggle.checked = state.autoAdvance || false;
        }

        logger.debug('Question updated:', {
            questionId: currentQuestion.id,
            index: state.currentQuestionIndex,
            text: currentQuestion.text,
            hasAnswer: !!state.answers[currentQuestion.id],
            autoAdvance: state.autoAdvance
        });
    } catch (error) {
        logger.error('Failed to update question:', error);
        showError('Failed to update question. Please try again.');
    }
}

async function showSummary() {
    try {
        // Calculate scores
        const state = stateManager.getState();
        const results = await assessmentManager.completeAssessment();

        // Update state
        await stateManager.setState({
            currentSection: 'resultsSection',
            scores: results.scores,
            quality: results.quality,
            completedAt: new Date().toISOString()
        });

        // Show results section
        document.querySelectorAll('.assessment-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) {
            throw new Error('Results section not found');
        }
        
        resultsSection.classList.add('active');
        logger.info('Assessment completed, showing results');
    } catch (error) {
        logger.error('Failed to show summary:', error);
        showError('Failed to complete assessment. Please try again.');
    }
}

// Handle answer selection
async function handleAnswerSelection(value) {
    try {
        const state = stateManager.getState();
        const currentQuestion = assessmentManager.getCurrentQuestion();
        
        if (!currentQuestion) {
            throw new Error('No current question available');
        }

        // Record answer
        await assessmentManager.recordAnswer(value);

        // Update UI
        const scaleButtons = document.querySelector('.scale-buttons');
        scaleButtons.querySelectorAll('.scale-button').forEach(button => {
            const buttonValue = parseInt(button.dataset.value);
            button.classList.toggle('selected', buttonValue === value);
        });
        const nextButton = document.getElementById('nextQuestion');
        nextButton.disabled = false;

        // Handle auto-advance after a short delay
        if (state.autoAdvance && state.currentQuestionIndex < state.questions.length - 1) {
            // Wait longer before auto-advancing to prevent race conditions
            setTimeout(async () => {
                const currentState = stateManager.getState();
                // Only advance if we're still on the same question and not already navigating
                if (currentState.currentQuestionIndex === state.currentQuestionIndex && !currentState.isNavigating) {
                    try {
                        if (currentState.currentQuestionIndex < currentState.questions.length - 1) {
                            await stateManager.setState({
                                currentQuestionIndex: currentState.currentQuestionIndex + 1
                            });
                            await updateQuestion();
                        } else {
                            await showSummary();
                        }
                    } catch (error) {
                        logger.error('Failed to auto-advance:', error);
                    }
                }
            }, 500); // Increased delay to 500ms
        }

        logger.debug('Answer recorded:', {
            questionId: currentQuestion.id,
            value,
            autoAdvance: state.autoAdvance,
            currentIndex: state.currentQuestionIndex
        });
    } catch (error) {
        logger.error('Failed to record answer:', error);
        showError('Failed to save answer. Please try again.');
    }
}

function setupDemographicsForm(controller) {
    const demographicsForm = document.getElementById('demographicsForm');
    logger.debug('Setting up demographics form', {
        exists: !!demographicsForm,
        currentSection: controller?.currentSection
    });

    if (!demographicsForm) {
        logger.error('Demographics form not found in DOM');
        return;
    }

    demographicsForm.addEventListener('submit', async (e) => {
        try {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(demographicsForm);
            
            // Validate form data
            try {
                validateDemographics(Object.fromEntries(formData));
            } catch (validationError) {
                logger.error('Demographics validation failed:', validationError);
                showError(validationError.message);
                return;
            }

            // Disable form during submission
            const submitButton = demographicsForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.classList.add('loading');
            }

            // Log pre-transition state
            logger.debug('Pre-demographics submission state', {
                currentSection: controller.currentSection,
                formData: Object.fromEntries(formData)
            });

            // Submit demographics and show instructions
            await controller.handleDemographicsSubmit(e);

            // Log post-transition state
            logger.debug('Post-demographics submission state', {
                currentSection: controller.currentSection,
                nextSection: 'instructionsSection'
            });

            // Re-enable form
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        } catch (error) {
            logger.error('Failed to submit demographics:', {
                error: error.message,
                stack: error.stack
            });
            showError('Failed to submit demographics. Please try again.');
            
            // Re-enable form on error
            const submitButton = demographicsForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        }
    });

    logger.debug('Demographics form handler attached successfully');
}

function setupResumeForm(controller) {
    const resumeForm = document.getElementById('resumeForm');
    logger.debug('Setting up resume form', {
        exists: !!resumeForm,
        currentSection: controller?.currentSection
    });

    if (!resumeForm) {
        logger.error('Resume form not found in DOM');
        return;
    }

    resumeForm.addEventListener('submit', async (e) => {
        let submitButton;
        try {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(resumeForm);
            const token = formData.get('token')?.trim();
            const email = formData.get('email')?.trim();
            
            logger.debug('Resume form submitted', { token, email });

            // Disable form during submission
            submitButton = resumeForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.classList.add('loading');
            }

            // Validate inputs
            if (!token) {
                throw new Error('Please enter a resume token');
            }
            if (!email) {
                throw new Error('Please enter your email address');
            }
            if (!email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }

            // Attempt to resume assessment
            await controller.resumeAssessment(token, email);

            // Close modal on success
            const resumeModal = document.getElementById('resumeModal');
            if (resumeModal) {
                resumeModal.classList.remove('active');
                setTimeout(() => resumeModal.style.display = 'none', 300);
            }

            // Clear form
            resumeForm.reset();
            return;
        } catch (error) {
            // Show appropriate error message
            let errorMessage = 'Failed to resume assessment. ';
            if (error.message.includes('Token and email are required')) {
                errorMessage += 'Please enter both your token and email address.';
            } else if (error.message.includes('Invalid email') || error.message.includes('Email does not match')) {
                errorMessage += 'The email address does not match the one used to save progress.';
            } else if (error.message.includes('No saved progress found')) {
                errorMessage += 'No saved progress was found for this token and email combination.';
            } else if (error.message.includes('expired')) {
                errorMessage += 'This resume token has expired.';
            } else {
                errorMessage += 'Please check your token and email and try again.';
            }
            
            showError(errorMessage);
            logger.error('Failed to resume assessment:', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            // Always re-enable form
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        }
    });

    logger.debug('Resume form handler attached successfully');
}

function setupNavigationButtons(controller) {
    // Previous/Next Section Buttons
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.btn-next, .btn-prev')) {
            try {
                const isNext = e.target.matches('.btn-next');
                logger.debug(`${isNext ? 'Next' : 'Previous'} navigation button clicked`, {
                    currentSection: controller.currentSection,
                    buttonType: isNext ? 'next' : 'prev'
                });

                // Disable button to prevent double-clicks
                e.target.disabled = true;
                e.target.classList.add('loading');

                // Navigate
                if (isNext) {
                    await controller.nextSection();
                } else {
                    await controller.previousSection();
                }

                // Re-enable button
                e.target.disabled = false;
                e.target.classList.remove('loading');
            } catch (error) {
                logger.error('Failed to navigate:', {
                    error: error.message,
                    stack: error.stack
                });
                showError('Failed to navigate. Please try again.');
                
                // Re-enable button on error
                e.target.disabled = false;
                e.target.classList.remove('loading');
            }
        }
    });

    // Question Navigation
    const prevQuestionBtn = document.getElementById('prevQuestion');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    
    logger.debug('Setting up question navigation', {
        prevExists: !!prevQuestionBtn,
        nextExists: !!nextQuestionBtn
    });

    // Remove existing event listeners by cloning and replacing
    if (prevQuestionBtn) {
        const newPrevBtn = prevQuestionBtn.cloneNode(true);
        prevQuestionBtn.parentNode.replaceChild(newPrevBtn, prevQuestionBtn);
        
        newPrevBtn.addEventListener('click', async () => {
            try {
                logger.debug('Previous question button clicked', {
                    currentQuestion: controller.state.currentQuestion
                });

                newPrevBtn.disabled = true;
                await controller.previousQuestion();
                newPrevBtn.disabled = false;
            } catch (error) {
                logger.error('Failed to navigate to previous question:', {
                    error: error.message,
                    stack: error.stack
                });
                newPrevBtn.disabled = false;
            }
        });
    }

    if (nextQuestionBtn) {
        const newNextBtn = nextQuestionBtn.cloneNode(true);
        nextQuestionBtn.parentNode.replaceChild(newNextBtn, nextQuestionBtn);
        
        newNextBtn.addEventListener('click', async () => {
            try {
                // Only allow advancing if auto-advance is off
                const state = controller.stateManager.getState();
                if (state.autoAdvance) return;

                // Get the current question and answers
                const questions = controller.state.questions || controller.assessmentManager.questions;
                const currentIndex = controller.state.currentQuestion;
                const currentQuestion = questions[currentIndex];

                // Check if we have an answer for the current question
                const hasAnswer = state.answers && state.answers[currentQuestion.id];
                if (!hasAnswer) {
                    logger.debug('Cannot proceed - no answer for current question', {
                        currentQuestionId: currentQuestion.id,
                        answers: state.answers
                    });
                    return;
                }

                newNextBtn.disabled = true;
                await controller.nextQuestion();

                // Re-enable if not at last question
                if (controller.state.currentQuestion < questions.length - 1) {
                    newNextBtn.disabled = false;
                }
            } catch (error) {
                logger.error('Failed to navigate to next question:', error);
                newNextBtn.disabled = false;
                showError('Failed to navigate to next question. Please try again.');
            }
        });
    }
}

function setupScaleButtons(controller) {
    const scaleButtons = document.querySelectorAll('.scale-button');
    logger.debug('Setting up scale buttons', {
        count: scaleButtons.length
    });

    scaleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            try {
                const value = parseInt(button.dataset.value);
                if (isNaN(value)) {
                    throw new Error('Invalid scale value');
                }

                logger.debug('Scale button clicked', {
                    value,
                    currentQuestion: controller.state.currentQuestion
                });

                // Handle response
                await controller.handleResponse(value);

                // Update button states
                scaleButtons.forEach(btn => {
                    const btnValue = parseInt(btn.dataset.value);
                    btn.classList.toggle('selected', btnValue === value);
                });
                // Only enable next button if auto-advance is disabled
                const state = controller.stateManager.getState();
                if (!state.autoAdvance) {
                    const nextButton = document.getElementById("nextQuestion");
                    if (nextButton) {
                        nextButton.disabled = false;
                        logger.debug("Next button enabled (auto-advance disabled)");
                    }
                } else {
                    logger.debug("Auto-advance enabled, next button will be handled automatically");
                }

                logger.debug("Scale button click handled", {
                    selectedValue: value,
                    autoAdvance: state.autoAdvance,
                    nextButtonEnabled: !state.autoAdvance
                });            } catch (error) {
                logger.error('Failed to handle response:', {
                    error: error.message,
                    stack: error.stack
                });
                showError('Failed to record your response. Please try again.');
            }
        });
    });
}

function setupAutoAdvance(controller) {
    const autoAdvanceToggle = document.getElementById('autoAdvance');
    logger.debug('Setting up auto-advance toggle', {
        exists: !!autoAdvanceToggle
    });

    if (autoAdvanceToggle) {
        autoAdvanceToggle.addEventListener('change', (e) => {
            try {
                const enabled = e.target.checked;
                logger.debug('Auto-advance setting changed', {
                    enabled,
                    currentQuestion: controller.state.currentQuestion
                });

                // Update both controller and state manager
                controller.state.autoAdvance = enabled;
                controller.stateManager.setState({ autoAdvance: enabled });
            } catch (error) {
                logger.error('Failed to update auto-advance setting:', {
                    error: error.message,
                    stack: error.stack
                });
                // Revert toggle on error
                e.target.checked = !e.target.checked;
            }
        });
    }
}

function setupBackButton(controller) {
    const backButton = document.getElementById('backButton');
    logger.debug('Setting up back button', {
        exists: !!backButton,
        currentSection: controller?.currentSection
    });

    if (!backButton) {
        logger.error('Back button not found in DOM');
        return;
    }

    backButton.addEventListener('click', async () => {
        try {
            logger.debug('Back button clicked', {
                currentSection: controller.currentSection
            });

            // Disable button to prevent double-clicks
            backButton.disabled = true;
            backButton.classList.add('loading');

            // Go back to previous section
            await controller.previousSection();

            // Re-enable button
            backButton.disabled = false;
            backButton.classList.remove('loading');
        } catch (error) {
            logger.error('Failed to go back:', {
                error: error.message,
                stack: error.stack
            });
            showError('Failed to go back. Please try again.');
            
            // Re-enable button on error
            backButton.disabled = false;
            backButton.classList.remove('loading');
        }
    });

    logger.debug('Back button handler attached successfully');
}

function setupSaveButton(controller) {
    const saveButton = document.getElementById('saveProgressBtn');
    
    if (!saveButton) {
        logger.error('Save progress button not found');
        return;
    }

    saveButton.addEventListener('click', async () => {
        try {
            logger.debug('Save progress button clicked');
            
            // Disable button to prevent double-clicks
            saveButton.disabled = true;
            saveButton.classList.add('loading');

            // Show save modal
            await controller.showSaveModal();

            // Re-enable button
            saveButton.disabled = false;
            saveButton.classList.remove('loading');

            // Setup close button
            const closeButton = document.querySelector('.close-modal');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    const saveModal = document.getElementById('saveModal');
                    saveModal.classList.remove('active');
                    setTimeout(() => saveModal.style.display = 'none', 300);
                });
            }

            // Setup click outside to close
            const saveModal = document.getElementById('saveModal');
            saveModal.addEventListener('click', (e) => {
                if (e.target === saveModal) {
                    saveModal.classList.remove('active');
                    setTimeout(() => saveModal.style.display = 'none', 300);
                }
            });

            // Setup escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const saveModal = document.getElementById('saveModal');
                    saveModal.classList.remove('active');
                    setTimeout(() => saveModal.style.display = 'none', 300);
                }
            }, { once: true });

        } catch (error) {
            logger.error('Failed to save progress:', error);
            showError('Failed to save progress. Please try again.');
            
            // Re-enable button on error
            saveButton.disabled = false;
            saveButton.classList.remove('loading');
        }
    });

    logger.debug('Save button handler attached');
}

function setupResumeButton(controller) {
    const resumeButton = document.getElementById('resumeAssessment');
    logger.debug('Setting up resume button', {
        exists: !!resumeButton,
        currentSection: controller?.currentSection
    });

    if (!resumeButton) {
        logger.error('Resume button not found in DOM');
        return;
    }

    resumeButton.addEventListener('click', async () => {
        try {
            logger.debug('Resume button clicked', {
                currentSection: controller.currentSection
            });

            // Show resume modal
            await controller.showResumeModal();
        } catch (error) {
            logger.error('Failed to show resume modal:', {
                error: error.message,
                stack: error.stack
            });
            showError('Failed to show resume form. Please try again.');
        }
    });

    logger.debug('Resume button handler attached successfully');
}

function setupBeginAssessmentButton(controller) {
    const beginAssessmentButton = document.getElementById('beginAssessmentButton');
    logger.debug('Setting up begin assessment button', {
        exists: !!beginAssessmentButton,
        currentSection: controller?.currentSection
    });

    if (!beginAssessmentButton) {
        logger.error('Begin assessment button not found in DOM');
        return;
    }

    beginAssessmentButton.addEventListener('click', async () => {
        try {
            logger.debug('Begin assessment button clicked', {
                currentSection: controller.currentSection
            });

            // Disable button to prevent double-clicks
            beginAssessmentButton.disabled = true;
            beginAssessmentButton.classList.add('loading');

            // Show token display container when beginning assessment
            const tokenContainer = document.querySelector('.token-display-container');
            if (tokenContainer) {
                tokenContainer.classList.add('show');
                logger.debug('Token display container shown when beginning assessment');
            }
            
            // Show questions section
            await controller.showSection('questionsSection');

            // Re-enable button
            beginAssessmentButton.disabled = false;
            beginAssessmentButton.classList.remove('loading');
        } catch (error) {
            logger.error('Failed to begin assessment:', {
                error: error.message,
                stack: error.stack
            });
            showError('Failed to begin assessment. Please try again.');
            
            // Re-enable button on error
            beginAssessmentButton.disabled = false;
            beginAssessmentButton.classList.remove('loading');
        }
    });

    logger.debug('Begin assessment button handler attached successfully');
}

function setupScenarioSelector(controller) {
    const scenarioSelect = document.querySelector('.scenario-selector select');
    if (!scenarioSelect) {
        logger.debug('Scenario selector not found');
        return;
    }

    scenarioSelect.addEventListener('change', async (event) => {
        try {
            const selectedContext = event.target.value;
            logger.debug('Scenario context changed:', { selectedContext });

            // Get the current state
            const state = stateManager.getState();
            if (!state || !state.answers) {
                throw new Error('No assessment data found');
            }

            // Calculate results with the new context
            const results = calculateResults(state.answers, selectedContext);
            if (!results || !results.scores) {
                throw new Error('Failed to calculate results');
            }

            // Update the radar chart
            const radarChart = document.getElementById('radarChart');
            if (radarChart) {
                // Clear any existing chart
                while (radarChart.firstChild) {
                    radarChart.removeChild(radarChart.firstChild);
                }

                // Create new chart with updated data
                const chartData = {
                    labels: ['Verity', 'Association', 'Lived Experience', 'Institutional', 'Desire'],
                    datasets: [{
                        label: 'Your Scores',
                        data: [
                            results.scores.V,
                            results.scores.A,
                            results.scores.L,
                            results.scores.I,
                            results.scores.D
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                };

                new Chart(radarChart, {
                    type: 'radar',
                    data: chartData,
                    options: {
                        elements: {
                            line: {
                                borderWidth: 3
                            }
                        },
                        scales: {
                            r: {
                                angleLines: {
                                    display: true
                                },
                                suggestedMin: 0,
                                suggestedMax: 100
                            }
                        }
                    }
                });
            }

            // Update score bars
            Object.entries(results.scores).forEach(([dimension, score]) => {
                const barContainer = document.getElementById(`score${dimension}Container`);
                const bar = document.getElementById(`score${dimension}`);
                if (bar && barContainer) {
                    // Update the score value immediately
                    const valueSpan = barContainer.querySelector('.score-value');
                    if (valueSpan) {
                        valueSpan.textContent = `${Math.round(score)}%`;
                    }
                    
                    // Animate the bar fill
                    bar.style.width = `${score}%`;
                }
            });

            // Update persona description
            const personaDescription = document.getElementById('personaDescription');
            if (personaDescription && results.persona) {
                let personaHTML = `
                    <h4>${results.persona.primary}</h4>
                    <p>${results.persona.description}</p>
                `;
                if (results.persona.secondary) {
                    personaHTML += `<p>Secondary style: ${results.persona.secondary}</p>`;
                }
                personaHTML += `<p>Confidence: ${results.confidence.description}</p>`;
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

            logger.info('Results updated for new context:', {
                context: selectedContext,
                scores: results.scores,
                persona: results.persona.primary
            });
        } catch (error) {
            logger.error('Failed to update results for new context:', error);
            showError('Failed to update results for the selected context. Please try again.');
        }
    });
}

function setupCopyButtons() {
    // Setup all copy buttons
    document.querySelectorAll('.copy-token, .btn-icon').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                // Find the closest token input
                const tokenInput = button.closest('.token-display, .token-display-container')?.querySelector('.token-input');
                if (!tokenInput || !tokenInput.value) {
                    throw new Error('No token to copy');
                }

                // Copy the token
                await navigator.clipboard.writeText(tokenInput.value);

                // Show success state
                button.classList.add('copied');
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.5 11.5L3 8l-1 1 4.5 4.5 9-9-1-1z" fill="currentColor"/>
                    </svg>
                `;

                // Reset after 2 seconds
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = originalHTML;
                }, 2000);

                logger.debug('Token copied to clipboard');
            } catch (error) {
                logger.error('Failed to copy token:', error);
                showError('Failed to copy token to clipboard');
            }
        });
    });
} 