/**
 * VALID Assessment Personas & Organizational Risk System
 * Integrates individual assessment with organizational intelligence
 */

// Core persona definitions with complete metadata
const PERSONAS = {
    // Positive Workplace Personas
    data_driven_visionary: {
        id: "data_driven_visionary",
        name: "Data-Driven Visionary",
        type: "positive",
        validationPattern: "V+D",
        prevalence: "35% of successful change leaders",
        tagline: "Combining analytical rigor with transformational vision",
        description: "Leaders who excel at using data to drive strategic transformation. They blend quantitative analysis with future-focused thinking to create compelling, evidence-based visions for change. Their approach ensures innovations are both ambitious and grounded in reality.",
        strengths: ["Strategic thinking", "Data analysis", "Vision communication", "Innovation leadership"],
        excelsAt: ["Transformation planning", "Data-driven strategy", "Change leadership", "Future modeling"],
        challenges: ["May overwhelm with data", "Vision may outpace implementation", "Technical-emotional balance"],
        growthArea: "Stakeholder engagement and communication clarity",
        developmentTips: [
            "Practice storytelling with data",
            "Build coalition support",
            "Create implementation bridges",
            "Balance vision with execution"
        ],
        idealEnvironments: ["Strategic planning", "Transformation projects", "Innovation labs", "R&D leadership"],
        riskFactors: [],
        mitigationStrategies: [],
        researchSupport: ["Kahneman dual-process theory", "Kotter change leadership", "Data-driven decision making"],
        changeEffectiveness: "Highest success rate in transformation initiatives",
        teamCompatibility: ["Works well with V+A", "Complements A+I", "May challenge Pure L"],
        organizationalImpact: "Drives breakthrough strategy and innovation"
    },

    evidence_based_collaborator: {
        id: "evidence_based_collaborator",
        name: "Evidence-Based Collaborator",
        type: "positive",
        validationPattern: "V+A",
        prevalence: "28% of successful change leaders",
        tagline: "Building consensus through data and relationships",
        description: "Implementation specialists who combine analytical thinking with strong stakeholder engagement. They excel at translating complex data into actionable insights while building strong coalitions for change. Their approach ensures both technical accuracy and organizational buy-in.",
        strengths: ["Stakeholder analysis", "Data communication", "Coalition building", "Implementation planning"],
        excelsAt: ["Change implementation", "Stakeholder alignment", "Process optimization", "Team coordination"],
        challenges: ["May over-consult", "Analysis paralysis risk", "Perfectionism tendencies"],
        growthArea: "Decision velocity and execution pace",
        developmentTips: [
            "Set clear decision timelines",
            "Balance analysis with action",
            "Develop rapid testing approaches",
            "Practice agile methodologies"
        ],
        idealEnvironments: ["Change management", "Process improvement", "Team leadership", "Project management"],
        riskFactors: [],
        mitigationStrategies: [],
        researchSupport: ["Stakeholder theory", "Evidence-based management", "Social network analysis"],
        changeEffectiveness: "High success in complex implementations",
        teamCompatibility: ["Strong with D+V", "Complements L+I", "Balances Pure D"],
        organizationalImpact: "Ensures sustainable change through stakeholder alignment"
    },

    // Additional positive personas...
    consensus_authority: {
        id: "consensus_authority",
        name: "Consensus Authority",
        type: "positive",
        validationPattern: "A+I",
        // ... similar structure for other positive personas
    },

    // Risk Personas
    bureaucratic_paralysis: {
        id: "bureaucratic_paralysis",
        name: "Bureaucratic Paralysis",
        type: "risk",
        validationPattern: "Pure I",
        prevalence: "15% organizational risk",
        tagline: "Process prioritization over outcome achievement",
        description: "A dysfunctional pattern where institutional procedures become ends in themselves, blocking innovation and agility. Characterized by excessive documentation, multiple approval layers, and risk aversion that significantly slows decision-making and change implementation.",
        riskFactors: [
            "Decision velocity decline",
            "Innovation resistance",
            "Process multiplication",
            "Risk aversion culture"
        ],
        mitigationStrategies: [
            "Introduce outcome metrics",
            "Create innovation fast-tracks",
            "Implement process optimization",
            "Establish decision time limits"
        ],
        organizationalImpact: "Severely impedes organizational agility and innovation",
        warningThreshold: 60,
        criticalThreshold: 75
    },

    // ... additional risk personas
};

// Validation patterns for persona identification
const VALIDATION_PATTERNS = {
    VD: {
        primary: ["V", "D"],
        threshold: 65,
        personaId: "data_driven_visionary"
    },
    VA: {
        primary: ["V", "A"],
        threshold: 65,
        personaId: "evidence_based_collaborator"
    },
    // ... additional patterns
};

/**
 * Calculate validation pattern strengths
 * @param {Object} scores - VALID dimension scores
 * @returns {Object} Pattern strength calculations
 */
function calculatePatternStrengths(scores) {
    const patterns = {};
    
    // Calculate combined pattern scores
    patterns.VD = (scores.V + scores.D) / 2;
    patterns.VA = (scores.V + scores.A) / 2;
    patterns.AI = (scores.A + scores.I) / 2;
    patterns.LI = (scores.L + scores.I) / 2;
    patterns.VL = (scores.V + scores.L) / 2;
    patterns.AD = (scores.A + scores.D) / 2;
    
    // Calculate pure type scores
    patterns.pureI = scores.I;
    patterns.pureA = scores.A;
    patterns.pureL = scores.L;
    
    return patterns;
}

/**
 * Determine primary persona based on scores
 * @param {Object} validScores - VALID dimension scores
 * @returns {Object} Identified persona with risk patterns
 */
export function determinePersona(validScores) {
    const patterns = calculatePatternStrengths(validScores);
    const risks = identifyRiskPatterns(patterns);
    
    // Check for balanced profile (Adaptive Strategist)
    const isBalanced = Object.values(validScores)
        .every(score => score >= 40 && score <= 60);
    
    if (isBalanced) {
        return {
            primary: PERSONAS.adaptive_strategist,
            risks: risks,
            patterns: patterns
        };
    }

    // Find strongest positive pattern
    let strongestPattern = null;
    let highestScore = 0;
    
    Object.entries(patterns).forEach(([pattern, score]) => {
        if (score > highestScore && VALIDATION_PATTERNS[pattern]) {
            highestScore = score;
            strongestPattern = pattern;
        }
    });

    return {
        primary: PERSONAS[VALIDATION_PATTERNS[strongestPattern].personaId],
        risks: risks,
        patterns: patterns
    };
}

/**
 * Identify organizational risk patterns
 * @param {Object} patterns - Calculated pattern strengths
 * @returns {Array} Identified risks with severity levels
 */
function identifyRiskPatterns(patterns) {
    const risks = [];
    
    // Check for pure type risks
    if (patterns.pureI >= 60) {
        risks.push({
            type: "bureaucratic_paralysis",
            severity: patterns.pureI >= 75 ? "critical" : "warning",
            score: patterns.pureI
        });
    }
    
    // Additional risk pattern checks...
    
    return risks;
}

/**
 * Calculate team risk based on persona composition
 * @param {Array} teamPersonas - Array of team member personas
 * @returns {Object} Team risk assessment
 */
export function calculateTeamRisk(teamPersonas) {
    const composition = analyzeTeamComposition(teamPersonas);
    const risks = [];
    
    // Check for composition risks
    if (composition.pureTypePercentage > 30) {
        risks.push({
            type: "homogeneity_risk",
            severity: composition.pureTypePercentage > 50 ? "critical" : "warning",
            description: "Excessive similar validation styles"
        });
    }
    
    // Calculate validation diversity index
    const diversityIndex = calculateDiversityIndex(composition);
    
    return {
        risks: risks,
        diversityIndex: diversityIndex,
        composition: composition,
        recommendations: generateTeamRecommendations(risks, diversityIndex)
    };
}

/**
 * Generate personalized development recommendations
 * @param {Object} persona - Identified persona
 * @param {Object} scores - VALID dimension scores
 * @returns {Object} Development plan and recommendations
 */
export function generateDevelopmentPlan(persona, scores) {
    const weaknesses = identifyWeaknesses(scores);
    const developmentAreas = mapToDevelopmentAreas(weaknesses);
    
    return {
        focusAreas: developmentAreas,
        recommendations: persona.developmentTips,
        resources: generateResourceRecommendations(developmentAreas),
        timeline: generateDevelopmentTimeline(developmentAreas)
    };
}

/**
 * Calculate team compatibility and dynamics
 * @param {Array} personas - Array of team personas
 * @returns {Object} Compatibility analysis and recommendations
 */
export function getTeamCompatibility(personas) {
    const interactions = analyzeTeamInteractions(personas);
    const strengths = identifyTeamStrengths(personas);
    const gaps = identifyTeamGaps(personas);
    
    return {
        compatibility: calculateCompatibilityScore(interactions),
        strengths: strengths,
        gaps: gaps,
        recommendations: generateTeamOptimizationPlan(strengths, gaps)
    };
}

/**
 * Generate risk mitigation strategies
 * @param {Array} riskPersonas - Identified risk personas
 * @returns {Object} Mitigation strategies and action plan
 */
export function generateRiskMitigation(riskPersonas) {
    const strategies = [];
    const organizationalImpact = assessOrganizationalImpact(riskPersonas);
    
    riskPersonas.forEach(risk => {
        strategies.push({
            risk: risk.type,
            severity: risk.severity,
            strategies: PERSONAS[risk.type].mitigationStrategies,
            timeline: generateMitigationTimeline(risk)
        });
    });
    
    return {
        strategies: strategies,
        impact: organizationalImpact,
        priorities: prioritizeMitigationEfforts(strategies),
        monitoringPlan: generateMonitoringPlan(strategies)
    };
}

// Export core functions
export {
    PERSONAS,
    VALIDATION_PATTERNS,
    calculatePatternStrengths,
    identifyRiskPatterns
}; 