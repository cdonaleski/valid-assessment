/**
 * Dashboard Results Module
 * Handles the My Results section functionality including demo toggle
 */

export class DashboardResults {
    constructor() {
        this.demoMode = {
            showingDemoResults: false,
            toggleButton: null
        };
        this.init();
    }

    init() {
        this.setupDemoActions();
        this.setupDemoUser();
    }

    setupDemoUser() {
        // Force demo user for testing
        if (!localStorage.getItem('demoUser')) {
            localStorage.setItem('demoUser', JSON.stringify({email: 'demo@example.com'}));
        }
    }

    setupDemoActions() {
        // Show demo actions for all users
        window.showDemoActions = () => {
            const demoActions = document.getElementById('demoActions');
            if (demoActions) {
                demoActions.style.display = 'flex';
                console.log('✅ Demo actions shown for all users');
                
                this.setupToggleFunctionality();
            } else {
                console.log('❌ Demo actions not found in DOM');
            }
        }
        
        // Initialize demo actions
        window.showDemoActions();
    }

    setupToggleFunctionality() {
        const toggleBtn = document.getElementById('toggleDemoResultsBtn');
        if (toggleBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newToggleBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
            
            // Update the global reference
            this.demoMode.toggleButton = newToggleBtn;
            
            // Set initial button text and styling based on current state
            newToggleBtn.textContent = this.demoMode.showingDemoResults ? 'Show Real Results' : '🧪 Show Demo Results';
            newToggleBtn.style.background = this.demoMode.showingDemoResults ? '#ef4444' : '#10b981'; // Red for demo showing, green for real showing
            newToggleBtn.style.minWidth = '180px'; // Consistent width
            
            newToggleBtn.addEventListener('click', () => {
                this.handleToggleClick(newToggleBtn);
            });
            
            console.log('✅ Demo toggle button event listener attached');
        } else {
            console.log('❌ Demo toggle button not found in DOM');
        }
    }

    handleToggleClick(button) {
        console.log('🔄 Demo toggle button clicked, current state:', this.demoMode.showingDemoResults);
        
        if (this.demoMode.showingDemoResults) {
            // Show real results (if any) or empty state
            console.log('📊 Showing real results');
            if (typeof loadAssessmentResults === 'function') {
                loadAssessmentResults();
            }
            button.textContent = '🧪 Show Demo Results';
            button.style.background = '#10b981'; // Green for real results showing
            this.demoMode.showingDemoResults = false;
        } else {
            // Show demo results
            console.log('🧪 Showing demo results');
            if (typeof renderDashboardResultsUI === 'function') {
                const demoResults = this.createDemoResults();
                renderDashboardResultsUI(demoResults);
            }
            button.textContent = 'Show Real Results';
            button.style.background = '#ef4444'; // Red for demo
            this.demoMode.showingDemoResults = true;
        }
        
        console.log('🔄 Demo mode state updated:', this.demoMode.showingDemoResults);
    }

    createDemoResults() {
        return {
            id: 'demo-assessment-' + Date.now(),
            userId: 'demo-user',
            totalScore: 85,
            completionDate: new Date().toLocaleDateString(),
            questionsAnswered: 25,
            scores: {
                'V': 78,  // Verity
                'A': 82,  // Association
                'L': 75,  // Lived Experience
                'I': 88,  // Institutional
                'D': 80   // Desire
            },
            awareness: {
                percent: 72,
                flag: false
            },
            answers: {
                'DT-01': 6, 'DT-02': 4, 'DT-03': 5, 'DT-04': 6, 'DT-05': 3,
                'DT-06': 3, 'DT-07': 5, 'IG-01': 5, 'IG-02': 4, 'IG-03': 6,
                'IG-04': 6, 'IG-05': 3, 'IG-06': 4, 'IG-07': 5, 'CB-01': 6,
                'CB-02': 4, 'CB-03': 5, 'CB-04': 5, 'CB-05': 4, 'CB-06': 4,
                'CB-07': 5, 'UP-01': 5, 'UP-02': 4, 'UP-03': 4, 'UP-04': 5
            },
            isTestData: true
        };
    }

    // Public methods
    getDemoMode() {
        return this.demoMode;
    }

    isShowingDemoResults() {
        return this.demoMode.showingDemoResults;
    }
}

// Export for global use
window.DashboardResults = DashboardResults; 