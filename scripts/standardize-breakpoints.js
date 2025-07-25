#!/usr/bin/env node

/**
 * Standardize Breakpoints Script
 * 
 * This script helps standardize responsive breakpoints across all CSS files
 * by updating media queries to use the new centralized variables.
 * 
 * Usage: node scripts/standardize-breakpoints.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Standardized breakpoints
const BREAKPOINTS = {
  xlarge: '1200px',
  large: '1024px',
  medium: '900px',
  tablet: '768px',
  mobile: '480px'
};

// Breakpoint mapping for conversion
const BREAKPOINT_MAPPING = {
  '1200px': 'var(--breakpoint-xlarge)',
  '1024px': 'var(--breakpoint-large)',
  '900px': 'var(--breakpoint-medium)',
  '768px': 'var(--breakpoint-tablet)',
  '480px': 'var(--breakpoint-mobile)',
  '700px': 'var(--breakpoint-tablet)', // Map 700px to tablet
  '800px': 'var(--breakpoint-medium)', // Map 800px to medium
  '1100px': 'var(--breakpoint-large)', // Map 1100px to large
};

// CSS files to process
const CSS_FILES = [
  'css/style.css',
  'css/layout.css',
  'css/components.css',
  'css/dashboard.css',
  'css/results.css',
  'css/team-management.css',
  'css/profile.css',
  'css/sidebar.css',
  'css/mobile.css',
  'css/gamification.css',
  'css/my-results.css'
];

/**
 * Convert hardcoded breakpoints to CSS variables
 */
function standardizeBreakpoints(cssContent) {
  let updatedContent = cssContent;
  let changes = 0;

  // Replace hardcoded breakpoints with CSS variables
  Object.entries(BREAKPOINT_MAPPING).forEach(([oldBreakpoint, newBreakpoint]) => {
    const regex = new RegExp(`@media\\s*\\(\\s*max-width\\s*:\\s*${oldBreakpoint}\\s*\\)`, 'g');
    const matches = updatedContent.match(regex);
    
    if (matches) {
      updatedContent = updatedContent.replace(regex, `@media (max-width: ${newBreakpoint})`);
      changes += matches.length;
      console.log(`  ✓ Replaced ${matches.length} instances of ${oldBreakpoint} with ${newBreakpoint}`);
    }
  });

  // Also handle min-width queries
  Object.entries(BREAKPOINT_MAPPING).forEach(([oldBreakpoint, newBreakpoint]) => {
    const regex = new RegExp(`@media\\s*\\(\\s*min-width\\s*:\\s*${oldBreakpoint}\\s*\\)`, 'g');
    const matches = updatedContent.match(regex);
    
    if (matches) {
      updatedContent = updatedContent.replace(regex, `@media (min-width: ${newBreakpoint})`);
      changes += matches.length;
      console.log(`  ✓ Replaced ${matches.length} instances of min-width ${oldBreakpoint} with ${newBreakpoint}`);
    }
  });

  return { content: updatedContent, changes };
}

/**
 * Add CSS variables import if not present
 */
function ensureVariablesImport(cssContent, filePath) {
  // Skip if it's the variables file itself
  if (filePath.includes('variables.css')) {
    return cssContent;
  }

  // Check if variables are already imported
  if (cssContent.includes('@import') && cssContent.includes('variables.css')) {
    return cssContent;
  }

  // Add import at the beginning
  const importStatement = '@import "variables.css";\n\n';
  return importStatement + cssContent;
}

/**
 * Process a single CSS file
 */
function processCSSFile(filePath) {
  try {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Standardize breakpoints
    const { content: updatedContent, changes } = standardizeBreakpoints(content);
    
    // Ensure variables import
    const finalContent = ensureVariablesImport(updatedContent, filePath);
    
    // Write back to file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    
    console.log(`  ✅ Updated ${changes} breakpoints`);
    console.log(`  📝 File saved: ${filePath}`);
    
    return changes;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Generate a summary report
 */
function generateReport(totalChanges, processedFiles) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 STANDARDIZATION REPORT');
  console.log('='.repeat(60));
  console.log(`📁 Files processed: ${processedFiles}`);
  console.log(`🔄 Total breakpoints updated: ${totalChanges}`);
  console.log(`🎯 Standardized breakpoints:`);
  
  Object.entries(BREAKPOINTS).forEach(([name, value]) => {
    console.log(`   - ${name}: ${value} → var(--breakpoint-${name})`);
  });
  
  console.log('\n📋 Next steps:');
  console.log('1. Test the application on different screen sizes');
  console.log('2. Verify that all responsive behavior works correctly');
  console.log('3. Run performance tests to ensure no regressions');
  console.log('4. Update any JavaScript that references breakpoints');
  
  console.log('\n🔧 Manual tasks:');
  console.log('- Review any custom breakpoints that weren\'t standardized');
  console.log('- Test edge cases and unusual screen sizes');
  console.log('- Update documentation with new breakpoint system');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting breakpoint standardization...');
  console.log('📋 Target files:', CSS_FILES.length);
  
  let totalChanges = 0;
  let processedFiles = 0;
  
  // Process each CSS file
  CSS_FILES.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const changes = processCSSFile(filePath);
      totalChanges += changes;
      processedFiles++;
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
  
  // Generate report
  generateReport(totalChanges, processedFiles);
  
  console.log('\n✅ Standardization complete!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  standardizeBreakpoints,
  BREAKPOINTS,
  BREAKPOINT_MAPPING
}; 