/**
 * Development Helper Functions
 * These functions are for development/testing purposes only
 */

import { logger } from './logger.js';
import validAssessmentData from './questions-data.js';
import { calculateScores } from './scoring.js';
import assessmentManager from './assessment-manager.js';
import stateManager from './state-manager.js';

// Generate random score between min and max
function randomScore(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate mock demographics data
function getMockDemographics() {
    return {
        department: 'Engineering',
        role: 'Senior Developer',
        experience: '5-10 years',
        industry: 'Technology',
        email: 'test@example.com'
    };
}

// Generate mock answers for all questions
function generateMockAnswers() {
    console.log('Generating mock answers...');
    const answers = {};
    
    // Create a personality profile (1-7 scale)
    const profile = {
        verity: 5,      // High analytical
        association: 4,  // Moderate relationship
        lived: 6,       // Very high experience
        institutional: 3, // Low-moderate institutional
        desire: 5       // High visionary
    };
    
    // Add some random variation (-1 to +1)
    function addVariation(baseScore) {
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(1, Math.min(7, baseScore + variation)); // Keep within 1-7
    }
    
    validAssessmentData.questions.forEach(question => {
        // Skip non-scoring questions
        if (question.dimension === 'attention_check' || question.dimension === 'social_desirability') {
            if (question.dimension === 'attention_check') {
                // Always answer attention checks correctly
                answers[question.id] = question.correctAnswer;
            }
            return;
        }
        
        // Get base score for this dimension
        const baseScore = profile[question.dimension];
        
        // Generate answer with some variation
        let score = addVariation(baseScore);
        
        // Handle reverse scoring questions
        if (question.reverse) {
            score = 8 - score; // Reverse on 1-7 scale
        }
        
        answers[question.id] = score;
    });
    
    console.log('Generated answers:', answers);
    return answers;
}

// Generate random answers
function generateRandomAnswers(questions) {
    const answers = {};
    questions.forEach(question => {
        answers[question.id] = randomScore(1, 7);
    });
    return answers;
}

// Initialize quick test button
export function initDevHelpers() {
    const quickTestBtn = document.getElementById('quickTest');
    if (quickTestBtn) {
        quickTestBtn.addEventListener('click', runQuickTest);
        quickTestBtn.style.display = 'inline-block';
    }
} 