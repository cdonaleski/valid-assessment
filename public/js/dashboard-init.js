/**
 * Dashboard Initialization Module
 * Main entry point for dashboard functionality
 */

import { DashboardCore } from './dashboard-core.js';
import { DashboardResults } from './dashboard-results.js';
import { DashboardTeam } from './dashboard-team.js';
import { DashboardProfile } from './dashboard-profile.js';

export class DashboardManager {
    constructor() {
        this.modules = {};
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Dashboard Manager...');
            
            // Wait for DOM to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            // Initialize core dashboard functionality
            this.modules.core = new DashboardCore();
            
            // Initialize section-specific modules
            this.modules.results = new DashboardResults();
            this.modules.team = new DashboardTeam();
            this.modules.profile = new DashboardProfile();

            // Set up global references
            window.dashboardManager = this;
            window.dashboardCore = this.modules.core;
            window.dashboardResults = this.modules.results;
            window.dashboardTeam = this.modules.team;
            window.dashboardProfile = this.modules.profile;

            // Initialize additional functionality
            this.setupGlobalFunctions();
            this.setupErrorHandling();

            console.log('✅ Dashboard Manager initialized successfully');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('dashboardReady', {
                detail: { manager: this }
            }));

        } catch (error) {
            console.error('❌ Error initializing Dashboard Manager:', error);
            throw error;
        }
    }

    setupGlobalFunctions() {
        // Global functions that can be called from HTML
        window.showSection = (sectionId) => {
            this.modules.core.showSection(sectionId);
        };

        window.loadAssessmentResults = () => {
            // This would be implemented in the results module
            console.log('Loading assessment results...');
        };

        window.loadUserProfile = () => {
            this.modules.profile.loadUserProfile();
        };

        window.initializeTeamManagement = () => {
            // Team management is already initialized, just ensure it's rendered
            this.modules.team.renderTeamMembers();
        };

        window.initializeValid360 = () => {
            console.log('Initializing Valid360 functionality...');
            // Implementation for Valid360
        };

        window.updateVALIDCard = () => {
            this.updateVALIDCard();
        };
    }

    setupErrorHandling() {
        // Global error handler for dashboard
        window.addEventListener('error', (event) => {
            console.error('Dashboard Error:', event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Dashboard Unhandled Promise Rejection:', event.reason);
        });
    }

    updateVALIDCard() {
        try {
            // Get current user ID
            const currentUser = window.assessmentStateManager?.getCurrentUserId();
            if (!currentUser) return;

            // Try to get results from localStorage
            const localStorageKey = `assessment_results_${currentUser}`;
            const storedResults = localStorage.getItem(localStorageKey);
            
            if (storedResults) {
                const results = JSON.parse(storedResults);
                const scores = results.scores || {};
                
                // Find primary and secondary validators
                const dimensionNames = {
                    'V': 'Verity',
                    'A': 'Association', 
                    'L': 'Lived Experience',
                    'I': 'Institutional',
                    'D': 'Desire'
                };
                
                const dimensionColors = {
                    'V': 'var(--verity-color)',
                    'A': 'var(--association-color)',
                    'L': 'var(--lived-color)',
                    'I': 'var(--institutional-color)',
                    'D': 'var(--desire-color)'
                };
                
                // Sort scores to find primary and secondary
                const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
                const primary = sortedScores[0] || ['V', 0];
                const secondary = sortedScores[1] || ['A', 0];
                
                // Update combined validator letters
                const comboElement = document.getElementById('validatorCombo');
                if (comboElement) {
                    const combo = primary[0] + secondary[0]; // e.g., "VL"
                    comboElement.textContent = combo;
                    comboElement.style.color = dimensionColors[primary[0]];
                    comboElement.style.fontSize = '2rem';
                    comboElement.style.fontWeight = '700';
                }
                
                // Calculate decision maturity (average of top 3 scores)
                const top3Scores = sortedScores.slice(0, 3).map(([,score]) => score);
                const decisionMaturity = Math.round(top3Scores.reduce((a, b) => a + b, 0) / top3Scores.length);
                
                const maturityElement = document.getElementById('decisionMaturity');
                if (maturityElement) {
                    maturityElement.textContent = `${decisionMaturity}%`;
                }
            }
        } catch (error) {
            console.error('Error updating VALID card:', error);
        }
    }

    // Public methods for external access
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    getCurrentSection() {
        return this.modules.core.getCurrentSection();
    }

    showSection(sectionId) {
        this.modules.core.showSection(sectionId);
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});

// Export for manual initialization
export { DashboardManager }; 