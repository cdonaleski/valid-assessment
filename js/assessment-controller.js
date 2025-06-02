/**
 * VALID Assessment Controller
 * Manages the complete assessment flow and integrates all components
 */

import { logger, performance, network, session } from './test-utils.js';
import { calculateScores, determinePersona } from './scoring.js';
import { generateReport } from './reports.js';
import { validateEmail, sendEmail } from './email.js';

class AssessmentController {
    constructor() {
        this.currentSection = 0;
        this.answers = [];
        this.demographics = null;
        this.startTime = null;
        this.lastSaveQuestion = 0;
        
        // Initialize components
        this.initializeComponents();
        this.setupEventListeners();
        this.checkPreviousSession();
    }

    async initializeComponents() {
        try {
            performance.startTimer('init');
            
            // Check network connection
            const networkStatus = await network.checkConnection();
            if (!networkStatus.online) {
                this.showError('No internet connection. Please check your connection and try again.');
                return;
            }

            // Initialize UI components
            this.initializeUI();
            
            // Load questions from database
            await this.loadQuestions();
            
            performance.endTimer('init');
            logger.info('Controller', 'Components initialized', performance.getMetrics());
        } catch (error) {
            logger.error('Controller', 'Initialization failed', error);
            this.showError('Failed to initialize assessment. Please refresh the page.');
        }
    }

    initializeUI() {
        // Initialize progress bar
        this.progressBar = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        
        // Initialize section containers
        this.sections = {
            demographics: document.getElementById('demographics'),
            assessment: document.getElementById('assessment'),
            results: document.getElementById('results')
        };

        // Initialize buttons
        this.nextButton = document.querySelector('.btn-next');
        this.prevButton = document.querySelector('.btn-prev');
        this.submitButton = document.querySelector('.btn-submit');

        // Initialize error container
        this.errorContainer = document.querySelector('.error-message');
    }

    setupEventListeners() {
        // Navigation buttons
        this.nextButton?.addEventListener('click', () => this.nextSection());
        this.prevButton?.addEventListener('click', () => this.previousSection());
        this.submitButton?.addEventListener('click', () => this.submitAssessment());

        // Answer inputs
        document.querySelectorAll('.scale-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleAnswer(e));
        });

        // Network status changes
        document.addEventListener('networkStatusChange', (e) => {
            this.handleNetworkChange(e.detail.isOnline);
        });

        // Form inputs
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => this.validateCurrentSection());
        });
    }

    async checkPreviousSession() {
        if (session.loadSession()) {
            const savedData = session.sessionData;
            if (savedData.has('answers') || savedData.has('demographics')) {
                const resume = await this.showConfirmDialog(
                    'Previous session found. Would you like to resume?'
                );
                
                if (resume) {
                    this.restoreSession(savedData);
                } else {
                    session.clearSession();
                }
            }
        }
    }

    async loadQuestions() {
        try {
            performance.startTimer('loadQuestions');
            
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;

            this.questions = data;
            this.renderQuestions();

            performance.endTimer('loadQuestions');
            logger.info('Controller', 'Questions loaded', { count: data.length });
        } catch (error) {
            logger.error('Controller', 'Failed to load questions', error);
            throw error;
        }
    }

    renderQuestions() {
        const container = document.querySelector('.question-container');
        container.innerHTML = this.questions.map((q, i) => `
            <div class="question" data-index="${i}" style="display: none;">
                <h3 class="question-text">${q.text}</h3>
                <div class="scale-container">
                    <div class="scale-labels">
                        <span>Strongly Disagree</span>
                        <span>Strongly Agree</span>
                    </div>
                    <div class="scale-buttons">
                        ${[1,2,3,4,5].map(value => `
                            <button class="scale-button" data-value="${value}">
                                ${value}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        this.showQuestion(0);
    }

    showQuestion(index) {
        document.querySelectorAll('.question').forEach(q => q.style.display = 'none');
        document.querySelector(`.question[data-index="${index}"]`).style.display = 'block';
        this.updateProgress();
    }

    async handleAnswer(event) {
        const value = parseInt(event.target.dataset.value);
        const questionIndex = parseInt(
            event.target.closest('.question').dataset.index
        );

        // Update answer
        this.answers[questionIndex] = value;
        
        // Update UI
        this.updateAnswerUI(questionIndex, value);
        
        // Auto-save every 5 questions
        if (questionIndex - this.lastSaveQuestion >= 5) {
            await this.saveProgress();
            this.lastSaveQuestion = questionIndex;
        }

        // Auto-advance to next question
        if (questionIndex < this.questions.length - 1) {
            setTimeout(() => this.showQuestion(questionIndex + 1), 300);
        }
    }

    updateAnswerUI(questionIndex, value) {
        const question = document.querySelector(`.question[data-index="${questionIndex}"]`);
        question.querySelectorAll('.scale-button').forEach(button => {
            button.classList.toggle(
                'selected',
                parseInt(button.dataset.value) === value
            );
        });
    }

    async saveProgress() {
        try {
            performance.startTimer('saveProgress');
            
            const saveData = {
                answers: this.answers,
                demographics: this.demographics,
                lastQuestion: this.currentQuestion,
                timestamp: new Date().toISOString()
            };

            // Save to session
            session.sessionData.set('progress', saveData);
            session.saveSession();

            // Save to database if online
            if (network.isOnline) {
                const { error } = await supabase
                    .from('assessment_progress')
                    .upsert({
                        user_id: this.demographics?.email,
                        progress: saveData
                    });

                if (error) throw error;
            }

            performance.endTimer('saveProgress');
            logger.debug('Controller', 'Progress saved');
        } catch (error) {
            logger.error('Controller', 'Failed to save progress', error);
            // Continue without saving - don't interrupt user
        }
    }

    async submitAssessment() {
        try {
            if (!this.validateAssessment()) {
                return;
            }

            performance.startTimer('submit');
            
            // Calculate scores
            const scores = calculateScores(this.answers);
            const persona = determinePersona(scores);

            // Generate report
            const report = await generateReport(scores, persona, this.demographics);

            // Save results
            const { error } = await supabase
                .from('assessments')
                .insert({
                    user_id: this.demographics.email,
                    scores,
                    persona,
                    demographics: this.demographics,
                    completed_at: new Date().toISOString()
                });

            if (error) throw error;

            // Send email
            if (this.demographics.email) {
                await this.sendResults(this.demographics.email, report);
            }

            // Clear session
            session.clearSession();

            // Show results
            this.showResults(scores, persona);

            performance.endTimer('submit');
            logger.info('Controller', 'Assessment completed', performance.getMetrics());
        } catch (error) {
            logger.error('Controller', 'Submission failed', error);
            this.showError('Failed to submit assessment. Please try again.');
        }
    }

    validateAssessment() {
        // Check demographics
        if (!this.demographics || !this.validateDemographics()) {
            this.showError('Please complete all demographic information.');
            return false;
        }

        // Check answers
        if (this.answers.length !== this.questions.length || 
            this.answers.some(a => !a)) {
            this.showError('Please answer all questions.');
            return false;
        }

        return true;
    }

    validateDemographics() {
        const required = ['role', 'industry', 'experience'];
        return required.every(field => 
            this.demographics[field] && 
            this.demographics[field].trim() !== ''
        );
    }

    async sendResults(email, report) {
        try {
            if (!validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            await sendEmail(email, report);
            logger.info('Controller', 'Results email sent', { email });
        } catch (error) {
            logger.error('Controller', 'Failed to send results email', error);
            this.showError('Failed to send results email. You can download the report instead.');
        }
    }

    showResults(scores, persona) {
        // Hide assessment
        this.sections.assessment.style.display = 'none';
        
        // Show results section
        this.sections.results.style.display = 'block';
        
        // Update results content
        this.updateResultsUI(scores, persona);
    }

    updateResultsUI(scores, persona) {
        // Update persona header
        document.querySelector('.persona-name').textContent = persona.name;
        document.querySelector('.persona-description').textContent = persona.description;

        // Update score chart
        this.updateScoreChart(scores);

        // Update insights
        this.updateInsights(persona);
    }

    showError(message) {
        this.errorContainer.textContent = message;
        this.errorContainer.style.display = 'block';
        
        setTimeout(() => {
            this.errorContainer.style.display = 'none';
        }, 5000);
    }

    async showConfirmDialog(message) {
        return new Promise(resolve => {
            const result = window.confirm(message);
            resolve(result);
        });
    }

    handleNetworkChange(isOnline) {
        const status = document.querySelector('.network-status');
        if (isOnline) {
            status.textContent = 'Connected';
            status.classList.remove('offline');
            this.saveProgress(); // Attempt to sync any unsaved progress
        } else {
            status.textContent = 'Offline - Progress will be saved locally';
            status.classList.add('offline');
        }
    }

    updateProgress() {
        const progress = (this.currentQuestion + 1) / this.questions.length * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
    }
}

// Initialize controller
const controller = new AssessmentController();
export default controller; 