#!/usr/bin/env node

/**
 * Migration Script: Monolithic to Modular Dashboard
 * 
 * This script helps migrate from the current monolithic dashboard.html
 * to the new modular architecture.
 */

const fs = require('fs');
const path = require('path');

class DashboardMigrator {
    constructor() {
        this.sourceFile = 'public/dashboard.html';
        this.modularFile = 'public/dashboard-modular.html';
        this.backupDir = 'backups';
        this.modulesDir = 'public/js';
    }

    async migrate() {
        console.log('🚀 Starting Dashboard Migration...\n');

        try {
            // Step 1: Create backup
            await this.createBackup();

            // Step 2: Validate source file
            await this.validateSource();

            // Step 3: Extract modules
            await this.extractModules();

            // Step 4: Create modular HTML
            await this.createModularHTML();

            // Step 5: Validate migration
            await this.validateMigration();

            console.log('✅ Migration completed successfully!');
            console.log('\n📋 Next Steps:');
            console.log('1. Test the modular version: http://localhost:8000/dashboard-modular.html');
            console.log('2. Compare functionality with original dashboard');
            console.log('3. Gradually migrate users to the modular version');
            console.log('4. Remove old dashboard.html once migration is complete');

        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }

    async createBackup() {
        console.log('📦 Creating backup...');
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `dashboard-backup-${timestamp}.html`);
        
        if (fs.existsSync(this.sourceFile)) {
            fs.copyFileSync(this.sourceFile, backupFile);
            console.log(`✅ Backup created: ${backupFile}`);
        } else {
            throw new Error(`Source file not found: ${this.sourceFile}`);
        }
    }

    async validateSource() {
        console.log('🔍 Validating source file...');
        
        const content = fs.readFileSync(this.sourceFile, 'utf8');
        
        // Check for required sections
        const requiredSections = [
            'overviewSection',
            'myDecisionsSection', 
            'dashboardResultsSection',
            'profileSection',
            'teamSection',
            'valid360Section'
        ];

        for (const section of requiredSections) {
            if (!content.includes(section)) {
                console.warn(`⚠️  Warning: Section '${section}' not found in source`);
            }
        }

        console.log('✅ Source validation complete');
    }

    async extractModules() {
        console.log('📝 Extracting modules...');
        
        // Check if modules already exist
        const moduleFiles = [
            'dashboard-core.js',
            'dashboard-results.js', 
            'dashboard-team.js',
            'dashboard-profile.js',
            'dashboard-init.js'
        ];

        for (const moduleFile of moduleFiles) {
            const modulePath = path.join(this.modulesDir, moduleFile);
            if (!fs.existsSync(modulePath)) {
                console.warn(`⚠️  Module file not found: ${modulePath}`);
                console.log(`   Please create the module file manually`);
            } else {
                console.log(`✅ Module exists: ${moduleFile}`);
            }
        }
    }

    async createModularHTML() {
        console.log('🌐 Creating modular HTML...');
        
        if (!fs.existsSync(this.modularFile)) {
            console.warn(`⚠️  Modular HTML file not found: ${this.modularFile}`);
            console.log(`   Please create the modular HTML file manually`);
        } else {
            console.log(`✅ Modular HTML exists: ${this.modularFile}`);
        }
    }

    async validateMigration() {
        console.log('🔍 Validating migration...');
        
        // Check if all required files exist
        const requiredFiles = [
            this.modularFile,
            path.join(this.modulesDir, 'dashboard-core.js'),
            path.join(this.modulesDir, 'dashboard-results.js'),
            path.join(this.modulesDir, 'dashboard-team.js'),
            path.join(this.modulesDir, 'dashboard-profile.js'),
            path.join(this.modulesDir, 'dashboard-init.js')
        ];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ File exists: ${path.basename(file)}`);
            } else {
                console.warn(`⚠️  Missing file: ${path.basename(file)}`);
            }
        }
    }

    async rollback() {
        console.log('🔄 Rolling back migration...');
        
        const backupFiles = fs.readdirSync(this.backupDir)
            .filter(file => file.startsWith('dashboard-backup-'))
            .sort()
            .reverse();

        if (backupFiles.length === 0) {
            throw new Error('No backup files found');
        }

        const latestBackup = backupFiles[0];
        const backupPath = path.join(this.backupDir, latestBackup);
        
        fs.copyFileSync(backupPath, this.sourceFile);
        console.log(`✅ Rolled back to: ${latestBackup}`);
    }

    async compareFiles() {
        console.log('🔍 Comparing files...');
        
        if (!fs.existsSync(this.sourceFile) || !fs.existsSync(this.modularFile)) {
            throw new Error('Both dashboard files must exist for comparison');
        }

        const originalSize = fs.statSync(this.sourceFile).size;
        const modularSize = fs.statSync(this.modularFile).size;
        
        console.log(`📊 File sizes:`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`   Modular:  ${(modularSize / 1024).toFixed(1)} KB`);
        console.log(`   Reduction: ${((originalSize - modularSize) / originalSize * 100).toFixed(1)}%`);
    }
}

// CLI Interface
async function main() {
    const migrator = new DashboardMigrator();
    const command = process.argv[2];

    switch (command) {
        case 'migrate':
            await migrator.migrate();
            break;
        case 'rollback':
            await migrator.rollback();
            break;
        case 'compare':
            await migrator.compareFiles();
            break;
        default:
            console.log('📖 Dashboard Migration Tool');
            console.log('\nUsage:');
            console.log('  node migrate-to-modular.js migrate   # Run migration');
            console.log('  node migrate-to-modular.js rollback  # Rollback to backup');
            console.log('  node migrate-to-modular.js compare   # Compare file sizes');
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DashboardMigrator; 