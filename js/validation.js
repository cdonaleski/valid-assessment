/**
 * VALID Assessment Validation Module
 * Handles input validation and data sanitization
 */

import { logger } from './test-utils.js';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 500); // Limit length
}

// Validate demographics data
export function validateDemographics(data) {
    const errors = [];

    // Required fields
    const required = ['department', 'role', 'experience', 'email'];
    required.forEach(field => {
        if (!data[field] || !data[field].trim()) {
            errors.push(`${field} is required`);
        }
    });

    // Email format validation
    if (data.email && !EMAIL_REGEX.test(data.email)) {
        errors.push('Invalid email format');
    }

    // Log validation results
    if (errors.length > 0) {
        logger.warn('Validation', 'Demographics validation failed', { errors });
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key,
                typeof value === 'string' ? sanitizeInput(value) : value
            ])
        )
    };
}

// Validate assessment answers
export function validateAnswers(answers, questionCount) {
    const errors = [];

    // Check if we have all answers
    if (answers.length !== questionCount) {
        errors.push(`Expected ${questionCount} answers, got ${answers.length}`);
    }

    // Check each answer is valid
    answers.forEach((answer, index) => {
        if (typeof answer !== 'number' || answer < 1 || answer > 5) {
            errors.push(`Invalid answer for question ${index + 1}`);
        }
    });

    // Log validation results
    if (errors.length > 0) {
        logger.warn('Validation', 'Answer validation failed', { errors });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validate email address
export function validateEmail(email) {
    return EMAIL_REGEX.test(email);
}

// Validate score calculations
export function validateScores(scores) {
    const errors = [];

    // Check all VALID dimensions
    ['V', 'A', 'L', 'I', 'D'].forEach(dim => {
        if (typeof scores[dim] !== 'number' || 
            scores[dim] < 0 || 
            scores[dim] > 100) {
            errors.push(`Invalid score for dimension ${dim}`);
        }
    });

    // Check total is valid
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (total === 0) {
        errors.push('All scores cannot be zero');
    }

    // Log validation results
    if (errors.length > 0) {
        logger.warn('Validation', 'Score validation failed', { errors });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validate persona assignment
export function validatePersona(persona) {
    const required = ['name', 'description', 'validationPattern'];
    const errors = [];

    required.forEach(field => {
        if (!persona[field]) {
            errors.push(`Missing required persona field: ${field}`);
        }
    });

    // Log validation results
    if (errors.length > 0) {
        logger.warn('Validation', 'Persona validation failed', { errors });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Sanitize data for database
export function sanitizeForDatabase(data) {
    // Recursively sanitize objects
    if (typeof data === 'object' && data !== null) {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key,
                sanitizeForDatabase(value)
            ])
        );
    }

    // Sanitize strings
    if (typeof data === 'string') {
        return sanitizeInput(data);
    }

    return data;
}

// Validate file type and size for exports
export function validateFileExport(fileType, size) {
    const errors = [];
    
    // Check file type
    const allowedTypes = ['csv', 'pdf', 'json'];
    if (!allowedTypes.includes(fileType)) {
        errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (size > maxSize) {
        errors.push('File size exceeds maximum allowed (10MB)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Export validation utilities
export const validation = {
    validateDemographics,
    validateAnswers,
    validateEmail,
    validateScores,
    validatePersona,
    validateFileExport,
    sanitizeInput,
    sanitizeForDatabase
}; 