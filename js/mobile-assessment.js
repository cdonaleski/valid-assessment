/**
 * Mobile VALID Assessment - Standalone Version
 * Streamlined version with 5 questions per dimension, 1 reverse each
 */

class MobileAssessment {
    constructor() {
        this.currentScreen = 'age';
        this.currentQuestion = 0;
        this.answers = {};
        this.userAge = null;
        this.jobTitle = null;
        this.decisionMaker = null;
        this.consultantReferral = null;
        this.contactInfo = {};
        this.config = null;
        
        // Initialize Supabase client when available
        this.initSupabase();
        
        // Initialize configuration manager
        this.initConfiguration();
        
        // Streamlined questions: 5 per dimension, 1 reverse each
        this.questions = [
            // Verity (5 questions, 1 reverse)
            {
                id: 'verity_1',
                dimension: 'verity',
                text: 'I prefer to verify information from multiple sources before making decisions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'verity_2',
                dimension: 'verity',
                text: 'I often question assumptions and seek evidence to support claims',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'verity_3',
                dimension: 'verity',
                text: 'I trust my gut feeling more than detailed analysis',
                reverse: true,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'verity_4',
                dimension: 'verity',
                text: 'I check facts and data before accepting conclusions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'verity_5',
                dimension: 'verity',
                text: 'I value evidence-based decision making',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },

            // Association (5 questions, 1 reverse)
            {
                id: 'association_1',
                dimension: 'association',
                text: 'I often seek input from others when making important decisions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'association_2',
                dimension: 'association',
                text: 'I prefer to make decisions independently without consulting others',
                reverse: true,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'association_3',
                dimension: 'association',
                text: 'I value diverse perspectives when solving problems',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'association_4',
                dimension: 'association',
                text: 'I actively seek feedback from my network',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'association_5',
                dimension: 'association',
                text: 'I consider multiple viewpoints before deciding',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },

            // Lived Experience (5 questions, 1 reverse)
            {
                id: 'lived_experience_1',
                dimension: 'lived_experience',
                text: 'I draw heavily on my personal experiences when making decisions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'lived_experience_2',
                dimension: 'lived_experience',
                text: 'My past successes and failures guide my current choices',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'lived_experience_3',
                dimension: 'lived_experience',
                text: 'I prefer theoretical knowledge over practical experience',
                reverse: true,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'lived_experience_4',
                dimension: 'lived_experience',
                text: 'I trust my intuition based on past experiences',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'lived_experience_5',
                dimension: 'lived_experience',
                text: 'My personal history shapes my decision-making approach',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },

            // Institutional (5 questions, 1 reverse)
            {
                id: 'institutional_1',
                dimension: 'institutional',
                text: 'I follow established procedures and protocols when making decisions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'institutional_2',
                dimension: 'institutional',
                text: 'I prefer to work outside formal structures and processes',
                reverse: true,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'institutional_3',
                dimension: 'institutional',
                text: 'I value organizational policies and guidelines',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'institutional_4',
                dimension: 'institutional',
                text: 'I rely on formal frameworks for decision making',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'institutional_5',
                dimension: 'institutional',
                text: 'I believe in following best practices and industry standards',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },

            // Desire (5 questions, 1 reverse)
            {
                id: 'desire_1',
                dimension: 'desire',
                text: 'I am motivated by achieving my personal goals',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'desire_2',
                dimension: 'desire',
                text: 'I make decisions that don\'t consider personal aspirations',
                reverse: true,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'desire_3',
                dimension: 'desire',
                text: 'My vision for the future influences my choices',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'desire_4',
                dimension: 'desire',
                text: 'I am driven by what I want to achieve',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            },
            {
                id: 'desire_5',
                dimension: 'desire',
                text: 'I consider my long-term aspirations when making decisions',
                reverse: false,
                options: [
                    { value: 1, text: 'Strongly Disagree' },
                    { value: 2, text: 'Disagree' },
                    { value: 3, text: 'Neutral' },
                    { value: 4, text: 'Agree' },
                    { value: 5, text: 'Strongly Agree' }
                ]
            }
        ];
        
        this.init();
    }

    async initSupabase() {
        try {
            // First, ensure configuration is loaded
            if (!window.APP_CONFIG) {
                console.log('🔒 Loading secure configuration...');
                await loadConfiguration();
            }

            // Wait for global mobileSupabase to be available
            let attempts = 0;
            while (!window.mobileSupabase && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.mobileSupabase) {
                this.supabase = window.mobileSupabase;
                console.log('🔒 Mobile Supabase client connected securely');
            } else {
                console.warn('Mobile Supabase client not available, using offline mode');
                this.supabase = null;
            }
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.supabase = null;
        }
    }

    async createDatabaseAssessment() {
        try {
            if (!this.supabase) return null;
            
            const assessmentData = {
                userAge: this.userAge,
                jobTitle: this.jobTitle,
                decisionMaker: this.decisionMaker,
                consultantReferral: this.consultantReferral
            };
            
            const result = await this.supabase.createAssessment(assessmentData);
            console.log('Assessment created in database:', result);
            return result;
        } catch (error) {
            console.error('Failed to create assessment in database:', error);
            return null;
        }
    }

    async saveAnswersToDatabase() {
        try {
            if (!this.supabase || !this.answers) return null;
            
            const result = await this.supabase.saveAnswers(this.answers);
            console.log('Answers saved to database');
            return result;
        } catch (error) {
            console.error('Failed to save answers to database:', error);
            return null;
        }
    }

    async saveContactToDatabase() {
        try {
            if (!this.supabase || !this.contactInfo) return null;
            
            const result = await this.supabase.saveContactInfo(this.contactInfo);
            console.log('Contact info saved to database');
            return result;
        } catch (error) {
            console.error('Failed to save contact info to database:', error);
            return null;
        }
    }

    async completeAssessmentInDatabase(scores, persona) {
        try {
            if (!this.supabase) return null;
            
            const result = await this.supabase.completeAssessment(scores, persona);
            console.log('Assessment completed in database');
            return result;
        } catch (error) {
            console.error('Failed to complete assessment in database:', error);
            return null;
        }
    }

    async saveInvolvementToDatabase(involvementType, contactData) {
        try {
            if (!this.supabase) return null;
            
            const result = await this.supabase.saveInvolvementPreference(involvementType, contactData);
            console.log('Involvement preference saved and webhook triggered');
            return result;
        } catch (error) {
            console.error('Failed to save involvement preference:', error);
            return null;
        }
    }

    async initConfiguration() {
        try {
            // Initialize configuration manager with Supabase client
            if (typeof ConfigManager !== 'undefined') {
                this.configManager = new ConfigManager(this.supabase);
                await this.configManager.init();
                
                // Load dynamic configuration from API
                await this.loadDynamicConfiguration();
            } else {
                console.log('📊 ConfigManager not available, using defaults');
            }
        } catch (error) {
            console.error('Failed to initialize configuration:', error);
        }
    }

    async loadDynamicConfiguration() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.config = data.config;
                    console.log('📊 Loaded dynamic configuration from API');
                    
                    // Apply UI configuration
                    this.applyUIConfiguration();
                }
            }
        } catch (error) {
            console.warn('Failed to load dynamic configuration:', error);
        }
    }

    applyUIConfiguration() {
        if (!this.config) return;

        try {
            // Apply brand colors
            if (this.config.brand_primary_color) {
                document.documentElement.style.setProperty('--primary-color', this.config.brand_primary_color);
            }
            if (this.config.brand_secondary_color) {
                document.documentElement.style.setProperty('--secondary-color', this.config.brand_secondary_color);
            }

            // Update welcome message
            if (this.config.welcome_message) {
                const titleElement = document.querySelector('.age-title');
                if (titleElement && titleElement.textContent === 'Ready to Begin?') {
                    titleElement.textContent = this.config.welcome_message;
                }
            }

            // Update assessment title
            if (this.config.assessment_title) {
                document.title = this.config.assessment_title + ' - Mobile';
            }

        } catch (error) {
            console.warn('Failed to apply UI configuration:', error);
        }
    }

    init() {
        this.setupEventListeners();
        this.updateProgress();
        this.updateNavigation();
    }

    setupEventListeners() {
        // Age selection - target only age screen
        const ageOptions = document.querySelectorAll('#ageScreen .age-option[data-age]');
        console.log(`Found ${ageOptions.length} age options`);
        
        ageOptions.forEach(option => {
            const ageValue = option.getAttribute('data-age');
            console.log(`Setting up listener for age: ${ageValue}`);
            option.addEventListener('click', (event) => {
                const clickedAge = event.target.closest('.age-option').getAttribute('data-age');
                console.log(`Age clicked: ${clickedAge}`);
                this.selectAge(clickedAge);
            });
        });

        // Job role selection - target only job title screen
        const roleOptions = document.querySelectorAll('#jobTitleScreen [data-role]');
        console.log(`Found ${roleOptions.length} role options`);
        
        roleOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const clickedRole = event.target.closest('[data-role]').getAttribute('data-role');
                this.selectJobRole(clickedRole);
            });
        });

        // Decision maker selection - target only decision maker screen
        const decisionOptions = document.querySelectorAll('#decisionMakerScreen [data-decision]');
        console.log(`Found ${decisionOptions.length} decision options`);
        
        decisionOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const clickedDecision = event.target.closest('[data-decision]').getAttribute('data-decision');
                this.selectDecisionMaker(clickedDecision);
            });
        });

        // Consultant referral selection - target only consultant screen
        const consultantOptions = document.querySelectorAll('#consultantScreen [data-consultant]');
        console.log(`Found ${consultantOptions.length} consultant options`);
        
        consultantOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const clickedConsultant = event.target.closest('[data-consultant]').getAttribute('data-consultant');
                this.selectConsultant(clickedConsultant);
            });
        });

        // Info continue button
        document.getElementById('infoContinueBtn').addEventListener('click', () => {
            this.showConsultantScreen();
        });

        // Start assessment button
        document.getElementById('startAssessmentBtn').addEventListener('click', () => {
            this.showQuestion();
        });

        // Navigation buttons
        document.getElementById('backBtn').addEventListener('click', () => this.previous());
        document.getElementById('nextBtn').addEventListener('click', () => this.next());

        // Contact form
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitContact();
        });

        // Continue button on results (check if exists first)
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.scrollToInvolvement();
            });
        }

        // Take Again button
        const takeAgainBtn = document.getElementById('takeAgainBtn');
        if (takeAgainBtn) {
            takeAgainBtn.addEventListener('click', () => {
                this.takeAgain();
            });
        }

        // Involvement card interactions
        document.querySelectorAll('.involvement-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleInvolvementSelection(card.dataset.type);
            });
        });
    }

    selectAge(age) {
        console.log(`selectAge called with: ${age}`);
        
        if (!age) {
            console.error('Age value is empty or undefined');
            return;
        }
        
        this.userAge = age;
        
        // Update UI
        document.querySelectorAll('.age-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-age="${age}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log(`Successfully selected age: ${age}`);
        } else {
            console.error(`Age element not found for: ${age}`);
            return;
        }
        
        // Move to job title screen after a short delay
        setTimeout(() => {
            this.showJobTitleScreen();
        }, 500);
    }

    showJobTitleScreen() {
        this.currentScreen = 'jobTitle';
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
    }

    selectJobRole(role) {
        this.jobTitle = role;
        
        // Update UI
        document.querySelectorAll('[data-role]').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-role="${role}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        } else {
            console.error(`Role element not found for: ${role}`);
        }
        
        // Move to decision maker screen after a short delay
        setTimeout(() => {
            this.showDecisionMakerScreen();
        }, 500);
    }

    showDecisionMakerScreen() {
        this.currentScreen = 'decisionMaker';
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
    }

    selectDecisionMaker(decision) {
        this.decisionMaker = decision;
        
        // Update UI
        document.querySelectorAll('[data-decision]').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-decision="${decision}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        } else {
            console.error(`Decision element not found for: ${decision}`);
        }
        
        // Create assessment in database now that we have all basic info
        this.createDatabaseAssessment();
        
        // Move to info screen after a short delay
        setTimeout(() => {
            this.showInfoScreen();
        }, 500);
    }

    selectConsultant(consultant) {
        this.consultantReferral = consultant;
        
        // Update UI
        document.querySelectorAll('.consultant-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-consultant="${consultant}"]`).classList.add('selected');
        
        // Move to welcome screen after a short delay
        setTimeout(() => {
            this.showWelcomeScreen();
        }, 500);
    }

    showInfoScreen() {
        this.currentScreen = 'info';
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
    }

    showConsultantScreen() {
        this.currentScreen = 'consultant';
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
    }

    showWelcomeScreen() {
        this.currentScreen = 'welcome';
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
    }

    showQuestion() {
        if (this.currentQuestion < this.questions.length) {
            this.currentScreen = 'question';
            this.updateScreens();
            this.renderQuestion();
            this.updateProgress();
            this.updateNavigation();
        } else {
            this.showContactScreen();
        }
    }

    renderQuestion() {
        try {
            const question = this.questions[this.currentQuestion];
            if (!question) {
                console.error('Question not found:', this.currentQuestion);
                return;
            }

            // Find question elements
            const questionTitle = document.getElementById('questionTitle');
            const optionsContainer = document.getElementById('answerOptions');
            
            if (!questionTitle || !optionsContainer) {
                console.error('Required question elements not found');
                return;
            }
            
            // Clear previous content
            questionTitle.textContent = question.text;
            optionsContainer.innerHTML = '';
            
            // Check if this is a Likert scale question (5 options)
            const isLikertScale = question.options.length === 5;
            
            if (isLikertScale) {
                optionsContainer.classList.add('horizontal');
                document.getElementById('questionScreens').classList.add('has-horizontal-options');
            } else {
                optionsContainer.classList.remove('horizontal');
                document.getElementById('questionScreens').classList.remove('has-horizontal-options');
            }
            
            // Icon mapping for Likert scale
            const getIcon = (value, text) => {
                if (!isLikertScale) return '';
                
                const lowerText = text.toLowerCase();
                if (value === 1) return '👎👎'; // Strongly Disagree - double thumbs down
                if (value === 2) return '👎';   // Disagree - single thumbs down
                if (value === 3) return '🤷‍♂️';   // Neutral - shrug
                if (value === 4) return '👍';   // Agree - single thumbs up
                if (value === 5) return '👍👍'; // Strongly Agree - double thumbs up
                return '';
            };
            
            question.options.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'answer-option';
                optionElement.setAttribute('data-value', option.value);
                
                const icon = getIcon(option.value, option.text);
                const iconHtml = icon ? `<span class="answer-icon">${icon}</span>` : '';
                
                optionElement.innerHTML = `
                    <input type="radio" name="question_${question.id}" value="${option.value}" id="option_${question.id}_${option.value}">
                    ${iconHtml}
                    <label for="option_${question.id}_${option.value}" class="answer-text">${option.text}</label>
                `;
                
                optionElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectAnswer(question.id, option.value);
                });
                
                optionsContainer.appendChild(optionElement);
            });
            
            // Hide next button until an answer is selected
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error in renderQuestion:', error);
        }
    }
    
    selectAnswer(questionId, value) {
        this.answers[questionId] = parseInt(value);
        
        // Save answers to database
        this.saveAnswersToDatabase();
        
        // Update UI - find the specific radio input and mark its parent as selected
        const radioInput = document.querySelector(`input[name="question_${questionId}"][value="${value}"]`);
        if (radioInput) {
            radioInput.checked = true;
            
            // Remove selected class from all options
            document.querySelectorAll('.answer-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selected class to the clicked option
            const selectedOption = radioInput.closest('.answer-option');
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }
        
        // Enable next button
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.style.display = 'flex';
        }
        
        // Auto-advance after a short delay to show selection feedback
        setTimeout(() => {
            this.next();
        }, 300);
    }

    next() {
        if (this.currentScreen === 'age') {
            this.showJobTitleScreen();
        } else if (this.currentScreen === 'jobTitle') {
            this.showDecisionMakerScreen();
        } else if (this.currentScreen === 'decisionMaker') {
            this.showInfoScreen();
        } else if (this.currentScreen === 'info') {
            this.showConsultantScreen();
        } else if (this.currentScreen === 'consultant') {
            this.showWelcomeScreen();
        } else if (this.currentScreen === 'welcome') {
            this.showQuestion();
        } else if (this.currentScreen === 'question') {
            this.currentQuestion++;
            if (this.currentQuestion < this.questions.length) {
                this.renderQuestion();
                this.updateProgress();
                this.updateNavigation();
            } else {
                this.showContactScreen();
            }
        }
    }

    previous() {
        if (this.currentScreen === 'jobTitle') {
            this.currentScreen = 'age';
            this.updateScreens();
            this.updateNavigation();
        } else if (this.currentScreen === 'decisionMaker') {
            this.showJobTitleScreen();
        } else if (this.currentScreen === 'info') {
            this.showDecisionMakerScreen();
        } else if (this.currentScreen === 'consultant') {
            this.showInfoScreen();
        } else if (this.currentScreen === 'welcome') {
            this.showConsultantScreen();
        } else if (this.currentScreen === 'question' && this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
            this.updateProgress();
            this.updateNavigation();
        } else if (this.currentScreen === 'question' && this.currentQuestion === 0) {
            this.showWelcomeScreen();
        }
    }

    showContactScreen() {
        this.currentScreen = 'contact';
        this.updateScreens();
        this.updateNavigation();
    }

    submitContact() {
        const formData = new FormData(document.getElementById('contactForm'));
        this.contactInfo = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            organization: formData.get('organization'),
            age: this.userAge,
            consultantReferral: this.consultantReferral
        };
        
        // Save contact info to database
        this.saveContactToDatabase();

        // Show loading
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
        submitBtn.disabled = true;

        // Calculate results
        setTimeout(() => {
            this.calculateResults();
            this.showResults();
            
            // Send results via email after showing them
            this.sendResultsEmail();
        }, 1500);
    }

    calculateResults() {
        const dimensions = ['verity', 'association', 'lived_experience', 'institutional', 'desire'];
        const scores = {};
        
        dimensions.forEach(dimension => {
            const dimensionQuestions = this.questions.filter(q => q.dimension === dimension);
            let total = 0;
            let count = 0;
            
            dimensionQuestions.forEach(question => {
                if (this.answers[question.id] !== undefined) {
                    let score = this.answers[question.id];
                    // Reverse scoring for reverse questions
                    if (question.reverse) {
                        score = 6 - score;
                    }
                    total += score;
                    count++;
                }
            });
            
            scores[dimension] = count > 0 ? Math.round((total / count) * 20) : 0; // Scale to 0-100
        });
        
        // Calculate overall score
        const overallScore = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 5);
        
        // Determine persona
        const persona = this.determinePersona(scores);
        
        this.results = { scores, overallScore, persona };
    }

    determinePersona(scores) {
        const highest = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        
        const personas = {
            verity: 'The Analyst',
            association: 'The Collaborator',
            lived_experience: 'The Experiencer',
            institutional: 'The Systematizer',
            desire: 'The Visionary'
        };
        
        return personas[highest] || 'The Balanced Decision Maker';
    }

    showResults() {
        this.currentScreen = 'results';
        this.updateScreens();
        this.renderResults();
        this.updateNavigation();
        
        // Complete assessment in database
        const { scores, persona } = this.results;
        this.completeAssessmentInDatabase(scores, persona);
    }

    renderResults() {
        const { scores, overallScore } = this.results;
        
        // Create radar chart
        this.createRadarChart(scores);
        
        // Update profile summary
        const summary = this.getProfileSummary(overallScore);
        const profileSummaryElement = document.getElementById('profileSummary');
        if (profileSummaryElement) {
            profileSummaryElement.innerHTML = `
                <h3>Your Decision-Making Profile</h3>
                <p>${summary.description}</p>
            `;
        }
        
        // Render dimension cards
        this.renderDimensionCards(scores);
        
        // Render recommendations
        this.renderRecommendations(scores);
    }

    renderDimensionCards(scores) {
        const dimensionCards = document.getElementById('dimensionCards');
        if (!dimensionCards) return;
        
        dimensionCards.innerHTML = '';
        
        const dimensions = [
            { key: 'verity', name: 'Verity', icon: 'fas fa-search', color: '#3b82f6' },
            { key: 'association', name: 'Association', icon: 'fas fa-link', color: '#8b5cf6' },
            { key: 'lived_experience', name: 'Lived Experience', icon: 'fas fa-heart', color: '#ef4444' },
            { key: 'institutional', name: 'Institutional', icon: 'fas fa-building', color: '#10b981' },
            { key: 'desire', name: 'Desire', icon: 'fas fa-star', color: '#f59e0b' }
        ];
        
        dimensions.forEach(dim => {
            const card = document.createElement('div');
            card.className = 'dimension-card';
            card.innerHTML = `
                <div class="dimension-icon" style="background-color: ${dim.color}">
                    <i class="${dim.icon}"></i>
                </div>
                <div class="dimension-info">
                    <div class="dimension-name">${dim.name}</div>
                    <div class="dimension-score">${scores[dim.key]}%</div>
                </div>
            `;
            dimensionCards.appendChild(card);
        });
    }

    renderRecommendations(scores) {
        const recommendationList = document.getElementById('recommendationList');
        if (!recommendationList) return;
        
        recommendationList.innerHTML = '';
        
        const recommendations = this.getRecommendations(scores);
        
        recommendations.forEach((rec, index) => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="recommendation-icon" style="background-color: ${rec.color}">
                    <i class="${rec.icon}"></i>
                </div>
                <div class="recommendation-text">${rec.text}</div>
            `;
            recommendationList.appendChild(item);
        });
    }

    getRecommendations(scores) {
        const recommendations = [];
        
        // Find lowest scoring dimensions
        const sortedScores = Object.entries(scores)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 2);
        
        const dimensionInfo = {
            verity: {
                color: '#3b82f6',
                icon: 'fas fa-search',
                text: 'Look for connections between different ideas and experiences to enhance creativity'
            },
            association: {
                color: '#8b5cf6',
                icon: 'fas fa-link',
                text: 'Seek diverse perspectives and build stronger collaborative networks'
            },
            lived_experience: {
                color: '#ef4444',
                icon: 'fas fa-heart',
                text: 'Trust your intuition and leverage your personal experiences more in decisions'
            },
            institutional: {
                color: '#10b981',
                icon: 'fas fa-building',
                text: 'Study best practices and established frameworks to inform your approach'
            },
            desire: {
                color: '#f59e0b',
                icon: 'fas fa-star',
                text: 'Clarify your goals and motivations to drive better decision outcomes'
            }
        };
        
        // Add recommendations for the lowest scoring dimensions
        sortedScores.forEach(([dimension, score]) => {
            if (score < 60 && dimensionInfo[dimension]) {
                recommendations.push(dimensionInfo[dimension]);
            }
        });
        
        // If no low scores, add general recommendations
        if (recommendations.length === 0) {
            recommendations.push({
                color: '#8b5cf6',
                icon: 'fas fa-link',
                text: 'Look for connections between different ideas and experiences to enhance creativity'
            });
            recommendations.push({
                color: '#f59e0b',
                icon: 'fas fa-star',
                text: 'Clarify your goals and motivations to drive better decision outcomes'
            });
        }
        
        return recommendations;
    }

    createRadarChart(scores) {
        const canvas = document.getElementById('radarChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        const dimensions = [
            { key: 'verity', label: 'Verity', angle: 0 },
            { key: 'association', label: 'Association', angle: Math.PI * 2 / 5 },
            { key: 'lived_experience', label: 'Lived\nExperience', angle: Math.PI * 4 / 5 },
            { key: 'institutional', label: 'Institutional', angle: Math.PI * 6 / 5 },
            { key: 'desire', label: 'Desire', angle: Math.PI * 8 / 5 }
        ];
        
        // Draw pentagon grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let level = 1; level <= 5; level++) {
            const levelRadius = (radius * level) / 5;
            ctx.beginPath();
            dimensions.forEach((dim, index) => {
                const x = centerX + Math.cos(dim.angle - Math.PI/2) * levelRadius;
                const y = centerY + Math.sin(dim.angle - Math.PI/2) * levelRadius;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.closePath();
            ctx.stroke();
        }
        
        // Draw axis lines
        dimensions.forEach(dim => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            const x = centerX + Math.cos(dim.angle - Math.PI/2) * radius;
            const y = centerY + Math.sin(dim.angle - Math.PI/2) * radius;
            ctx.lineTo(x, y);
            ctx.stroke();
        });
        
        // Draw data polygon
        ctx.strokeStyle = '#6366f1';
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        dimensions.forEach((dim, index) => {
            const score = scores[dim.key] || 0;
            const scoreRadius = (radius * score) / 100;
            const x = centerX + Math.cos(dim.angle - Math.PI/2) * scoreRadius;
            const y = centerY + Math.sin(dim.angle - Math.PI/2) * scoreRadius;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#6366f1';
        dimensions.forEach(dim => {
            const score = scores[dim.key] || 0;
            const scoreRadius = (radius * score) / 100;
            const x = centerX + Math.cos(dim.angle - Math.PI/2) * scoreRadius;
            const y = centerY + Math.sin(dim.angle - Math.PI/2) * scoreRadius;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        dimensions.forEach(dim => {
            const labelRadius = radius + 25;
            const x = centerX + Math.cos(dim.angle - Math.PI/2) * labelRadius;
            const y = centerY + Math.sin(dim.angle - Math.PI/2) * labelRadius;
            
            // Handle multi-line labels
            if (dim.label.includes('\n')) {
                const lines = dim.label.split('\n');
                lines.forEach((line, lineIndex) => {
                    ctx.fillText(line, x, y + (lineIndex - 0.5) * 14);
                });
            } else {
                ctx.fillText(dim.label, x, y);
            }
        });
    }

    getProfileSummary(overallScore) {
        if (overallScore >= 80) {
            return {
                description: "You demonstrate a comprehensive and well-balanced approach to decision-making, drawing effectively from multiple sources of insight and maintaining strong analytical capabilities."
            };
        } else if (overallScore >= 60) {
            return {
                description: "You show solid decision-making capabilities with room for growth in certain areas. Your approach is generally effective with opportunities for enhancement."
            };
        } else if (overallScore >= 40) {
            return {
                description: "You have developing decision-making skills with clear areas for improvement. Focus on strengthening your weaker dimensions for more effective choices."
            };
        } else {
            return {
                description: "Your decision-making approach would benefit from significant development across multiple dimensions. Consider targeted learning and practice in key areas."
            };
        }
    }

    scrollToInvolvement() {
        const involvementSection = document.getElementById('involvementSection');
        if (involvementSection) {
            involvementSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    handleInvolvementSelection(type) {
        // Track the selection (can be integrated with analytics)
        console.log('User selected involvement type:', type);
        
        // Save involvement preference to database and trigger webhook
        const contactData = {
            email: this.contactInfo.email || 'unknown@example.com',
            name: `${this.contactInfo.firstName || ''} ${this.contactInfo.lastName || ''}`.trim() || 'Unknown User',
            age: this.userAge,
            jobRole: this.jobTitle,
            decisionMaker: this.decisionMaker,
            consultantReferral: this.consultantReferral,
            organization: this.contactInfo.organization || '',
            phone: this.contactInfo.phone || ''
        };
        
        // Save to database and trigger webhook
        this.saveInvolvementToDatabase(type, contactData);
        
        // Handle different involvement types
        switch(type) {
            case 'consultant':
                this.openConsultantForm(contactData);
                break;
            case 'pilot':
                this.openPilotForm(contactData);
                break;
            case 'research':
                this.openResearchForm(contactData);
                break;
            case 'updates':
                this.openUpdatesForm(contactData);
                break;
            case 'founder':
                this.openFounderCalendar(contactData);
                break;
            default:
                console.log('Unknown involvement type:', type);
        }
    }
    
    openConsultantForm(contactData) {
        // Show success message indicating the request has been submitted
        alert(`Thank you ${contactData.name}! Your consultant application has been submitted. Our team will contact you at ${contactData.email} within 24 hours.`);
        
        // You can also redirect to an external form if needed:
        // window.open('https://your-domain.com/consultant-application', '_blank');
    }
    
    openPilotForm(contactData) {
        alert(`Thank you ${contactData.name}! Your pilot program application has been submitted. We'll contact you at ${contactData.email} with next steps.`);
    }
    
    openResearchForm(contactData) {
        alert(`Thank you ${contactData.name}! You've been added to our research cohort. We'll send updates to ${contactData.email}.`);
    }
    
    openUpdatesForm(contactData) {
        alert(`Thank you ${contactData.name}! You're now subscribed to VALID updates at ${contactData.email}.`);
    }
    
    openFounderCalendar(contactData) {
        alert(`Thank you ${contactData.name}! Your request for a founder call has been submitted. Christopher will reach out to ${contactData.email} to schedule a time.`);
        
        // You can also redirect to a calendar booking system:
        // window.open('https://calendly.com/christopher-valid', '_blank');
    }

    updateScreens() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the current screen
        let currentScreenElement;
        if (this.currentScreen === 'age') {
            currentScreenElement = document.getElementById('ageScreen');
            // Restore age selection if going back
            if (this.userAge) {
                this.restoreAgeSelection();
            }
        } else if (this.currentScreen === 'jobTitle') {
            currentScreenElement = document.getElementById('jobTitleScreen');
            // Restore job role selection if going back
            if (this.jobTitle) {
                this.restoreJobRoleSelection();
            }
        } else if (this.currentScreen === 'decisionMaker') {
            currentScreenElement = document.getElementById('decisionMakerScreen');
            // Restore decision maker selection if going back
            if (this.decisionMaker) {
                this.restoreDecisionMakerSelection();
            }
        } else if (this.currentScreen === 'info') {
            currentScreenElement = document.getElementById('infoScreen');
        } else if (this.currentScreen === 'consultant') {
            currentScreenElement = document.getElementById('consultantScreen');
            // Restore consultant selection if going back
            if (this.consultantReferral) {
                this.restoreConsultantSelection();
            }
        } else if (this.currentScreen === 'welcome') {
            currentScreenElement = document.getElementById('welcomeScreen');
        } else if (this.currentScreen === 'question') {
            currentScreenElement = document.getElementById('questionScreens');
        } else if (this.currentScreen === 'contact') {
            currentScreenElement = document.getElementById('contactScreen');
        } else if (this.currentScreen === 'results') {
            currentScreenElement = document.getElementById('resultsScreen');
        }
        
        if (currentScreenElement) {
            currentScreenElement.classList.add('active');
        } else {
            console.error(`Screen element not found for: ${this.currentScreen}`);
        }
    }

    restoreAgeSelection() {
        // Clear all selections first
        document.querySelectorAll('#ageScreen .age-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Highlight the previously selected age
        const selectedElement = document.querySelector(`#ageScreen [data-age="${this.userAge}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log(`Restored age selection: ${this.userAge}`);
        }
    }

    restoreJobRoleSelection() {
        // Clear all selections first
        document.querySelectorAll('#jobTitleScreen [data-role]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Highlight the previously selected role
        const selectedElement = document.querySelector(`#jobTitleScreen [data-role="${this.jobTitle}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log(`Restored job role selection: ${this.jobTitle}`);
        }
    }

    restoreDecisionMakerSelection() {
        // Clear all selections first
        document.querySelectorAll('#decisionMakerScreen [data-decision]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Highlight the previously selected decision
        const selectedElement = document.querySelector(`#decisionMakerScreen [data-decision="${this.decisionMaker}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log(`Restored decision maker selection: ${this.decisionMaker}`);
        }
    }

    restoreConsultantSelection() {
        // Clear all selections first
        document.querySelectorAll('#consultantScreen [data-consultant]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Highlight the previously selected consultant referral
        const selectedElement = document.querySelector(`#consultantScreen [data-consultant="${this.consultantReferral}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log(`Restored consultant selection: ${this.consultantReferral}`);
        }
    }
    
    updateProgress() {
        if (this.currentScreen === 'question') {
            const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
        } else if (this.currentScreen === 'contact') {
            document.getElementById('progressFill').style.width = '100%';
        }
    }
    
    updateNavigation() {
        const backBtn = document.getElementById('backBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (this.currentScreen === 'age') {
            backBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'jobTitle') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'decisionMaker') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'info') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'consultant') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'welcome') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'question') {
            backBtn.style.display = 'flex'; // Always show back button during questions
            nextBtn.style.display = this.answers[this.questions[this.currentQuestion]?.id] ? 'flex' : 'none';
        } else if (this.currentScreen === 'contact') {
            backBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
        } else if (this.currentScreen === 'results') {
            backBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    takeAgain() {
        // Reset all assessment state
        this.currentScreen = 'age';
        this.currentQuestion = 0;
        this.answers = {};
        this.userAge = null;
        this.jobTitle = null;
        this.decisionMaker = null;
        this.consultantReferral = null;
        this.contactInfo = {};
        this.results = null;
        
        // Reset Supabase client state to create new assessment
        if (this.supabase) {
            this.supabase.currentAssessmentId = null;
        }
        
        // Clear any UI selections
        this.clearAllSelections();
        
        // Reset the assessment flow
        this.updateScreens();
        this.updateProgress();
        this.updateNavigation();
        
        // Clear the contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.reset();
        }
        
        // Reset submit button if it was disabled
        const submitBtn = contactForm?.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'View My Results';
            submitBtn.disabled = false;
        }
        
        console.log('Assessment reset - starting over');
    }

    clearAllSelections() {
        // Clear age selections
        document.querySelectorAll('#ageScreen .age-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear job role selections
        document.querySelectorAll('#jobTitleScreen [data-role]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear decision maker selections
        document.querySelectorAll('#decisionMakerScreen [data-decision]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear consultant selections
        document.querySelectorAll('#consultantScreen [data-consultant]').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear answer selections
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear radio button selections
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
    }

    async sendResultsEmail() {
        try {
            // Show email sending notification
            this.showEmailNotification('sending');
            
            const response = await fetch('/api/email-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactInfo: this.contactInfo,
                    scores: this.results.scores,
                    persona: this.results.persona,
                    overallScore: this.results.overallScore
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Results email sent successfully');
                this.showEmailNotification('success');
            } else {
                console.error('Failed to send results email:', result.error);
                // Show different message if email service isn't configured
                if (result.configured === false) {
                    this.showEmailNotification('not_configured');
                } else {
                    this.showEmailNotification('error');
                }
            }
            
        } catch (error) {
            console.error('Error sending results email:', error);
            this.showEmailNotification('error');
        }
    }

    showEmailNotification(status) {
        // Create or update email notification
        let notification = document.getElementById('emailNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'emailNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                max-width: 300px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(notification);
        }

        if (status === 'sending') {
            notification.style.background = '#3B82F6';
            notification.innerHTML = '📧 Attempting to email your results...';
        } else if (status === 'success') {
            notification.style.background = '#10B981';
            notification.innerHTML = '✅ Results emailed to ' + this.contactInfo.email;
            
            // Hide after 5 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        } else if (status === 'not_configured') {
            notification.style.background = '#F59E0B';
            notification.innerHTML = `📋 Results displayed above! Email sending requires setup. <a href="mailto:${this.contactInfo.email}?subject=Your VALID Assessment Results&body=Hi! Please refer to your assessment results on the screen. For email delivery setup, check the EMAIL_SETUP_GUIDE.md file." style="color: white; text-decoration: underline;">Email yourself manually</a>`;
            
            // Hide after 12 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 12000);
        } else if (status === 'error') {
            notification.style.background = '#EF4444';
            notification.innerHTML = '❌ Failed to send email. Results shown above.';
            
            // Hide after 7 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 7000);
        }
    }
}

// Initialize the assessment when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mobileAssessment = new MobileAssessment();
}); 