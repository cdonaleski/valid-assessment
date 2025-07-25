import { logger } from './logger.js';
import stateManager from './state-manager.js';

class SessionManager {
    constructor() {
        this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        this.INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
        this.lastActivity = Date.now();
        this.sessionTimer = null;
        this.inactivityTimer = null;
        this.isAuthenticated = false;
        
        // Bind methods
        this.resetTimers = this.resetTimers.bind(this);
        this.checkSession = this.checkSession.bind(this);
        this.handleActivity = this.handleActivity.bind(this);
        
        // Initialize session
        this.initializeSession();
    }

    initializeSession() {
        try {
            // Add activity listeners
            window.addEventListener('mousemove', this.handleActivity);
            window.addEventListener('keypress', this.handleActivity);
            window.addEventListener('click', this.handleActivity);
            window.addEventListener('scroll', this.handleActivity);
            window.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

            // Start session
            this.startSession();
            
            logger.info('Session manager initialized');
        } catch (error) {
            logger.error('Failed to initialize session manager:', error);
        }
    }

    handleActivity() {
        this.lastActivity = Date.now();
        this.resetTimers();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, start shorter timeout
            this.startInactivityTimer(5 * 60 * 1000); // 5 minutes
        } else {
            // Page is visible again, reset to normal timeout
            this.resetTimers();
        }
    }

    startSession() {
        // Clear any existing timers
        this.clearTimers();
        
        // Set session expiry
        const expiry = Date.now() + this.SESSION_TIMEOUT;
        sessionStorage.setItem('sessionExpiry', expiry.toString());
        
        // Start timers
        this.resetTimers();
        
        this.isAuthenticated = true;
        logger.info('Session started');
    }

    resetTimers() {
        this.clearTimers();
        
        // Set new timers
        this.sessionTimer = setTimeout(() => {
            this.endSession('Session timeout');
        }, this.SESSION_TIMEOUT);
        
        this.startInactivityTimer(this.INACTIVITY_TIMEOUT);
    }

    startInactivityTimer(timeout) {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.inactivityTimer = setTimeout(() => {
            const inactiveTime = Date.now() - this.lastActivity;
            if (inactiveTime >= timeout) {
                this.endSession('Inactivity timeout');
            }
        }, timeout);
    }

    clearTimers() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
    }

    async endSession(reason = 'User logout') {
        try {
            // Clear timers
            this.clearTimers();
            
            // Clear session storage
            sessionStorage.clear();
            
            // Reset state
            await stateManager.clearState();
            
            this.isAuthenticated = false;
            
            // Dispatch session end event
            window.dispatchEvent(new CustomEvent('sessionEnd', {
                detail: { reason }
            }));
            
            logger.info('Session ended:', { reason });
            
            // Redirect to start page
            window.location.href = '/';
        } catch (error) {
            logger.error('Error ending session:', error);
        }
    }

    checkSession() {
        try {
            const expiry = parseInt(sessionStorage.getItem('sessionExpiry'), 10);
            if (!expiry || Date.now() > expiry) {
                this.endSession('Session expired');
                return false;
            }
            return true;
        } catch (error) {
            logger.error('Error checking session:', error);
            return false;
        }
    }

    getSessionStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            lastActivity: this.lastActivity,
            sessionExpiry: parseInt(sessionStorage.getItem('sessionExpiry'), 10) || null,
            remainingTime: Math.max(0, (parseInt(sessionStorage.getItem('sessionExpiry'), 10) || 0) - Date.now())
        };
    }
}

// Export singleton instance
export default new SessionManager(); 