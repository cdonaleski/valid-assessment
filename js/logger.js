/**
 * VALID Assessment Production Logger
 * Provides controlled logging functionality for both development and production environments
 */

// Enhanced logger for better error tracking
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const LOG_COLORS = {
    DEBUG: '#808080', // gray
    INFO: '#0066cc',  // blue
    WARN: '#ff9900',  // orange
    ERROR: '#cc0000'  // red
};

class Logger {
    constructor() {
        this.level = window.__env__?.VALID_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
        this.history = [];
        this.maxHistory = 100;
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        // Keep history for debugging
        this.history.unshift(logEntry);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        // Format console output
        const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`;
        return [`%c[${level}] ${message}`, style, data];
    }

    debug(message, data = {}) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.debug(...this.formatMessage('DEBUG', message, data));
        }
    }

    info(message, data = {}) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.info(...this.formatMessage('INFO', message, data));
        }
    }

    warn(message, data = {}) {
        if (this.level <= LOG_LEVELS.WARN) {
            console.warn(...this.formatMessage('WARN', message, data));
        }
    }

    error(message, data = {}) {
        if (this.level <= LOG_LEVELS.ERROR) {
            // For errors, also log stack trace if available
            if (data.error instanceof Error) {
                data.stack = data.error.stack;
            }
            console.error(...this.formatMessage('ERROR', message, data));
        }
    }

    // Get recent logs for debugging
    getLogs() {
        return this.history;
    }

    // Clear log history
    clearLogs() {
        this.history = [];
    }

    // Change log level
    setLevel(level) {
        if (LOG_LEVELS[level] !== undefined) {
            this.level = LOG_LEVELS[level];
        }
    }
}

export const logger = new Logger();

// Add error event listeners
window.addEventListener('error', (event) => {
    logger.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', {
        reason: event.reason,
        stack: event.reason?.stack
    });
}); 