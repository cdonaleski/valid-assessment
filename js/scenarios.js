/**
 * VALID Assessment Scenarios
 * Defines different contexts for viewing assessment results
 */

// Import questions data for context scoring
import validAssessmentData from './questions-data.js';

// Dimension mapping function to handle both full words and single letters
function mapDimension(dimension) {
    const dimensionMap = {
        // Full word to single letter
        'verity': 'V',
        'association': 'A', 
        'lived': 'L',
        'institutional': 'I',
        'desire': 'D',
        // Single letter (already correct)
        'V': 'V',
        'A': 'A',
        'L': 'L', 
        'I': 'I',
        'D': 'D',
        // Special dimensions
        'Awareness': 'AW',
        'attention_check': 'AC',
        'social_desirability': 'SD'
    };
    return dimensionMap[dimension] || dimension;
}

export const scenarios = {
    general: {
        name: 'General Decision Making',
        description: 'Your overall decision-making style across all contexts',
        icon: '🎯'
    },
    work: {
        name: 'Work & Professional',
        description: 'How you approach decisions in professional settings',
        icon: '💼'
    },
    leadership: {
        name: 'Leadership & Management',
        description: 'Your decision-making style when leading teams or projects',
        icon: '👥'
    },
    personal: {
        name: 'Personal & Life',
        description: 'How you make decisions in personal and life situations',
        icon: '🏠'
    },
    crisis: {
        name: 'Crisis & High Pressure',
        description: 'Your decision-making under pressure or in urgent situations',
        icon: '⚡'
    },
    innovation: {
        name: 'Innovation & Change',
        description: 'How you approach decisions involving change or new ideas',
        icon: '🚀'
    },
    collaboration: {
        name: 'Collaboration & Teamwork',
        description: 'Your decision-making style in collaborative environments',
        icon: '🤝'
    },
    strategic: {
        name: 'Strategic Planning',
        description: 'How you approach long-term strategic decisions',
        icon: '📊'
    }
};

/**
 * Context-specific question analysis patterns
 * These define how different question categories and dimensions are interpreted in each context
 */
export const contextAnalysis = {
    general: {
        // General context uses standard scoring with equal emphasis
        questionEmphasis: {
            decision_triggers: 1.0,
            information: 1.0,
            confidence: 1.0,
            urgency: 1.0,
            conflict: 1.0,
            evaluation: 1.0,
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            A: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            L: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            I: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            D: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 }
        }
    },
    work: {
        // Work context emphasizes institutional knowledge and systematic approaches
        questionEmphasis: {
            decision_triggers: 1.1,
            information: 1.3, // Higher emphasis on information gathering
            confidence: 1.0,
            urgency: 1.2, // Higher emphasis on urgency handling
            conflict: 1.1,
            evaluation: 1.2, // Higher emphasis on evaluation
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 5, lowThreshold: 3, emphasis: 1.2 }, // Lower threshold for high verity
            A: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }, // Higher threshold for high association
            L: { highThreshold: 6, lowThreshold: 3, emphasis: 0.8 }, // Less emphasis on lived experience
            I: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }, // Lower threshold for high institutional
            D: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }  // Higher threshold for high desire
        }
    },
    leadership: {
        // Leadership context emphasizes collaboration and vision
        questionEmphasis: {
            decision_triggers: 1.2,
            information: 1.0,
            confidence: 1.3, // Higher emphasis on confidence
            urgency: 1.2,
            conflict: 1.2,
            evaluation: 1.1,
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            A: { highThreshold: 5, lowThreshold: 3, emphasis: 1.4 }, // Lower threshold for high association
            L: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            I: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            D: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }  // Lower threshold for high desire
        }
    },
    personal: {
        // Personal context emphasizes lived experience and values
        questionEmphasis: {
            decision_triggers: 1.0,
            information: 0.9, // Less emphasis on formal information
            confidence: 1.0,
            urgency: 1.0,
            conflict: 1.0,
            evaluation: 1.0,
            general: 1.1,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 6, lowThreshold: 4, emphasis: 0.8 }, // Higher threshold for high verity
            A: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            L: { highThreshold: 5, lowThreshold: 3, emphasis: 1.4 }, // Lower threshold for high lived experience
            I: { highThreshold: 6, lowThreshold: 4, emphasis: 0.8 }, // Higher threshold for high institutional
            D: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }  // Lower threshold for high desire
        }
    },
    crisis: {
        // Crisis context emphasizes quick decision-making and confidence
        questionEmphasis: {
            decision_triggers: 1.4, // Much higher emphasis on decision triggers
            information: 0.7, // Less emphasis on information gathering
            confidence: 1.5, // Much higher emphasis on confidence
            urgency: 1.6, // Much higher emphasis on urgency handling
            conflict: 1.1,
            evaluation: 0.8,
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }, // Lower threshold for high verity
            A: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }, // Higher threshold for high association
            L: { highThreshold: 5, lowThreshold: 3, emphasis: 1.2 }, // Lower threshold for high lived experience
            I: { highThreshold: 6, lowThreshold: 4, emphasis: 0.8 }, // Higher threshold for high institutional
            D: { highThreshold: 6, lowThreshold: 4, emphasis: 0.7 }  // Higher threshold for high desire
        }
    },
    innovation: {
        // Innovation context emphasizes vision and experimentation
        questionEmphasis: {
            decision_triggers: 1.2,
            information: 1.0,
            confidence: 1.2,
            urgency: 0.8, // Less emphasis on urgency
            conflict: 1.0,
            evaluation: 1.1,
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }, // Higher threshold for high verity
            A: { highThreshold: 5, lowThreshold: 3, emphasis: 1.2 }, // Lower threshold for high association
            L: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }, // Lower threshold for high lived experience
            I: { highThreshold: 6, lowThreshold: 4, emphasis: 0.8 }, // Higher threshold for high institutional
            D: { highThreshold: 4, lowThreshold: 3, emphasis: 1.5 }  // Much lower threshold for high desire
        }
    },
    collaboration: {
        // Collaboration context emphasizes teamwork and processes
        questionEmphasis: {
            decision_triggers: 1.0,
            information: 1.2, // Higher emphasis on information sharing
            confidence: 1.0,
            urgency: 1.0,
            conflict: 1.3, // Much higher emphasis on conflict resolution
            evaluation: 1.1,
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }, // Higher threshold for high verity
            A: { highThreshold: 4, lowThreshold: 3, emphasis: 1.5 }, // Much lower threshold for high association
            L: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            I: { highThreshold: 5, lowThreshold: 3, emphasis: 1.3 }, // Lower threshold for high institutional
            D: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }  // Higher threshold for high desire
        }
    },
    strategic: {
        // Strategic context emphasizes analysis and vision
        questionEmphasis: {
            decision_triggers: 1.2,
            information: 1.5, // Much higher emphasis on information gathering
            confidence: 1.2,
            urgency: 0.7, // Less emphasis on urgency
            conflict: 1.0,
            evaluation: 1.3, // Higher emphasis on evaluation
            general: 1.0,
            quality: 1.0
        },
        dimensionInterpretation: {
            V: { highThreshold: 5, lowThreshold: 3, emphasis: 1.4 }, // Lower threshold for high verity
            A: { highThreshold: 6, lowThreshold: 3, emphasis: 1.0 },
            L: { highThreshold: 6, lowThreshold: 4, emphasis: 0.9 }, // Higher threshold for high lived experience
            I: { highThreshold: 5, lowThreshold: 3, emphasis: 1.2 }, // Lower threshold for high institutional
            D: { highThreshold: 4, lowThreshold: 3, emphasis: 1.4 }  // Much lower threshold for high desire
        }
    }
};

/**
 * Calculate context-aware scores by analyzing answer patterns
 * @param {Object} answers - Assessment answers
 * @param {string} context - Selected context
 * @returns {Object} Context-specific scores
 */
export function calculateContextScores(answers, context = 'general') {
    console.log('=== CONTEXT SCORING DEBUG ===');
    console.log('Calculating context-aware scores for:', context);
    console.log('Input answers:', answers);
    
    // Get context analysis configuration
    const analysis = contextAnalysis[context] || contextAnalysis.general;
    console.log('Context analysis config:', analysis);
    
    // Initialize dimension analysis
    const dimensionAnalysis = {
        V: { totalCount: 0, weightedSum: 0 },
        A: { totalCount: 0, weightedSum: 0 },
        L: { totalCount: 0, weightedSum: 0 },
        I: { totalCount: 0, weightedSum: 0 },
        D: { totalCount: 0, weightedSum: 0 }
    };
    
    // Analyze each answer based on context
    Object.entries(answers).forEach(([questionId, value]) => {
        // Find the question
        const question = validAssessmentData.questions.find(q => q.id === questionId);
        if (!question || question.dimension === 'attention_check' || question.dimension === 'social_desirability') {
            console.log(`Skipping question ${questionId}: not a main dimension question`);
            return;
        }
        
        // Get dimension key
        const dimension = mapDimension(question.dimension);
        if (!dimensionAnalysis.hasOwnProperty(dimension)) {
            console.log(`Skipping question ${questionId}: invalid dimension ${dimension}`);
            return;
        }
        
        // Get context-specific thresholds and emphasis
        const dimConfig = analysis.dimensionInterpretation[dimension];
        const categoryEmphasis = analysis.questionEmphasis[question.category] || 1.0;
        
        // Calculate base score (accounting for reverse scoring)
        const numValue = typeof value === 'number' ? value : Number(value);
        const baseScore = question.reverse ? (8 - numValue) : numValue;
        
        // Apply category emphasis
        const emphasizedScore = baseScore * categoryEmphasis;
        
        // Accumulate weighted sum
        dimensionAnalysis[dimension].weightedSum += emphasizedScore;
        dimensionAnalysis[dimension].totalCount++;
        
        console.log(`Question ${questionId} (${dimension}):`, {
            value: numValue,
            baseScore,
            emphasizedScore,
            categoryEmphasis,
            dimensionEmphasis: dimConfig.emphasis,
            category: question.category,
            reverse: question.reverse
        });
    });
    
    console.log('Dimension analysis summary:', dimensionAnalysis);
    
    // Calculate context-specific scores
    const finalScores = {};
    Object.entries(dimensionAnalysis).forEach(([dimension, data]) => {
        if (data.totalCount > 0) {
            // Calculate simple weighted average (1-7 scale)
            const weightedAverage = data.weightedSum / data.totalCount;
            
            // Convert to percentage (0-100) - this is the base percentage
            const basePercentage = Math.round(((weightedAverage - 1) / 6) * 100);
            
            // Apply context emphasis as a modifier, not a direct multiplier
            // This prevents scores from going to 0 when emphasis < 1
            const dimConfig = analysis.dimensionInterpretation[dimension];
            let adjustedPercentage = basePercentage;
            
            if (dimConfig.emphasis !== 1.0) {
                // Apply emphasis as a modifier that adjusts the score range
                // For emphasis > 1: boost the score
                // For emphasis < 1: reduce the score but keep it proportional
                if (dimConfig.emphasis > 1.0) {
                    // Boost: increase the score by the emphasis factor
                    adjustedPercentage = Math.min(100, basePercentage * dimConfig.emphasis);
                } else {
                    // Reduce: apply a more gentle reduction that maintains relative scores
                    // Use a curve that reduces scores but doesn't flatten them to 0
                    const reductionFactor = 0.3 + (0.7 * dimConfig.emphasis); // This keeps at least 30% of the score
                    adjustedPercentage = basePercentage * reductionFactor;
                }
            }
            
            // Ensure score is within bounds and not zero
            finalScores[dimension] = Math.max(10, Math.min(100, Math.round(adjustedPercentage)));
            
            console.log(`Final score for ${dimension}:`, {
                weightedAverage,
                basePercentage,
                adjustedPercentage,
                finalScore: finalScores[dimension],
                emphasis: dimConfig.emphasis,
                reductionFactor: dimConfig.emphasis < 1.0 ? (0.3 + (0.7 * dimConfig.emphasis)) : null
            });
        } else {
            finalScores[dimension] = 0;
            console.log(`No questions found for dimension ${dimension}, setting score to 0`);
        }
    });
    
    console.log('=== FINAL CONTEXT SCORES ===', finalScores);
    return finalScores;
}

/**
 * Get scenario-specific insights based on scores and context
 * @param {Object} scores - The assessment scores
 * @param {string} context - The selected scenario context
 * @returns {Object} Context-specific insights
 */
export function getScenarioInsights(scores, context) {
    const insights = {
        primary: getPrimaryStyle(scores, context),
        secondary: getSecondaryStyle(scores, context),
        recommendations: getScenarioRecommendations(scores, context),
        strengths: getScenarioStrengths(scores, context),
        challenges: getScenarioChallenges(scores, context)
    };

    return insights;
}

function getPrimaryStyle(scores, context) {
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([dimension, score]) => ({ dimension, score }));

    const primary = sortedScores[0];
    const contextInsights = {
        general: {
            V: 'Your data-driven approach serves you well across all decision contexts.',
            A: 'Your collaborative style helps you build consensus in diverse situations.',
            L: 'Your experiential wisdom guides you effectively through various challenges.',
            I: 'Your systematic approach provides reliable decision-making frameworks.',
            D: 'Your visionary thinking helps you see opportunities others might miss.'
        },
        work: {
            V: 'Your analytical approach helps you make well-researched professional decisions.',
            A: 'Your collaborative style is valuable for team-based work environments.',
            L: 'Your practical experience helps you navigate workplace challenges effectively.',
            I: 'Your systematic approach aligns well with organizational processes.',
            D: 'Your forward-thinking helps you identify strategic opportunities at work.'
        },
        leadership: {
            V: 'Your data-driven leadership builds trust through evidence-based decisions.',
            A: 'Your collaborative leadership style fosters team engagement and buy-in.',
            L: 'Your experiential leadership provides practical guidance to your team.',
            I: 'Your systematic leadership ensures consistent and reliable team direction.',
            D: 'Your visionary leadership inspires teams toward future possibilities.'
        },
        personal: {
            V: 'Your analytical approach helps you make well-considered life decisions.',
            A: 'Your collaborative style helps you maintain strong personal relationships.',
            L: 'Your experiential wisdom guides you through personal challenges.',
            I: 'Your systematic approach helps you maintain stability in your personal life.',
            D: 'Your visionary thinking helps you plan for your personal future.'
        },
        crisis: {
            V: 'Your analytical approach helps you assess situations quickly and accurately.',
            A: 'Your collaborative style helps you coordinate with others during crises.',
            L: 'Your experiential wisdom helps you draw on past experiences in urgent situations.',
            I: 'Your systematic approach helps you follow established emergency procedures.',
            D: 'Your visionary thinking helps you see solutions beyond immediate problems.'
        },
        innovation: {
            V: 'Your analytical approach helps you evaluate new ideas systematically.',
            A: 'Your collaborative style helps you gather diverse perspectives on innovation.',
            L: 'Your experiential wisdom helps you apply practical insights to new ideas.',
            I: 'Your systematic approach helps you implement innovations effectively.',
            D: 'Your visionary thinking helps you identify breakthrough opportunities.'
        },
        collaboration: {
            V: 'Your analytical approach helps you contribute data-driven insights to teams.',
            A: 'Your collaborative style makes you a natural team player and facilitator.',
            L: 'Your experiential wisdom helps you share practical insights with teammates.',
            I: 'Your systematic approach helps you maintain team processes and standards.',
            D: 'Your visionary thinking helps teams see future possibilities and opportunities.'
        },
        strategic: {
            V: 'Your analytical approach helps you make well-researched strategic decisions.',
            A: 'Your collaborative style helps you build strategic partnerships and alliances.',
            L: 'Your experiential wisdom helps you apply practical insights to strategic planning.',
            I: 'Your systematic approach helps you develop comprehensive strategic frameworks.',
            D: 'Your visionary thinking helps you identify long-term strategic opportunities.'
        }
    };

    return {
        dimension: primary.dimension,
        score: primary.score,
        insight: contextInsights[context]?.[primary.dimension] || contextInsights.general[primary.dimension]
    };
}

function getSecondaryStyle(scores, context) {
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([dimension, score]) => ({ dimension, score }));

    const secondary = sortedScores[1];
    const contextInsights = {
        general: {
            V: 'Your secondary analytical strength provides additional decision support.',
            A: 'Your secondary collaborative strength enhances your interpersonal effectiveness.',
            L: 'Your secondary experiential strength adds practical wisdom to your decisions.',
            I: 'Your secondary systematic strength provides additional structure to your approach.',
            D: 'Your secondary visionary strength adds future-focused thinking to your decisions.'
        },
        work: {
            V: 'Your secondary analytical strength supports evidence-based work decisions.',
            A: 'Your secondary collaborative strength enhances workplace relationships.',
            L: 'Your secondary experiential strength adds practical insights to work situations.',
            I: 'Your secondary systematic strength supports organizational processes.',
            D: 'Your secondary visionary strength helps identify work opportunities.'
        },
        leadership: {
            V: 'Your secondary analytical strength supports data-driven leadership decisions.',
            A: 'Your secondary collaborative strength enhances team leadership effectiveness.',
            L: 'Your secondary experiential strength adds practical leadership wisdom.',
            I: 'Your secondary systematic strength supports structured leadership approaches.',
            D: 'Your secondary visionary strength enhances strategic leadership thinking.'
        },
        personal: {
            V: 'Your secondary analytical strength supports well-considered personal decisions.',
            A: 'Your secondary collaborative strength enhances personal relationships.',
            L: 'Your secondary experiential strength adds practical life wisdom.',
            I: 'Your secondary systematic strength supports personal stability.',
            D: 'Your secondary visionary strength enhances personal future planning.'
        },
        crisis: {
            V: 'Your secondary analytical strength supports quick crisis assessment.',
            A: 'Your secondary collaborative strength enhances crisis coordination.',
            L: 'Your secondary experiential strength adds crisis response wisdom.',
            I: 'Your secondary systematic strength supports crisis procedures.',
            D: 'Your secondary visionary strength helps identify crisis solutions.'
        },
        innovation: {
            V: 'Your secondary analytical strength supports systematic innovation evaluation.',
            A: 'Your secondary collaborative strength enhances innovation collaboration.',
            L: 'Your secondary experiential strength adds practical innovation insights.',
            I: 'Your secondary systematic strength supports innovation implementation.',
            D: 'Your secondary visionary strength enhances innovation identification.'
        },
        collaboration: {
            V: 'Your secondary analytical strength supports team data insights.',
            A: 'Your secondary collaborative strength enhances team effectiveness.',
            L: 'Your secondary experiential strength adds team practical wisdom.',
            I: 'Your secondary systematic strength supports team processes.',
            D: 'Your secondary visionary strength enhances team future thinking.'
        },
        strategic: {
            V: 'Your secondary analytical strength supports strategic research.',
            A: 'Your secondary collaborative strength enhances strategic partnerships.',
            L: 'Your secondary experiential strength adds strategic practical insights.',
            I: 'Your secondary systematic strength supports strategic frameworks.',
            D: 'Your secondary visionary strength enhances strategic opportunity identification.'
        }
    };

    return {
        dimension: secondary.dimension,
        score: secondary.score,
        insight: contextInsights[context]?.[secondary.dimension] || contextInsights.general[secondary.dimension]
    };
}

function getScenarioRecommendations(scores, context) {
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 3);

    const recommendations = {
        general: {
            V: 'Consider incorporating more analytical approaches in your decision-making process.',
            A: 'Look for opportunities to seek input from others and build consensus.',
            L: 'Reflect on how your past experiences can inform current decisions.',
            I: 'Explore established frameworks and best practices for decision-making.',
            D: 'Consider how your decisions align with long-term goals and vision.'
        },
        work: {
            V: 'Gather more data and research before making important work decisions.',
            A: 'Seek input from colleagues and stakeholders on work-related choices.',
            L: 'Apply lessons from your work experience to current professional challenges.',
            I: 'Follow established organizational processes and industry best practices.',
            D: 'Consider how work decisions align with your career and organizational goals.'
        },
        leadership: {
            V: 'Use data and analysis to support your leadership decisions.',
            A: 'Involve your team in decision-making processes when appropriate.',
            L: 'Share relevant experiences and lessons learned with your team.',
            I: 'Establish clear processes and frameworks for team decision-making.',
            D: 'Communicate your vision and long-term goals to inspire your team.'
        },
        personal: {
            V: 'Research and gather information before making important life decisions.',
            A: 'Discuss important personal decisions with trusted friends and family.',
            L: 'Reflect on how past experiences can guide current personal choices.',
            I: 'Establish personal systems and routines for better decision-making.',
            D: 'Consider how personal decisions align with your life goals and values.'
        },
        crisis: {
            V: 'Quickly gather essential information to assess crisis situations.',
            A: 'Coordinate with others to respond effectively to crises.',
            L: 'Draw on past crisis experiences to guide current responses.',
            I: 'Follow established emergency procedures and protocols.',
            D: 'Look beyond immediate problems to identify long-term solutions.'
        },
        innovation: {
            V: 'Systematically evaluate new ideas and innovations.',
            A: 'Collaborate with diverse stakeholders to develop innovative solutions.',
            L: 'Apply practical insights from experience to innovation processes.',
            I: 'Establish systematic approaches to implementing innovations.',
            D: 'Identify breakthrough opportunities and future possibilities.'
        },
        collaboration: {
            V: 'Contribute data-driven insights to collaborative decision-making.',
            A: 'Actively seek and incorporate diverse perspectives in team decisions.',
            L: 'Share practical insights and experiences with your team.',
            I: 'Help establish and maintain effective team processes.',
            D: 'Inspire teams with vision and future possibilities.'
        },
        strategic: {
            V: 'Conduct thorough research and analysis for strategic decisions.',
            A: 'Build strategic partnerships and alliances.',
            L: 'Apply practical insights from experience to strategic planning.',
            I: 'Develop comprehensive strategic frameworks and processes.',
            D: 'Identify long-term strategic opportunities and possibilities.'
        }
    };

    return sortedScores.map(([dimension, score]) => ({
        dimension,
        score,
        recommendation: recommendations[context]?.[dimension] || recommendations.general[dimension]
    }));
}

function getScenarioStrengths(scores, context) {
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);

    const strengths = {
        general: {
            V: 'Strong analytical and evidence-based decision making',
            A: 'Excellent collaborative and consensus-building abilities',
            L: 'Rich experiential wisdom and practical insights',
            I: 'Systematic and structured approach to decisions',
            D: 'Visionary thinking and future-focused perspective'
        },
        work: {
            V: 'Data-driven professional decision making',
            A: 'Strong workplace collaboration and team building',
            L: 'Practical work experience and problem-solving',
            I: 'Organizational process alignment and compliance',
            D: 'Strategic work planning and opportunity identification'
        },
        leadership: {
            V: 'Evidence-based leadership and decision making',
            A: 'Inclusive leadership and team engagement',
            L: 'Experiential leadership and practical guidance',
            I: 'Systematic leadership and process management',
            D: 'Visionary leadership and strategic direction'
        },
        personal: {
            V: 'Well-considered personal decision making',
            A: 'Strong personal relationships and social connections',
            L: 'Practical life wisdom and experience-based choices',
            I: 'Personal stability and systematic life management',
            D: 'Personal vision and future life planning'
        },
        crisis: {
            V: 'Quick analytical assessment of crisis situations',
            A: 'Effective crisis coordination and communication',
            L: 'Practical crisis response based on experience',
            I: 'Systematic crisis management and procedure following',
            D: 'Crisis solution identification and future prevention'
        },
        innovation: {
            V: 'Systematic evaluation of new ideas and innovations',
            A: 'Collaborative innovation and diverse perspective gathering',
            L: 'Practical innovation insights and experience application',
            I: 'Systematic innovation implementation and process management',
            D: 'Innovation opportunity identification and breakthrough thinking'
        },
        collaboration: {
            V: 'Data-driven team insights and analysis',
            A: 'Natural collaboration and team facilitation',
            L: 'Practical team insights and experience sharing',
            I: 'Team process management and systematic collaboration',
            D: 'Team vision and future opportunity identification'
        },
        strategic: {
            V: 'Thorough strategic research and analysis',
            A: 'Strategic partnership building and alliance formation',
            L: 'Practical strategic insights and experience application',
            I: 'Comprehensive strategic framework development',
            D: 'Long-term strategic opportunity identification'
        }
    };

    return sortedScores.map(([dimension, score]) => ({
        dimension,
        score,
        strength: strengths[context]?.[dimension] || strengths.general[dimension]
    }));
}

function getScenarioChallenges(scores, context) {
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 2);

    const challenges = {
        general: {
            V: 'May over-analyze and delay decisions when quick action is needed',
            A: 'May struggle with independent decisions when consensus is difficult',
            L: 'May resist new approaches that differ from past experiences',
            I: 'May be too rigid when flexibility and innovation are required',
            D: 'May focus too much on future possibilities at the expense of present realities'
        },
        work: {
            V: 'May spend too much time gathering data when quick decisions are needed',
            A: 'May struggle with independent work decisions when collaboration is limited',
            L: 'May resist new work approaches that differ from past experiences',
            I: 'May be too rigid with work processes when flexibility is needed',
            D: 'May focus too much on future work possibilities over current priorities'
        },
        leadership: {
            V: 'May over-analyze leadership decisions when quick action is required',
            A: 'May struggle with independent leadership decisions when team input is limited',
            L: 'May resist new leadership approaches that differ from past experiences',
            I: 'May be too rigid with leadership processes when flexibility is needed',
            D: 'May focus too much on future leadership possibilities over current team needs'
        },
        personal: {
            V: 'May over-analyze personal decisions when quick choices are needed',
            A: 'May struggle with independent personal decisions when input is limited',
            L: 'May resist new personal approaches that differ from past experiences',
            I: 'May be too rigid with personal systems when flexibility is needed',
            D: 'May focus too much on future personal possibilities over current needs'
        },
        crisis: {
            V: 'May spend too much time analyzing during urgent crisis situations',
            A: 'May struggle with independent crisis decisions when coordination is limited',
            L: 'May rely too heavily on past crisis experiences when situations differ',
            I: 'May be too rigid with crisis procedures when flexibility is needed',
            D: 'May focus too much on future crisis prevention over immediate response'
        },
        innovation: {
            V: 'May over-analyze innovations when quick experimentation is needed',
            A: 'May struggle with independent innovation when collaboration is limited',
            L: 'May resist new innovations that differ from past experiences',
            I: 'May be too rigid with innovation processes when flexibility is needed',
            D: 'May focus too much on future innovation possibilities over current implementation'
        },
        collaboration: {
            V: 'May over-analyze team decisions when quick collaboration is needed',
            A: 'May struggle with independent team decisions when input is limited',
            L: 'May resist new team approaches that differ from past experiences',
            I: 'May be too rigid with team processes when flexibility is needed',
            D: 'May focus too much on future team possibilities over current collaboration needs'
        },
        strategic: {
            V: 'May over-analyze strategic decisions when quick action is needed',
            A: 'May struggle with independent strategic decisions when partnership is limited',
            L: 'May resist new strategic approaches that differ from past experiences',
            I: 'May be too rigid with strategic processes when flexibility is needed',
            D: 'May focus too much on future strategic possibilities over current implementation'
        }
    };

    return sortedScores.map(([dimension, score]) => ({
        dimension,
        score,
        challenge: challenges[context]?.[dimension] || challenges.general[dimension]
    }));
}
 