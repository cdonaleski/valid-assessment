import { initDevHelpers } from './dev-helpers.js';
import { logger } from './logger.js';
import { initializeApp } from './app.js';
import { showError } from './utils.js';

// Wait for DOM to be ready
async function init() {
    try {
        // Initialize dev helpers
        console.log('Initializing dev helpers...');
        initDevHelpers();
        
        // Initialize main app
        console.log('Initializing assessment controller...');
        await initializeApp();
        
        // Log successful initialization
        console.log('App initialization complete');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        logger.error('Application initialization failed:', error);
        
        // Show error to user
        showError('Failed to initialize application. Please refresh the page.');
        
        // Create error div for visibility
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'display: block; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #fee; color: #c00; padding: 1rem; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
        errorDiv.textContent = 'Failed to initialize application. Please refresh the page.';
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
} 