/**
 * Dashboard Core Module
 * Handles main dashboard functionality, section management, and navigation
 */

export class DashboardCore {
    constructor() {
        this.currentSection = 'overviewSection';
        this.sections = [
            'overviewSection',
            'myDecisionsSection', 
            'dashboardResultsSection',
            'profileSection',
            'teamSection',
            'valid360Section'
        ];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupHashRouting();
        this.showDefaultSection();
    }

    setupNavigation() {
        // Set up navigation event listeners
        const navItems = document.querySelectorAll('.sidebar-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });
    }

    setupHashRouting() {
        // On page load, show section from hash if present
        document.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && document.getElementById(hash)) {
                this.showSection(hash);
            } else {
                this.showSection('myDecisionsSection'); // Set My Decisions as default for demo
            }
        });

        // Listen for hash changes (browser navigation)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && document.getElementById(hash)) {
                this.showSection(hash);
            }
        });
    }

    showSection(sectionId) {
        console.log('🔄 Showing section:', sectionId);
        
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all sidebar items
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show the selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Special handling for different sections
            this.handleSectionSpecificLogic(sectionId);
            
            // Set the hash
            window.location.hash = '#' + sectionId;
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'auto' });
        }

        // Add active class to the corresponding sidebar item
        const activeSidebarItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeSidebarItem) {
            activeSidebarItem.classList.add('active');
        }

        this.currentSection = sectionId;
    }

    handleSectionSpecificLogic(sectionId) {
        switch (sectionId) {
            case 'dashboardResultsSection':
                if (window.loadAssessmentResults) {
                    window.loadAssessmentResults();
                }
                break;
            case 'profileSection':
                if (window.loadUserProfile) {
                    window.loadUserProfile();
                }
                break;
            case 'teamSection':
                if (window.initializeTeamManagement) {
                    window.initializeTeamManagement();
                }
                break;
            case 'valid360Section':
                if (window.initializeValid360) {
                    window.initializeValid360();
                }
                break;
        }
    }

    showDefaultSection() {
        // Show the overview section by default
        this.showSection('overviewSection');
        
        // Update VALID Assessment Card with user data
        setTimeout(() => {
            if (window.updateVALIDCard) {
                window.updateVALIDCard();
            }
        }, 500);
    }

    // Utility methods
    getCurrentSection() {
        return this.currentSection;
    }

    isSectionActive(sectionId) {
        return this.currentSection === sectionId;
    }
}

// Export for global use
window.DashboardCore = DashboardCore; 