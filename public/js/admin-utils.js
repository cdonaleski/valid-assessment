/**
 * VALID Assessment Admin Utilities
 * Helper functions for data processing and calculations
 */

/**
 * Calculate average completion time from raw data
 * @param {Array} data - Raw assessment data
 * @returns {number} Average time in minutes
 */
export function calculateAverageTime(data) {
    const completedAssessments = data.filter(r => r.completed && r.startTime && r.endTime);
    if (!completedAssessments.length) return 0;

    const totalMinutes = completedAssessments.reduce((sum, record) => {
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        return sum + (end - start) / (1000 * 60); // Convert to minutes
    }, 0);

    return Math.round(totalMinutes / completedAssessments.length);
}

/**
 * Calculate persona distribution
 * @param {Array} data - Raw assessment data
 * @returns {Object} Persona counts
 */
export function calculatePersonaDistribution(data) {
    const distribution = data.reduce((acc, record) => {
        if (record.persona) {
            acc[record.persona] = (acc[record.persona] || 0) + 1;
        }
        return acc;
    }, {});

    // Sort by count descending
    return Object.fromEntries(
        Object.entries(distribution)
            .sort(([,a], [,b]) => b - a)
    );
}

/**
 * Calculate average scores for VALID dimensions
 * @param {Array} data - Raw assessment data
 * @returns {Array} Average scores [V,A,L,I,D]
 */
export function calculateScoreDistributions(data) {
    const completedAssessments = data.filter(r => r.completed && r.scores);
    if (!completedAssessments.length) return [0, 0, 0, 0, 0];

    const dimensions = ['V', 'A', 'L', 'I', 'D'];
    return dimensions.map(dim => {
        const total = completedAssessments.reduce((sum, record) => {
            return sum + (record.scores[dim] || 0);
        }, 0);
        return Math.round(total / completedAssessments.length);
    });
}

/**
 * Calculate industry breakdown
 * @param {Array} data - Raw assessment data
 * @returns {Object} Industry distribution
 */
export function calculateIndustryBreakdown(data) {
    const breakdown = data.reduce((acc, record) => {
        if (record.industry) {
            acc[record.industry] = (acc[record.industry] || 0) + 1;
        }
        return acc;
    }, {});

    // Sort by count descending and limit to top 10
    return Object.fromEntries(
        Object.entries(breakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
    );
}

/**
 * Calculate completion trends over time
 * @param {Array} data - Raw assessment data
 * @returns {Object} Trend data for chart
 */
export function calculateCompletionTrends(data) {
    const last30Days = [...Array(30)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const dailyCounts = data.reduce((acc, record) => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    return {
        labels: last30Days,
        data: last30Days.map(date => dailyCounts[date] || 0)
    };
}

/**
 * Format data for CSV export
 * @param {Array} data - Raw assessment data
 * @returns {string} CSV content
 */
export function formatDataForExport(data) {
    const headers = [
        'Date',
        'Assessment ID',
        'Persona',
        'Industry',
        'Role',
        'V Score',
        'A Score',
        'L Score',
        'I Score',
        'D Score',
        'Completion Time (min)',
        'Status'
    ];

    const rows = data.map(record => [
        new Date(record.created_at).toLocaleDateString(),
        record.id,
        record.persona || '',
        record.industry || '',
        record.role || '',
        record.scores?.V || '',
        record.scores?.A || '',
        record.scores?.L || '',
        record.scores?.I || '',
        record.scores?.D || '',
        record.completed ? calculateCompletionTime(record) : '',
        record.completed ? 'Completed' : 'Incomplete'
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

/**
 * Calculate completion time for a single assessment
 * @param {Object} record - Assessment record
 * @returns {number} Completion time in minutes
 */
function calculateCompletionTime(record) {
    if (!record.startTime || !record.endTime) return '';
    const start = new Date(record.startTime);
    const end = new Date(record.endTime);
    return Math.round((end - start) / (1000 * 60));
}

/**
 * Process and anonymize data for research export
 * @param {Array} data - Raw assessment data
 * @returns {Array} Anonymized data
 */
export function prepareResearchData(data) {
    return data.map(record => ({
        date: new Date(record.created_at).toISOString().split('T')[0],
        persona: record.persona || '',
        industry: record.industry || '',
        role_level: record.role?.split(' ')[0] || '', // Only keep seniority level
        scores: record.scores || {},
        completion_time: record.completed ? calculateCompletionTime(record) : null
    }));
}

/**
 * Calculate risk patterns in the data
 * @param {Array} data - Raw assessment data
 * @returns {Object} Risk analysis
 */
export function analyzeRiskPatterns(data) {
    const completedAssessments = data.filter(r => r.completed && r.scores);
    if (!completedAssessments.length) return null;

    const riskThreshold = 30; // Score below this is considered risk
    const patterns = {
        lowVerity: 0,
        lowAssociation: 0,
        lowLived: 0,
        lowInstitutional: 0,
        lowDesire: 0
    };

    completedAssessments.forEach(record => {
        if (record.scores.V < riskThreshold) patterns.lowVerity++;
        if (record.scores.A < riskThreshold) patterns.lowAssociation++;
        if (record.scores.L < riskThreshold) patterns.lowLived++;
        if (record.scores.I < riskThreshold) patterns.lowInstitutional++;
        if (record.scores.D < riskThreshold) patterns.lowDesire++;
    });

    // Convert to percentages
    const total = completedAssessments.length;
    return Object.fromEntries(
        Object.entries(patterns).map(([key, value]) => [
            key,
            Math.round((value / total) * 100)
        ])
    );
} 