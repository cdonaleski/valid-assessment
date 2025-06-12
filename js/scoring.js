/**
 * VALID Assessment Tool - Scoring Module
 * Purpose: Implements the assessment scoring algorithms and calculations.
 * 
 * This module handles:
 * - Response scoring
 * - Pattern analysis
 * - Decision style categorization
 * - Score normalization
 * - Statistical analysis
 */ 

import { logger } from './logger.js';
import validAssessmentData from './questions-data.js';

// Import metadata from questions data
const { scale, dimensions, scoring } = validAssessmentData.metadata;

/**
 * VALID Assessment Scoring System
 * Calculates and analyzes decision-making style scores
 */

// Question type mappings (V-A-L-I-D)
const QUESTION_TYPES = {
    // Verity (Data-Driven) Questions
    V1: { type: 'V', reverse: false },
    V2: { type: 'V', reverse: false },
    V3: { type: 'V', reverse: false },
    V4: { type: 'V', reverse: false },
    V5: { type: 'V', reverse: false },
    V6: { type: 'V', reverse: false },
    V7: { type: 'V', reverse: false },
    V8: { type: 'V', reverse: false },
    V9: { type: 'V', reverse: false },
    V10: { type: 'V', reverse: false },

    // Association (Relationship) Questions
    A1: { type: 'A', reverse: false },
    A2: { type: 'A', reverse: false },
    A3: { type: 'A', reverse: false },
    A4: { type: 'A', reverse: false },
    A5: { type: 'A', reverse: false },
    A6: { type: 'A', reverse: false },
    A7: { type: 'A', reverse: false },
    A8: { type: 'A', reverse: false },
    A9: { type: 'A', reverse: false },
    A10: { type: 'A', reverse: false },

    // Lived Experience Questions
    L1: { type: 'L', reverse: false },
    L2: { type: 'L', reverse: false },
    L3: { type: 'L', reverse: false },
    L4: { type: 'L', reverse: false },
    L5: { type: 'L', reverse: false },
    L6: { type: 'L', reverse: false },
    L7: { type: 'L', reverse: false },
    L8: { type: 'L', reverse: false },
    L9: { type: 'L', reverse: false },
    L10: { type: 'L', reverse: false },

    // Institutional Knowledge Questions
    I1: { type: 'I', reverse: false },
    I2: { type: 'I', reverse: false },
    I3: { type: 'I', reverse: false },
    I4: { type: 'I', reverse: false },
    I5: { type: 'I', reverse: false },
    I6: { type: 'I', reverse: false },
    I7: { type: 'I', reverse: false },
    I8: { type: 'I', reverse: false },
    I9: { type: 'I', reverse: false },
    I10: { type: 'I', reverse: false },

    // Desire (Future-Focused) Questions
    D1: { type: 'D', reverse: false },
    D2: { type: 'D', reverse: false },
    D3: { type: 'D', reverse: false },
    D4: { type: 'D', reverse: false },
    D5: { type: 'D', reverse: false },
    D6: { type: 'D', reverse: false },
    D7: { type: 'D', reverse: false },
    D8: { type: 'D', reverse: false },
    D9: { type: 'D', reverse: false },
    D10: { type: 'D', reverse: false }
};

// Persona definitions with descriptions
const PERSONAS = {
    V: {
        name: "Analytical Validator",
        description: "Emphasizes data-driven decision making and empirical evidence"
    },
    A: {
        name: "Relational Harmonizer",
        description: "Prioritizes relationships and collaborative consensus building"
    },
    L: {
        name: "Experiential Navigator",
        description: "Relies on personal experience and practical wisdom"
    },
    I: {
        name: "Systematic Professional",
        description: "Values established procedures and institutional knowledge"
    },
    D: {
        name: "Visionary Innovator",
        description: "Focuses on future possibilities and transformative change"
    },
    BALANCED: {
        name: "Adaptive Strategist",
        description: "Demonstrates balanced use of multiple validation approaches"
    }
};

// Constants for scoring
const SCORING_CONSTANTS = {
    MIN_SCORE: 10,
    MAX_SCORE: 70,
    MIN_COMPLETION_TIME: 8 * 60 * 1000, // 8 minutes in milliseconds
    MAX_COMPLETION_TIME: 45 * 60 * 1000, // 45 minutes in milliseconds
    STRAIGHT_LINE_THRESHOLD: 0.8, // 80% same answers
    SD_THRESHOLD: 28 // Social desirability threshold
};

/**
 * Calculate raw scores for each VALID dimension
 * @param {Object} responses - Question responses with IDs and values
 * @returns {Object} Raw scores for each dimension
 */
function calculateRawScores(responses) {
    const scores = { V: 0, A: 0, L: 0, I: 0, D: 0 };
    const counts = { V: 0, A: 0, L: 0, I: 0, D: 0 };
    
    console.log('Starting raw score calculation with responses:', responses);

    Object.entries(responses).forEach(([questionId, value]) => {
        // Find the question in the validAssessmentData
        const question = validAssessmentData.questions.find(q => q.id === questionId);
        if (!question || question.dimension === 'attention_check' || question.dimension === 'social_desirability') {
            console.log('Skipping question:', { questionId, reason: 'Not found or quality check' });
            return;
        }

        console.log('Processing question:', {
            id: questionId,
            dimension: question.dimension,
            value: value,
            reverse: question.reverse
        });

        // Get dimension key (first letter uppercase)
        const dimension = question.dimension.charAt(0).toUpperCase();
        if (!scores.hasOwnProperty(dimension)) {
            console.warn('Invalid dimension:', { questionId, dimension });
            return;
        }

        // Convert value to number and apply reverse scoring if needed
        const numValue = typeof value === 'number' ? value : Number(value);
        const scoreValue = question.reverse ? (8 - numValue) : numValue;
        
        scores[dimension] += scoreValue;
        counts[dimension]++;

        console.log('Updated scores:', {
            dimension,
            rawValue: value,
            scoreValue,
            isReversed: question.reverse,
            currentTotal: scores[dimension],
            count: counts[dimension]
        });
    });

    // Calculate average for each dimension
    const averageScores = {};
    Object.keys(scores).forEach(dimension => {
        if (counts[dimension] > 0) {
            // Calculate average (keeping raw 1-7 scale)
            averageScores[dimension] = scores[dimension] / counts[dimension];
        } else {
            averageScores[dimension] = 0;
        }
        console.log('Final dimension score:', {
            dimension,
            rawTotal: scores[dimension],
            count: counts[dimension],
            average: averageScores[dimension]
        });
    });

    return averageScores;
}

/**
 * Convert raw scores (1-7 scale) to percentages (0-100)
 * @param {Object} rawScores - Raw scores on 1-7 scale
 * @returns {Object} Scores converted to percentages
 */
function convertToPercentages(rawScores) {
    console.log('Converting raw scores to percentages:', rawScores);
    
    const percentages = {};
    Object.entries(rawScores).forEach(([dimension, score]) => {
        // Convert from 1-7 scale to 0-100 percentage
        // Formula: ((score - min) / (max - min)) * 100
        percentages[dimension] = Math.round(((score - 1) / 6) * 100);
    });
    
    console.log('Converted to percentages:', percentages);
    return percentages;
}

/**
 * Calculate score spread and confidence level
 * @param {Object} scores - Percentage scores
 * @returns {Object} Confidence assessment
 */
function calculateConfidence(scores) {
    const values = Object.values(scores);
    const spread = Math.max(...values) - Math.min(...values);
    
    let level;
    if (spread > 30) {
        level = 'high';
    } else if (spread > 15) {
        level = 'medium';
    } else {
        level = 'low';
    }

    return {
        level,
        spread,
        description: getConfidenceDescription(level, spread)
    };
}

/**
 * Get descriptive text for confidence level
 * @param {string} level - Confidence level
 * @param {number} spread - Score spread
 * @returns {string} Confidence description
 */
function getConfidenceDescription(level, spread) {
    switch (level) {
        case 'high':
            return `Strong preference indicated (${spread}% spread between highest and lowest scores)`;
        case 'medium':
            return `Moderate preference indicated (${spread}% spread between scores)`;
        case 'low':
            return `Balanced use of multiple approaches (${spread}% spread between scores)`;
    }
}

/**
 * Identify primary and secondary validation styles
 * @param {Object} scores - Percentage scores
 * @returns {Object} Primary and secondary styles
 */
function assignPersona(scores) {
    const sortedTypes = Object.entries(scores)
        .sort(([,a], [,b]) => b - a);
    
    const highestScore = sortedTypes[0][1];
    const isBalanced = Object.values(scores)
        .every(score => score >= 40 && score <= 60);

    if (isBalanced) {
        return {
            primary: PERSONAS.BALANCED.name,
            description: PERSONAS.BALANCED.description,
            confidence: 'low'
        };
    }

    const primaryType = sortedTypes[0][0];
    const secondaryType = sortedTypes[1][0];

    return {
        primary: PERSONAS[primaryType].name,
        secondary: PERSONAS[secondaryType].name,
        description: PERSONAS[primaryType].description,
        confidence: highestScore >= 70 ? 'high' : 'medium'
    };
}

/**
 * Identify areas for development
 * @param {Object} scores - Percentage scores
 * @returns {Object} Development recommendations
 */
function identifyDevelopmentArea(scores) {
    const lowestType = Object.entries(scores)
        .sort(([,a], [,b]) => a - b)[0][0];

    return {
        area: PERSONAS[lowestType].name,
        type: lowestType,
        score: scores[lowestType],
        description: `Consider developing your ${PERSONAS[lowestType].name.toLowerCase()} approach`
    };
}

/**
 * Calculate assessment results
 * @param {Object} answers - Assessment answers
 * @param {string} context - Selected context (optional)
 * @returns {Object} Results including scores and persona
 */
export function calculateResults(answers, context = 'general') {
    try {
        console.log('Calculating results for context:', context);
        console.log('Answers:', answers);

        // Calculate raw scores first
        const rawScores = calculateRawScores(answers);
        console.log('Raw scores calculated:', rawScores);

        // Convert raw scores to percentages
        const scores = convertToPercentages(rawScores);
        console.log('Percentage scores:', scores);

        // Calculate confidence level
        const confidence = calculateConfidence(scores);
        console.log('Confidence calculated:', confidence);

        // Determine primary and secondary styles
        const styles = determinePersona(scores);
        console.log('Styles determined:', styles);

        // Generate development recommendations
        const development = identifyDevelopmentArea(scores);
        console.log('Development area identified:', development);

        return {
            scores,
            confidence,
            persona: {
                primary: styles.primary,
                secondary: styles.secondary,
                description: generatePersonaDescription(styles.primary, scores)
            },
            development
        };
    } catch (error) {
        console.error('Error calculating results:', error);
        throw error;
    }
}

/**
 * Calculate scores for the assessment
 * @param {Object} answers - Object containing question IDs and answer values
 * @param {string} startTime - ISO string of assessment start time
 * @returns {Object} Calculated scores and quality metrics
 */
export function calculateScores(answers, startTime) {
    try {
        console.log('Starting score calculation with answers:', answers);

        // Initialize scores
        const scores = {
            V: { raw: 0, count: 0 },
            A: { raw: 0, count: 0 },
            L: { raw: 0, count: 0 },
            I: { raw: 0, count: 0 },
            D: { raw: 0, count: 0 }
        };

        // Track answer patterns
        const answerFrequencies = {};
        let totalAnswers = 0;
        const invalidAnswers = [];

        console.log('Processing answers:', Object.entries(answers).length, 'total answers');

        // Process each answer
        Object.entries(answers).forEach(([questionId, value]) => {
            console.log('Processing answer:', { questionId, value });

            // Find the question in validAssessmentData
            const question = validAssessmentData.questions.find(q => q.id === questionId);
            if (!question) {
                console.warn('Question not found:', questionId);
                return;
            }

            // Skip non-scoring questions
            if (question.dimension === 'attention_check' || question.dimension === 'social_desirability') {
                console.log('Skipping non-scoring question:', questionId);
                return;
            }

            // Validate answer value
            if (typeof value !== 'number' || value < 1 || value > 7) {
                console.warn('Invalid answer value:', { questionId, value });
                return;
            }

            // Get dimension key (first letter uppercase)
            const dimensionKey = question.dimension.charAt(0).toUpperCase();
            
            // Score the answer
            const scoreValue = question.reverse ? (8 - value) : value;
            scores[dimensionKey].raw += scoreValue;
            scores[dimensionKey].count++;

            // Track answer frequency
            answerFrequencies[value] = (answerFrequencies[value] || 0) + 1;
            totalAnswers++;

            console.log('Updated scores for dimension:', {
                dimension: dimensionKey,
                raw: scores[dimensionKey].raw,
                count: scores[dimensionKey].count,
                isReversed: question.reverse,
                originalValue: value,
                scoreValue: scoreValue
            });
        });

        // Calculate final scores (convert to percentages)
        const finalScores = {};
        Object.entries(scores).forEach(([dimension, data]) => {
            if (data.count > 0) {
                // First calculate average on 1-7 scale
                const average = data.raw / data.count;
                // Then convert to percentage (0-100)
                finalScores[dimension] = Math.round(((average - 1) / 6) * 100);
            } else {
                finalScores[dimension] = 0;
            }
            console.log('Final score calculation:', {
                dimension,
                rawTotal: data.raw,
                count: data.count,
                average: data.count > 0 ? data.raw / data.count : 0,
                percentage: finalScores[dimension]
            });
        });

        // Calculate quality metrics
        const quality = {
            completionTime: Math.round((Date.now() - new Date(startTime).getTime()) / 1000),
            answerPatterns: calculateAnswerPatterns(answerFrequencies, totalAnswers),
            attentionChecks: validateAttentionChecks(answers),
            socialDesirability: calculateSocialDesirability(answers)
        };

        console.log('Final scores and quality metrics:', {
            scores: finalScores,
            quality: quality
        });

        return {
            scores: finalScores,
            quality
        };
    } catch (error) {
        console.error('Error calculating scores:', error);
        throw error;
    }
}

/**
 * Calculate answer pattern metrics
 */
function calculateAnswerPatterns(frequencies, total) {
    const patterns = {
        repetition: 0,
        extremity: 0
    };

    // Calculate repetition (same answer used frequently)
    Object.values(frequencies).forEach(freq => {
        if (freq > total * 0.3) { // More than 30% same answer
            patterns.repetition += (freq / total);
        }
    });

    // Calculate extremity (use of extreme values 1 and 7)
    const extremeAnswers = (frequencies[1] || 0) + (frequencies[7] || 0);
    patterns.extremity = extremeAnswers / total;

    return patterns;
}

/**
 * Validate attention check answers
 */
function validateAttentionChecks(answers) {
    const attentionChecks = validAssessmentData.questions.filter(q => 
        q.dimension === 'attention_check'
    );

    let passed = 0;
    let total = attentionChecks.length;

    attentionChecks.forEach(check => {
        if (answers[check.id] === check.correctAnswer) {
            passed++;
        }
    });

    return {
        passed,
        total,
        score: total > 0 ? passed / total : 0
    };
}

/**
 * Calculate social desirability score
 */
function calculateSocialDesirability(answers) {
    const sdQuestions = validAssessmentData.questions.filter(q => 
        q.dimension === 'social_desirability'
    );

    let total = 0;
    let count = 0;

    sdQuestions.forEach(question => {
        if (answers[question.id]) {
            total += answers[question.id];
            count++;
        }
    });

    return {
        score: count > 0 ? total / count : 0,
        questionCount: count
    };
}

/**
 * Validate a single answer
 */
export function validateAnswer(questionId, value) {
    try {
        const question = validAssessmentData.questions.find(q => q.id === questionId);
        if (!question) {
            logger.warn('Question not found for validation:', questionId);
            return false;
        }

        // Check value is within scale range
        if (value < validAssessmentData.metadata.scale.min || 
            value > validAssessmentData.metadata.scale.max) {
            return false;
        }

        // Special validation for attention checks
        if (question.dimension === 'attention_check' && 
            value !== question.correctAnswer) {
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error validating answer:', error);
        return false;
    }
}

// Export individual functions for testing or specific use cases
export {
    calculateRawScores,
    convertToPercentages,
    calculateConfidence,
    assignPersona,
    identifyDevelopmentArea
};

// Determine persona based on scores
export function determinePersona(scores) {
    // Get the highest scoring category
    const primaryType = Object.entries(scores).reduce(
        (max, [category, score]) => score > max[1] ? [category, score] : max,
        ['V', 0]
    )[0];

    // Get the second highest scoring category
    const secondaryType = Object.entries(scores)
        .filter(([category]) => category !== primaryType)
        .reduce(
            (max, [category, score]) => score > max[1] ? [category, score] : max,
            ['A', 0]
        )[0];

    // Check if scores are balanced
    const isBalanced = Object.values(scores)
        .every(score => score >= 40 && score <= 60);

    if (isBalanced) {
        return {
            primaryType: 'BALANCED',
            secondaryType: null,
            name: PERSONAS.BALANCED.name,
            description: PERSONAS.BALANCED.description,
            confidence: 'low'
        };
    }

    // Return persona details
    return {
        primaryType,
        secondaryType,
        name: PERSONAS[primaryType].name,
        description: PERSONAS[primaryType].description,
        confidence: scores[primaryType] >= 70 ? 'high' : 'medium'
    };
}

/**
 * Generate validation insights based on scores
 * @param {Object} scores - The assessment scores
 * @returns {Object} Validation insights
 */
function generateValidationInsights(scores) {
    // Implementation of generateValidationInsights function
}

// Generate validation insights
// ... existing code ...