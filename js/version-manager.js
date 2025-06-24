/**
 * Version Manager
 * Handles version display and updates for deployment tracking
 */

class VersionManager {
    constructor() {
        this.version = '1.0.1';
        this.buildDate = '2024-01-15';
        this.deploymentId = this.generateDeploymentId();
        this.init();
    }

    generateDeploymentId() {
        // Generate a short deployment ID based on timestamp
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6);
        return `${timestamp.toString(36)}-${random}`.toUpperCase();
    }

    init() {
        this.updateVersionDisplay();
        this.addVersionToWindow();
        this.logVersion();
    }

    updateVersionDisplay() {
        const versionElement = document.getElementById('versionText');
        if (versionElement) {
            versionElement.textContent = `v${this.version} (${this.buildDate})`;
        }
    }

    addVersionToWindow() {
        // Make version available globally for debugging
        window.APP_VERSION = {
            version: this.version,
            buildDate: this.buildDate,
            deploymentId: this.deploymentId,
            timestamp: Date.now()
        };
    }

    logVersion() {
        if (window.logger) {
            window.logger.info('Application version loaded', {
                version: this.version,
                buildDate: this.buildDate,
                deploymentId: this.deploymentId
            });
        } else {
            console.log(`[VERSION] ${this.version} (${this.buildDate}) - ${this.deploymentId}`);
        }
    }

    // Method to update version (can be called after deployment)
    updateVersion(newVersion, newBuildDate) {
        this.version = newVersion;
        this.buildDate = newBuildDate || new Date().toISOString().split('T')[0];
        this.updateVersionDisplay();
        this.addVersionToWindow();
        this.logVersion();
    }
}

// Create and export version manager instance
const versionManager = new VersionManager();
export { versionManager }; 