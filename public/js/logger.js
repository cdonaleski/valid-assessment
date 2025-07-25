/**
 * VALID Assessment Logger
 * Provides logging functionality with debug panel integration
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    RESPONSE: 1, // Same level as INFO
    SUCCESS: 1   // Same level as INFO
};

const LOG_COLORS = {
    DEBUG: '#2196F3',   // blue
    INFO: '#4CAF50',    // green
    WARN: '#FFC107',    // amber
    ERROR: '#F44336',   // red
    RESPONSE: '#8BC34A', // light green
    SUCCESS: '#66BB6A'  // light green
};

// Create a singleton instance
let loggerInstance = null;

class Logger {
    constructor() {
        // Ensure singleton
        if (loggerInstance) {
            return loggerInstance;
        }
        loggerInstance = this;
        
        this.level = window.__env__?.VALID_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
        this.history = [];
        this.maxHistory = 100;
        
        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }

        return this;
    }

    initialize() {
        this.debugPanel = document.getElementById('debugPanel');
        this.debugLogs = document.getElementById('debugLogs');
        this.clearDebugBtn = document.getElementById('clearDebugBtn');
        this.toggleDebugBtn = document.getElementById('toggleDebugBtn');
        this.copyDebugBtn = document.getElementById('copyDebugBtn');
        
        if (!this.debugPanel) {
            this.createDebugPanel();
        }
        
        // Initialize with panel open
        this.isMinimized = false;
        this.debugPanel.classList.remove('minimized');
        if (this.toggleDebugBtn) {
            this.toggleDebugBtn.textContent = '□';
        }
        
        this.setupEventListeners();
        this.info('Debug panel initialized', { state: 'open' });
    }

    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.className = 'debug-panel';
        
        const header = document.createElement('div');
        header.className = 'debug-header';
        
        const title = document.createElement('span');
        title.textContent = 'Debug Panel';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'debug-buttons';
        
        const copyBtn = document.createElement('button');
        copyBtn.id = 'copyDebugBtn';
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy logs to clipboard';
        
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearDebugBtn';
        clearBtn.textContent = '🗑️';
        clearBtn.title = 'Clear logs';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleDebugBtn';
        toggleBtn.textContent = '□';
        toggleBtn.title = 'Toggle panel';
        
        buttonContainer.appendChild(copyBtn);
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(toggleBtn);
        
        header.appendChild(title);
        header.appendChild(buttonContainer);
        
        const logs = document.createElement('div');
        logs.id = 'debugLogs';
        logs.className = 'debug-logs';
        
        panel.appendChild(header);
        panel.appendChild(logs);
        
        document.body.appendChild(panel);
        
        this.debugPanel = panel;
        this.debugLogs = logs;
        this.clearDebugBtn = clearBtn;
        this.toggleDebugBtn = toggleBtn;
        this.copyDebugBtn = copyBtn;
    }

    setupEventListeners() {
        if (this.toggleDebugBtn) {
            this.toggleDebugBtn.addEventListener('click', () => this.togglePanel());
        }

        if (this.clearDebugBtn) {
            this.clearDebugBtn.addEventListener('click', () => this.clearLogs());
        }

        if (this.copyDebugBtn) {
            this.copyDebugBtn.addEventListener('click', () => this.copyLogs());
        }

        // Make the debug header draggable
        const debugHeader = this.debugPanel.querySelector('.debug-header');
        if (debugHeader) {
            debugHeader.style.cursor = 'move';
            this.makeDraggable(debugHeader);
        }

        // Double-click header to toggle panel
        debugHeader?.addEventListener('dblclick', () => this.togglePanel());
    }

    copyLogs() {
        try {
            // Get all log entries
            const logs = Array.from(this.debugLogs.children).map(logEl => {
                const timestamp = logEl.querySelector('.debug-timestamp')?.textContent || '';
                const message = logEl.querySelector('.debug-message')?.textContent || '';
                const data = logEl.querySelector('.debug-data')?.textContent || '';
                return `[${timestamp}] ${message}${data ? '\n' + data : ''}`;
            }).join('\n');

            // Copy to clipboard
            navigator.clipboard.writeText(logs).then(() => {
                // Show visual feedback
                this.copyDebugBtn.textContent = '✓';
                setTimeout(() => {
                    this.copyDebugBtn.textContent = '📋';
                }, 2000);
            }).catch(error => {
                // Fallback to older method
                const textarea = document.createElement('textarea');
                textarea.value = logs;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                // Show visual feedback
                this.copyDebugBtn.textContent = '✓';
                setTimeout(() => {
                    this.copyDebugBtn.textContent = '📋';
                }, 2000);
            });

            this.debug('Debug logs copied to clipboard');
        } catch (error) {
            this.error('Failed to copy debug logs:', error);
        }
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;
        
        element.onmousedown = dragMouseDown.bind(this);
        element.ontouchstart = dragTouchStart.bind(this);
        
        const panel = this.debugPanel;
        
        function dragMouseDown(e) {
            if (e.target !== element) return; // Only drag from header
            e.preventDefault();
            isDragging = true;
            panel.classList.add('dragging');
            
            // Get the initial position
            const style = window.getComputedStyle(panel);
            const top = parseInt(style.top) || window.innerHeight - panel.offsetHeight - 10;
            const left = parseInt(style.left) || window.innerWidth - panel.offsetWidth - 10;
            
            // Always use top/left positioning
            panel.style.top = top + 'px';
            panel.style.left = left + 'px';
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmousemove = elementDrag;
            document.onmouseup = closeDragElement;
        }

        function dragTouchStart(e) {
            if (e.target !== element) return;
            e.preventDefault();
            isDragging = true;
            panel.classList.add('dragging');
            
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            document.ontouchmove = elementTouchDrag;
            document.ontouchend = closeDragElement;
        }
        
        function elementDrag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Calculate new position
            let newTop = panel.offsetTop - pos2;
            let newLeft = panel.offsetLeft - pos1;
            
            // Add bounds checking
            newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop));
            newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft));
            
            panel.style.top = newTop + "px";
            panel.style.left = newLeft + "px";
        }

        function elementTouchDrag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            // Calculate new position
            let newTop = panel.offsetTop - pos2;
            let newLeft = panel.offsetLeft - pos1;
            
            // Add bounds checking
            newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop));
            newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft));
            
            panel.style.top = newTop + "px";
            panel.style.left = newLeft + "px";
        }
        
        function closeDragElement() {
            isDragging = false;
            panel.classList.remove('dragging');
            document.onmousemove = null;
            document.onmouseup = null;
            document.ontouchmove = null;
            document.ontouchend = null;
        }
    }

    togglePanel() {
        this.isMinimized = !this.isMinimized;
        this.debugPanel.classList.toggle('minimized');
        if (this.toggleDebugBtn) {
            this.toggleDebugBtn.textContent = this.isMinimized ? '□' : '□';
        }
        
        if (!this.isMinimized) {
            this.debugLogs.scrollTop = this.debugLogs.scrollHeight;
        }
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

        return logEntry;
    }

    addToDebugPanel(level, message, data) {
        if (!this.debugLogs) return;

        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        // Create log entry
        const logEntry = document.createElement('div');
        logEntry.className = `debug-log ${level.toLowerCase()}`;
        
        // Create timestamp element
        const timestampEl = document.createElement('span');
        timestampEl.className = 'debug-timestamp';
        timestampEl.textContent = timestamp;
        
        // Create message element
        const messageEl = document.createElement('span');
        messageEl.className = 'debug-message';
        messageEl.textContent = message;
        
        // Add timestamp and message
        logEntry.appendChild(timestampEl);
        logEntry.appendChild(messageEl);

        // Add data if present
        if (Object.keys(data).length > 0) {
            if (level === 'RESPONSE') {
                // Special handling for response data
                const responseEl = document.createElement('div');
                responseEl.className = 'debug-response';
                
                for (const [key, value] of Object.entries(data)) {
                    const row = document.createElement('div');
                    row.style.display = 'contents';
                    
                    const label = document.createElement('span');
                    label.className = 'debug-response-label';
                    label.textContent = key;
                    
                    const valueEl = document.createElement('span');
                    valueEl.className = 'debug-response-value';
                    valueEl.textContent = typeof value === 'object' ? 
                        JSON.stringify(value, null, 2) : value;
                    
                    row.appendChild(label);
                    row.appendChild(valueEl);
                    responseEl.appendChild(row);
                }
                
                logEntry.appendChild(responseEl);
            } else {
                const dataEl = document.createElement('pre');
                dataEl.className = 'debug-data';
                dataEl.textContent = JSON.stringify(data, null, 2);
                logEntry.appendChild(dataEl);
            }
        }

        // Add to debug panel
        this.debugLogs.appendChild(logEntry);
        this.debugLogs.scrollTop = this.debugLogs.scrollHeight;

        // Remove old logs if exceeding maxHistory
        while (this.debugLogs.children.length > this.maxHistory) {
            this.debugLogs.removeChild(this.debugLogs.firstChild);
        }
    }

    log(level, message, data = {}) {
        if (LOG_LEVELS[level] >= this.level) {
            // Format for console
            const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`;
            
            // Map log levels to console methods
            let consoleMethod = level.toLowerCase();
            if (consoleMethod === 'response' || consoleMethod === 'success') {
                consoleMethod = 'info';
            }
            
            if (typeof console[consoleMethod] === 'function') {
                console[consoleMethod](`%c[${level}] ${message}`, style, data);
            } else {
                console.log(`%c[${level}] ${message}`, style, data);
            }

            // Add to debug panel
            this.addToDebugPanel(level, message, data);

            // Format and store in history
            this.formatMessage(level, message, data);
        }
    }

    debug(message, data = {}) {
        this.log('DEBUG', message, data);
    }

    info(message, data = {}) {
        this.log('INFO', message, data);
    }

    warn(message, data = {}) {
        this.log('WARN', message, data);
    }

    error(message, data = {}) {
        // For errors, also log stack trace if available
        if (data.error instanceof Error) {
            data.stack = data.error.stack;
        }
        this.log('ERROR', message, data);
    }

    response(message, data = {}) {
        this.log('RESPONSE', message, data);
    }

    success(message, data = {}) {
        this.log('SUCCESS', message, data); // Use SUCCESS level
    }

    // Get recent logs for debugging
    getLogs() {
        return this.history;
    }

    // Clear log history
    clearLogs() {
        this.history = [];
        if (this.debugLogs) {
            this.debugLogs.innerHTML = '';
        }
        this.debug('Debug logs cleared');
    }

    // Change log level
    setLevel(level) {
        if (LOG_LEVELS[level] !== undefined) {
            this.level = LOG_LEVELS[level];
            this.debug(`Log level set to ${level}`);
        }
    }
}

// Create and export a singleton instance
const logger = new Logger();
export { logger };

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