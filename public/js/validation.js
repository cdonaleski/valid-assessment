/**
 * VALID Assessment Validation Module
 * Handles input validation and data sanitization
 */

import { logger } from './logger.js';

// Regular expressions for validation
const VALIDATION_PATTERNS = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    name: /^[a-zA-Z\s-']{2,50}$/,
    department: /^[a-zA-Z0-9\s-&]{2,50}$/,
    role: /^[a-zA-Z0-9\s-&]{2,50}$/,
    experience: /^[0-9]{1,2}$/
};

// Sanitize user input
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[;]/g, ''); // Remove semicolons
}

// Validate email format
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return VALIDATION_PATTERNS.email.test(email);
}

// Validate demographics data
function validateDemographics(demographics) {
    if (!demographics || typeof demographics !== 'object') {
        throw new Error('Invalid demographics format');
    }

    const requiredFields = ['department', 'role', 'experience'];
    for (const field of requiredFields) {
        if (!demographics[field] || typeof demographics[field] !== 'string' || !demographics[field].trim()) {
            throw new Error(`Missing or invalid ${field} in demographics`);
        }
    }

    // Validate department is one of the allowed values
    const validDepartments = ['Executive', 'Finance', 'HR', 'IT', 'Marketing', 'Operations', 'Sales', 'Other'];
    if (!validDepartments.includes(demographics.department)) {
        throw new Error('Invalid department value');
    }

    // Validate role is one of the allowed values
    const validRoles = ['Individual Contributor', 'Team Lead', 'Manager', 'Director', 'VP/C-Suite', 'Owner/Founder'];
    if (!validRoles.includes(demographics.role)) {
        throw new Error('Invalid role value');
    }

    // Validate experience is one of the allowed values
    const validExperience = ['0-2', '3-5', '6-10', '11-15', '15+'];
    if (!validExperience.includes(demographics.experience)) {
        throw new Error('Invalid experience value');
    }

    return true;
}

// Validate assessment answers
function validateAnswer(questionId, value) {
    if (!questionId || typeof questionId !== 'string') {
        throw new Error('Invalid question ID');
    }

    if (typeof value !== 'number' || value < 1 || value > 7) {
        throw new Error('Invalid answer value: must be between 1 and 7');
    }

    return true;
}

// Validate assessment data
function validateAssessmentData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid assessment data format');
    }

    const { id, email, demographics, answers } = data;

    if (!id || typeof id !== 'string') {
        throw new Error('Invalid assessment ID');
    }

    if (!validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (demographics) {
        validateDemographics(demographics);
    }

    if (answers) {
        if (typeof answers !== 'object') {
            throw new Error('Invalid answers format');
        }

        Object.entries(answers).forEach(([questionId, value]) => {
            validateAnswer(questionId, value);
        });
    }

    return true;
}

// Sanitize data for database
function sanitizeForDatabase(data) {
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForDatabase(item));
    }

    if (typeof data === 'object' && data !== null) {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                sanitizeInput(key),
                sanitizeForDatabase(value)
            ])
        );
    }

    if (typeof data === 'string') {
        return sanitizeInput(data);
    }

    return data;
}

// Validate resume token
function validateResumeToken(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Invalid resume token format');
    }

    // Token format: timestamp-hash
    const [timestamp, hash] = token.split('-');
    
    if (!timestamp || !hash) {
        throw new Error('Invalid resume token structure');
    }

    // Validate timestamp part (base36 number)
    if (!/^[0-9a-z]+$/i.test(timestamp)) {
        throw new Error('Invalid resume token timestamp');
    }

    // Validate hash part (12 characters, alphanumeric)
    if (!/^[0-9a-zA-Z]{12}$/.test(hash)) {
        throw new Error('Invalid resume token hash');
    }

    return true;
}

export {
    validateEmail,
    validateDemographics,
    validateAnswer,
    validateAssessmentData,
    validateResumeToken,
    sanitizeInput,
    sanitizeForDatabase
}; 