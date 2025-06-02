/**
 * VALID Assessment Production Logger
 * Provides controlled logging functionality for both development and production environments
 */

class Logger {
    constructor(options = {}) {
        this.options = {
            isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
            logLevel: window.location.hostname === 'localhost' ? 'debug' : 'error',
            enableConsole: true,
            enableRemote: false,
            remoteEndpoint: null,
            ...options
        };

        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        // Initialize log buffer
        this.logBuffer = [];
        this.maxBufferSize = 1000;
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message: String(message),
            data: data ? this.sanitizeData(data) : undefined
        };
    }

    sanitizeData(data) {
        try {
            if (data instanceof Error) {
                return {
                    message: data.message,
                    stack: data.stack,
                    name: data.name
                };
            }
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            return String(data);
        }
    }

    shouldLog(level) {
        const configuredLevel = this.logLevels[this.options.logLevel];
        const messageLevel = this.logLevels[level];
        return messageLevel >= configuredLevel;
    }

    addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    log(level, message, data) {
        try {
            if (!this.shouldLog(level)) return;

            const logEntry = this.formatMessage(level, message, data);
            this.addToBuffer(logEntry);

            if (this.options.enableConsole) {
                const consoleMethod = console[level] || console.log;
                if (data) {
                    consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
                } else {
                    consoleMethod(`[${level.toUpperCase()}] ${message}`);
                }
            }

            return logEntry;
        } catch (error) {
            console.error('Logging failed:', error);
            return null;
        }
    }

    debug(message, data) {
        return this.log('debug', message, data);
    }

    info(message, data) {
        return this.log('info', message, data);
    }

    warn(message, data) {
        return this.log('warn', message, data);
    }

    error(message, data) {
        return this.log('error', message, data);
    }

    getBuffer() {
        return [...this.logBuffer];
    }

    clearBuffer() {
        this.logBuffer = [];
    }
}

// Create and export logger instance
const logger = new Logger();

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

export { Logger, logger }; 