/**
 * VALID Assessment Application Entry Point
 * Initializes the assessment controller and sets up global error handling
 */

import { AssessmentController } from './assessment-controller.js';
import { logger } from './logger.js';
import { showError } from './utils.js';
import { setupEventHandlers } from './event-handlers.js';
import supabaseClient, { initializeSupabase } from './supabase-client.js';

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
    const errorInfo = {
        message,
        filename: source,
        lineno,
        colno,
        error: error?.toString() || {},
        stack: error?.stack
    };
    
    logger.error('Global error:', errorInfo);
};

// Environment configuration
const env = {
    VALID_ENV: window.VALID_ENV || 'development',
    SUPABASE_URL: window.SUPABASE_URL || 'https://txqtbblkrqmydkjztaip.supabase.co',
    SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY,
    EMAILJS_SERVICE_ID: window.EMAILJS_SERVICE_ID || '',
    EMAILJS_TEMPLATE_ID: window.EMAILJS_TEMPLATE_ID || '',
    EMAILJS_USER_ID: window.EMAILJS_USER_ID || '',
    SANDBOX_EMAIL: window.SANDBOX_EMAIL || 'test@example.com'
};

// Server configuration
const SERVER_PORT = window.location.port || '3003';
const SERVER_URL = `${window.location.protocol}//${window.location.hostname}:${SERVER_PORT}`;

// Debug logging
console.log('Environment variables loaded:', {
    env: env.VALID_ENV,
    hasSupabaseUrl: !!env.SUPABASE_URL,
    hasSupabaseKey: !!env.SUPABASE_ANON_KEY
});

// Initialize assessment controller when DOM is ready
async function initializeApp() {
    try {
        logger.info('Initializing application...');
        
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Initialize Supabase in the background (non-blocking)
        initializeSupabase().catch(error => {
            logger.warn('Supabase initialization warning:', error);
        });
        
        // Create and initialize controller instance
        const controller = new AssessmentController();
        await controller.init();
        
        // Store controller instance globally
        window.assessmentController = controller;
        
        // Verify initialization
        if (!controller.state.isInitialized) {
            throw new Error('Controller failed to initialize properly');
        }

        // Wait a short moment for any dynamic content to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify button setup with detailed logging
        const startButton = document.getElementById('startAssessment');
        logger.debug('Start button verification:', {
            buttonExists: !!startButton,
            buttonId: startButton?.id,
            buttonClasses: startButton?.className,
            buttonVisibility: startButton?.style?.display,
            buttonParent: startButton?.parentElement?.id,
            welcomeSectionExists: !!document.getElementById('welcomeSection'),
            welcomeSectionActive: document.getElementById('welcomeSection')?.classList.contains('active')
        });

        if (!startButton) {
            throw new Error('Start button not found after initialization');
        }

        // Setup event handlers
        setupEventHandlers(controller);
        
        // Log successful initialization
        logger.success('Application initialized successfully', {
            currentSection: controller.currentSection,
            startButtonExists: !!document.getElementById('startAssessment'),
            welcomeSectionExists: !!document.getElementById('welcomeSection'),
            startButtonState: {
                disabled: startButton.disabled,
                classes: startButton.className,
                style: {
                    display: startButton.style.display,
                    visibility: startButton.style.visibility,
                    pointerEvents: startButton.style.pointerEvents,
                    zIndex: startButton.style.zIndex,
                    position: startButton.style.position
                }
            }
        });
    } catch (error) {
        logger.error('Failed to initialize application:', {
            error: error.message,
            stack: error.stack,
            domState: {
                readyState: document.readyState,
                welcomeSection: !!document.getElementById('welcomeSection'),
                startButton: !!document.getElementById('startAssessment')
            }
        });
        throw error;
    }
}

// Export for use in main.js
export { initializeApp };

// Initialize database connection
async function initDatabase() {
    // This is a placeholder for actual database initialization
    // Replace with actual database connection code
    return new Promise(resolve => setTimeout(resolve, 100));
} 