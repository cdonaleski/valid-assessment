// Function to get results data from URL hash or localStorage
console.log('Results.js file loaded successfully');

// Test ES6 imports
console.log('Testing ES6 imports...');
try {
    import('./scoring.js').then(module => {
        console.log('✅ Scoring module imported successfully:', Object.keys(module));
    }).catch(error => {
        console.error('❌ Failed to import scoring module:', error);
    });
} catch (error) {
    console.error('❌ ES6 import test failed:', error);
}

// Debug function to log all available data sources
function logAvailableDataSources() {
    console.log('=== DATA SOURCES DEBUG ===');
    
    // Check URL hash
    const hash = window.location.hash;
    console.log('URL hash:', hash);
    
    // Check localStorage keys
    const keys = ['valid_completed_assessments', 'validAssessmentData', 'validAssessmentState'];
    keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`${key}:`, {
                    hasData: true,
                    type: Array.isArray(parsed) ? 'array' : 'object',
                    hasAnswers: parsed.answers ? Object.keys(parsed.answers).length : 0,
                    hasScores: parsed.scores ? Object.keys(parsed.scores).length : 0,
                    sampleKeys: parsed.answers ? Object.keys(parsed.answers).slice(0, 5) : []
                });
            } catch (e) {
                console.log(`${key}: Invalid JSON`);
            }
        } else {
            console.log(`${key}: No data`);
        }
    });
    
    console.log('=== END DATA SOURCES DEBUG ===');
}

async function getResultsData() {
    console.log('getResultsData called - checking for results...');
    
    // Log all available data sources for debugging
    logAvailableDataSources();
    
    // First try to get data from URL hash
    const hash = window.location.hash;
    console.log('URL hash:', hash);
    
    if (hash.startsWith('#results=')) {
        try {
            const encodedData = hash.substring('#results='.length);
            const decodedData = atob(encodedData);
            const resultsData = JSON.parse(decodedData);
            console.log('Loaded results from URL hash:', resultsData);
            
            // If we have answers in the URL hash, recalculate scores
            if (resultsData.answers && Object.keys(resultsData.answers).length > 0) {
                console.log('Found answers in URL hash, recalculating scores...');
                try {
                    // Import and use the calculateScores function
                    const { calculateScores, calculateAwarenessScore } = await import('./scoring.js');
                    const recalculatedResults = calculateScores(resultsData.answers, resultsData.timestamp);
                    const awarenessScore = calculateAwarenessScore(resultsData.answers);
                    console.log('Recalculated scores:', recalculatedResults);
                    console.log('Awareness score:', awarenessScore);
                    
                    // Update the results data with recalculated scores
                    resultsData.scores = recalculatedResults.scores;
                    resultsData.quality = recalculatedResults.quality;
                    resultsData.awareness = awarenessScore;
                    
                    // Update the URL hash with the corrected data
                    const correctedEncodedData = btoa(JSON.stringify(resultsData));
                    window.location.hash = `results=${correctedEncodedData}`;
                    
                    console.log('Updated URL hash with corrected scores');
                } catch (error) {
                    console.error('Failed to import scoring module:', error);
                }
            }
            
            // Check if all scores are zero (indicating scoring failed)
            if (resultsData.scores && Object.values(resultsData.scores).every(score => score === 0)) {
                console.log('All scores are zero, but keeping original data for debugging');
                // Don't return test data here - keep the original data for debugging
            }
            
            return resultsData;
        } catch (error) {
            console.error('Error parsing URL hash data:', error);
        }
    } else {
        console.log('No results hash found in URL');
    }

    // Try to get data from completed assessments (where assessment-manager.js saves it)
    const completedAssessments = localStorage.getItem('valid_completed_assessments');
    console.log('Checking valid_completed_assessments:', completedAssessments);
    
    if (completedAssessments) {
        try {
            const parsedCompleted = JSON.parse(completedAssessments);
            console.log('Parsed completed assessments:', parsedCompleted);
            
            if (Array.isArray(parsedCompleted) && parsedCompleted.length > 0) {
                const latestAssessment = parsedCompleted[parsedCompleted.length - 1];
                console.log('Latest assessment:', latestAssessment);
                
                if (latestAssessment.scores && latestAssessment.answers) {
                    console.log('Found scores and answers in completed assessments:', latestAssessment.scores, latestAssessment.answers);
                    
                    // Only validate if the data looks obviously wrong
                    if (!validateQuestionData(latestAssessment.answers)) {
                        console.log('Invalid question data found, but attempting to use it anyway');
                        // Don't immediately fall back to test data - try to use what we have
                    }
                    
                    try {
                        const { calculateAwarenessScore } = await import('./scoring.js');
                        const awarenessScore = calculateAwarenessScore(latestAssessment.answers);
                        console.log('Calculated awareness score:', awarenessScore);
                        return {
                            scores: latestAssessment.scores,
                            quality: latestAssessment.quality,
                            answers: latestAssessment.answers,
                            awareness: awarenessScore
                        };
                    } catch (error) {
                        console.error('Failed to calculate awareness score:', error);
                        return {
                            scores: latestAssessment.scores,
                            quality: latestAssessment.quality,
                            answers: latestAssessment.answers
                        };
                    }
                } else if (latestAssessment.answers) {
                    // Recalculate scores if only answers are present
                    console.log('Recalculating scores from answers only');
                    
                    // Only validate if the data looks obviously wrong
                    if (!validateQuestionData(latestAssessment.answers)) {
                        console.log('Invalid question data found, but attempting to use it anyway');
                        // Don't immediately fall back to test data - try to use what we have
                    }
                    
                    try {
                        const { calculateRawScoresV2, calculateAwarenessScore } = await import('./scoring.js');
                        const raw = calculateRawScoresV2(latestAssessment.answers);
                        const awarenessScore = calculateAwarenessScore(latestAssessment.answers);
                        console.log('Recalculated raw scores:', raw);
                        console.log('Calculated awareness score:', awarenessScore);
                        return {
                            scores: raw.percent,
                            quality: latestAssessment.quality || {},
                            answers: latestAssessment.answers,
                            awareness: awarenessScore
                        };
                    } catch (e) {
                        console.error('Failed to recalculate scores from answers:', e);
                        // Even if scoring fails, return the answers so we can debug
                        return {
                            scores: { V: 0, A: 0, L: 0, I: 0, D: 0 },
                            quality: latestAssessment.quality || {},
                            answers: latestAssessment.answers,
                            awareness: { percent: 0, flag: false }
                        };
                    }
                } else {
                    console.log('No scores or answers found in latest assessment');
                }
            } else {
                console.log('No completed assessments found or not an array');
            }
        } catch (error) {
            console.error('Error parsing completed assessments data:', error);
        }
    } else {
        console.log('No valid_completed_assessments found in localStorage');
    }

    // Fallback to localStorage (old keys for backward compatibility)
    const assessmentData = localStorage.getItem('validAssessmentData');
    const stateData = localStorage.getItem('validAssessmentState');
    
    console.log('Checking fallback keys:');
    console.log('- validAssessmentData:', assessmentData);
    console.log('- validAssessmentState:', stateData);
    
    // Try assessment data first
    if (assessmentData) {
        try {
            const parsedAssessment = JSON.parse(assessmentData);
            if (parsedAssessment.scores && parsedAssessment.answers) {
                console.log('Found scores and answers in assessment data:', parsedAssessment.scores, parsedAssessment.answers);
                return {
                    scores: parsedAssessment.scores,
                    quality: parsedAssessment.quality,
                    answers: parsedAssessment.answers
                };
            } else if (parsedAssessment.answers) {
                // Recalculate scores if only answers are present
                try {
                    const { calculateRawScoresV2 } = await import('./scoring.js');
                    const raw = calculateRawScoresV2(parsedAssessment.answers);
                    return {
                        scores: raw.percent,
                        quality: parsedAssessment.quality || {},
                        answers: parsedAssessment.answers
                    };
                } catch (e) {
                    console.error('Failed to recalculate scores from answers:', e);
                    // Return the answers even if scoring fails
                    return {
                        scores: { V: 0, A: 0, L: 0, I: 0, D: 0 },
                        quality: parsedAssessment.quality || {},
                        answers: parsedAssessment.answers
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing assessment data:', error);
        }
    }

    // Try state data
    if (stateData) {
        try {
            const parsedState = JSON.parse(stateData);
            if (parsedState.scores && parsedState.answers) {
                console.log('Found scores and answers in state data:', parsedState.scores, parsedState.answers);
                return {
                    scores: parsedState.scores,
                    quality: parsedState.quality,
                    answers: parsedState.answers
                };
            } else if (parsedState.answers) {
                // Recalculate scores if only answers are present
                try {
                    const { calculateRawScoresV2 } = await import('./scoring.js');
                    const raw = calculateRawScoresV2(parsedState.answers);
                    return {
                        scores: raw.percent,
                        quality: parsedState.quality || {},
                        answers: parsedState.answers
                    };
                } catch (e) {
                    console.error('Failed to recalculate scores from answers:', e);
                    // Return the answers even if scoring fails
                    return {
                        scores: { V: 0, A: 0, L: 0, I: 0, D: 0 },
                        quality: parsedState.quality || {},
                        answers: parsedState.answers
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing state data:', error);
        }
    }

    console.log('No real assessment data found, returning test data');
    // Only return test data if absolutely no real data is found
    const testAnswers = getProperTestData();
    
    console.log('Test answers generated:', testAnswers);
    console.log('⚠️ WARNING: Using test data because no real assessment data was found');
    console.log('This means either:');
    console.log('1. No assessment has been completed yet');
    console.log('2. Assessment data was cleared from localStorage');
    console.log('3. Assessment data is stored in an unexpected format');
    console.log('4. There was an error loading the assessment data');
    
    try {
        const { calculateRawScoresV2, calculateAwarenessScore } = await import('./scoring.js');
        console.log('Successfully imported scoring functions');
        
        const raw = calculateRawScoresV2(testAnswers);
        console.log('Raw scores calculated:', raw);
        
        const awarenessScore = calculateAwarenessScore(testAnswers);
        console.log('Awareness score calculated:', awarenessScore);
        
        const result = {
            scores: raw.percent,
            quality: { completion: 100, consistency: 90, thoughtfulness: 85 },
            answers: testAnswers,
            awareness: awarenessScore,
            isTestData: true // Flag to indicate this is test data
        };
        
        console.log('Final test result:', result);
        return result;
    } catch (e) {
        console.error('Failed to calculate test scores:', e);
        return {
            scores: { V: 85, A: 90, L: 75, I: 95, D: 80 },
            quality: { completion: 100, consistency: 90, thoughtfulness: 85 },
            answers: testAnswers,
            awareness: { percent: 65, flag: false },
            isTestData: true // Flag to indicate this is test data
        };
    }
}

// Global variables for scenario functionality
let currentScenario = 'general';
let scenarioInsights = null;
let originalResultsData = null;

// Function to setup scenario selector
async function setupScenarioSelector() {
    const scenarioSelect = document.getElementById('scenarioSelect');
    const scenarioDescription = document.getElementById('scenarioDescription');
    
    if (!scenarioSelect) {
        console.warn('Scenario selector not found');
        return;
    }

    try {
        // Import the scenarios and scoring modules
        const { scenarios, getScenarioInsights, calculateContextScores } = await import('./scenarios.js');
        
        // Make scenarios available globally for backward compatibility
        window.scenarios = scenarios;
        window.calculateContextualScores = calculateContextScores;
        window.getScenarioInsights = getScenarioInsights;
        
        // Update scenario description on load
        updateScenarioDescription(scenarios[currentScenario]);
        
        scenarioSelect.addEventListener('change', async (event) => {
            try {
                const selectedScenario = event.target.value;
                console.log('Scenario changed to:', selectedScenario);
                
                currentScenario = selectedScenario;
                
                // Update scenario description
                updateScenarioDescription(scenarios[selectedScenario]);
                
                // Recalculate scores based on context if we have original answers
                if (originalResultsData && originalResultsData.answers) {
                    console.log('Recalculating scores for context:', selectedScenario);
                    
                    // Calculate context-specific scores using the new overlay logic
                    const contextScores = calculateContextScores(originalResultsData.answers, selectedScenario);
                    console.log('Contextual overlay scores:', contextScores);
                    
                    // Create new results data with context-specific scores
                    const contextResultsData = {
                        ...originalResultsData,
                        scores: contextScores
                    };
                    
                    // Update the UI with new scores
                    updateResultsUI(contextResultsData);
                    
                    // Get scenario-specific insights
                    scenarioInsights = getScenarioInsights(contextScores, selectedScenario);
                    console.log('Scenario insights:', scenarioInsights);
                    
                    // Update the UI with scenario-specific content
                    updateResultsForScenario(contextResultsData, scenarioInsights);
                } else if (originalResultsData && originalResultsData.scores) {
                    // Fallback: use existing scores but update insights
                    scenarioInsights = getScenarioInsights(originalResultsData.scores, selectedScenario);
                    console.log('Scenario insights (using existing scores):', scenarioInsights);
                    
                    // Update the UI with scenario-specific content
                    updateResultsForScenario(originalResultsData, scenarioInsights);
                }
            } catch (error) {
                console.error('Error updating scenario:', error);
            }
        });
        
        console.log('Scenario selector setup complete with new context-aware scoring');
    } catch (error) {
        console.error('Error importing scenarios module:', error);
    }
}

// Function to update scenario description
function updateScenarioDescription(scenario) {
    const scenarioDescription = document.getElementById('scenarioDescription');
    if (scenarioDescription && scenario) {
        scenarioDescription.textContent = scenario.description;
    }
}

// Function to update results for specific scenario
function updateResultsForScenario(resultsData, insights) {
    if (!insights) return;
    
    // Update primary style with scenario-specific insights
    const primaryStyle = document.getElementById('primaryStyle');
    const primaryDescription = document.getElementById('primaryDescription');
    const primaryScore = document.getElementById('primaryScore');
    
    if (primaryStyle && insights.primary) {
        const dimensionLabels = {
            'V': 'Verity (V)',
            'A': 'Association (A)', 
            'L': 'Lived Experience (L)',
            'I': 'Institutional (I)',
            'D': 'Desire (D)'
        };
        
        primaryStyle.textContent = dimensionLabels[insights.primary.dimension];
        primaryScore.textContent = `${Math.round(insights.primary.score)}%`;
        primaryDescription.textContent = insights.primary.insight;
    }
    
    // Update secondary style with scenario-specific insights
    const secondaryStyle = document.getElementById('secondaryStyle');
    const secondaryDescription = document.getElementById('secondaryDescription');
    const secondaryScore = document.getElementById('secondaryScore');
    
    if (secondaryStyle && insights.secondary) {
        const dimensionLabels = {
            'V': 'Verity (V)',
            'A': 'Association (A)', 
            'L': 'Lived Experience (L)',
            'I': 'Institutional (I)',
            'D': 'Desire (D)'
        };
        
        secondaryStyle.textContent = dimensionLabels[insights.secondary.dimension];
        secondaryScore.textContent = `${Math.round(insights.secondary.score)}%`;
        secondaryDescription.textContent = insights.secondary.insight;
    }
    
    // Update development section with scenario insights
    updateDevelopmentSection(insights);
}

// Function to update development section with scenario insights
function updateDevelopmentSection(insights) {
    const developmentSection = document.querySelector('.development-section');
    if (!developmentSection || !insights) return;
    
    let recommendationsHTML = '<h2>Validation Insights</h2><div class="recommendations">';
    
    // Add strengths
    if (insights.strengths && insights.strengths.length > 0) {
        recommendationsHTML += '<div class="recommendation strengths">';
        recommendationsHTML += '<h3>Key Strengths in This Context</h3>';
        insights.strengths.forEach(strength => {
            recommendationsHTML += `<p><strong>${getDimensionName(strength.dimension)}:</strong> ${strength.strength}</p>`;
        });
        recommendationsHTML += '</div>';
    }
    
    // Add recommendations
    if (insights.recommendations && insights.recommendations.length > 0) {
        recommendationsHTML += '<div class="recommendation development">';
        recommendationsHTML += '<h3>Development Opportunities</h3>';
        insights.recommendations.forEach(rec => {
            recommendationsHTML += `<p><strong>${getDimensionName(rec.dimension)}:</strong> ${rec.recommendation}</p>`;
        });
        recommendationsHTML += '</div>';
    }
    
    // Add challenges
    if (insights.challenges && insights.challenges.length > 0) {
        recommendationsHTML += '<div class="recommendation challenges">';
        recommendationsHTML += '<h3>Potential Challenges</h3>';
        insights.challenges.forEach(challenge => {
            recommendationsHTML += `<p><strong>${getDimensionName(challenge.dimension)}:</strong> ${challenge.challenge}</p>`;
        });
        recommendationsHTML += '</div>';
    }
    
    recommendationsHTML += '</div>';
    
    developmentSection.innerHTML = recommendationsHTML;
}

// Helper function to get dimension name
function getDimensionName(dimension) {
    const dimensionNames = {
        'V': 'Verity',
        'A': 'Association',
        'L': 'Lived Experience',
        'I': 'Institutional',
        'D': 'Desire'
    };
    return dimensionNames[dimension] || dimension;
}

// Function to determine primary and secondary styles
function getPrimarySecondaryStyles(scores) {
    const dimensionLabels = {
        'V': 'Verity (V)',
        'A': 'Association (A)', 
        'L': 'Lived Experience (L)',
        'I': 'Institutional (I)',
        'D': 'Desire (D)'
    };

    const dimensionDescriptions = {
        'V': 'You excel in data-driven decision making and analytical problem-solving. This systematic approach enables you to make well-researched and objective decisions.',
        'A': 'You excel in relationship-based decision making and collaborative problem-solving. This interpersonal approach enables you to make decisions that consider multiple perspectives.',
        'L': 'You excel in experience-based decision making and practical problem-solving. This experiential approach enables you to make decisions grounded in real-world knowledge.',
        'I': 'You excel in knowledge-based decision making and systematic problem-solving. This institutional approach enables you to make decisions grounded in established practices.',
        'D': 'You excel in future-focused decision making and visionary problem-solving. This forward-thinking approach enables you to make decisions aligned with long-term goals.'
    };

    const cautionaryNotes = {
        'V': 'High reliance on data can sometimes lead to analysis paralysis or overlook human factors.',
        'A': 'High association-based validation may lead to groupthink or difficulty making independent decisions.',
        'L': 'Heavy reliance on personal experience may limit openness to new ideas or external input.',
        'I': 'Strong institutional trust may resist necessary innovation or challenge to outdated norms.',
        'D': 'Future-focused validation may cause disconnect from present realities or operational limitations.'
    };

    // Sort dimensions by score (highest to lowest)
    const sortedDimensions = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([dimension, score]) => ({ dimension, score }));

    const primary = sortedDimensions[0];
    const secondary = sortedDimensions[1];

    // Always show cautions for primary and secondary styles
    const primaryCaution = cautionaryNotes[primary.dimension];
    const secondaryCaution = cautionaryNotes[secondary.dimension];

    return {
        primary: {
            dimension: primary.dimension,
            label: dimensionLabels[primary.dimension],
            score: Math.round(primary.score),
            description: dimensionDescriptions[primary.dimension],
            caution: primaryCaution
        },
        secondary: {
            dimension: secondary.dimension,
            label: dimensionLabels[secondary.dimension],
            score: Math.round(secondary.score),
            description: dimensionDescriptions[secondary.dimension],
            caution: secondaryCaution
        }
    };
}

/**
 * Update validation insights based on scores
 * @param {Object} scores - The assessment scores
 */
function updateValidationInsights(scores) {
    const recommendationsContainer = document.querySelector('.recommendations');
    if (!recommendationsContainer) {
        console.error('Recommendations container not found');
        return;
    }

    // Sort scores from lowest to highest and get bottom 3
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 3);

    // Clear existing recommendations
    recommendationsContainer.innerHTML = '';

    // Create recommendation elements for bottom 3 scores
    sortedScores.forEach(([dimension, score]) => {
        const recommendation = document.createElement('div');
        const dimensionClass = getDimensionClass(dimension);
        recommendation.className = `recommendation ${dimensionClass}`;
        
        const dimensionName = {
            'V': 'Enhance Data-Driven Decision Making',
            'A': 'Strengthen Relationship Building',
            'L': 'Leverage Personal Experience',
            'I': 'Build Institutional Knowledge',
            'D': 'Enhance Future Vision'
        }[dimension];

        const recommendations = {
            'V': 'Focus on incorporating more analytical approaches and evidence-based methods in your decision-making process.',
            'A': 'Consider incorporating more collaborative approaches and seeking diverse perspectives in your decision-making process.',
            'L': 'Look for opportunities to apply your practical experiences more actively in problem-solving situations.',
            'I': 'Develop a deeper understanding of organizational systems and established practices to inform your decisions.',
            'D': 'Work on integrating more future-focused thinking and long-term planning in your decision-making process.'
        }[dimension];
        
        recommendation.innerHTML = `
            <h3>${dimensionName}</h3>
            <p>${recommendations}</p>
        `;
        
        recommendationsContainer.appendChild(recommendation);
    });
}

// Function to update the UI with results data
function updateResultsUI(resultsData) {
    console.log('[DEBUG] updateResultsUI called with:', JSON.stringify(resultsData));
    
    if (!resultsData || !resultsData.scores) {
        console.error('Invalid results data:', resultsData);
        return;
    }

    const { scores } = resultsData;
    console.log('Updating UI with scores:', scores);
    
    // Store original results data for scenario functionality
    originalResultsData = resultsData;
    
    // Add data source indicator
    const dataSourceIndicator = document.getElementById('dataSourceIndicator');
    if (dataSourceIndicator) {
        const hasRealAnswers = resultsData.answers && Object.keys(resultsData.answers).length > 0;
        const isTestData = resultsData.isTestData || !hasRealAnswers;
        
        if (isTestData) {
            dataSourceIndicator.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px;">
                    <strong>⚠️ Demo Mode:</strong> This page is showing sample data for demonstration purposes. 
                    Complete the assessment to see your actual results.
                    <br><small>To complete the assessment, go to <a href="index.html">the assessment page</a>.</small>
                </div>
            `;
        } else {
            dataSourceIndicator.innerHTML = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; margin: 10px 0; border-radius: 5px;">
                    <strong>✅ Real Data:</strong> Your assessment results based on your actual responses.
                    <br><small>Based on ${Object.keys(resultsData.answers).length} question responses.</small>
                </div>
            `;
        }
    }
    
    const styles = getPrimarySecondaryStyles(scores);
    console.log('Calculated styles:', styles);

    // Update primary and secondary styles (only if no scenario is active)
    if (currentScenario === 'general') {
        const primaryStyleBox = document.querySelector('.primary-style');
        const secondaryStyleBox = document.querySelector('.secondary-style');
        
        if (primaryStyleBox && secondaryStyleBox) {
            console.log('Updating styles with:', styles);
            
            // Update primary style
            document.getElementById('primaryStyle').textContent = styles.primary.label;
            document.getElementById('primaryScore').textContent = `${styles.primary.score}%`;
            document.getElementById('primaryDescription').textContent = styles.primary.description;
            primaryStyleBox.setAttribute('data-dimension', styles.primary.dimension);

            // Always show primary caution
            const primaryCautionEl = document.getElementById('primaryCaution');
            if (primaryCautionEl) {
                console.log('Adding primary caution:', styles.primary.caution);
                primaryCautionEl.textContent = styles.primary.caution;
                console.log('Primary caution element updated');
            } else {
                console.error('Primary caution element not found');
            }

            // Update secondary style
            document.getElementById('secondaryStyle').textContent = styles.secondary.label;
            document.getElementById('secondaryScore').textContent = `${styles.secondary.score}%`;
            document.getElementById('secondaryDescription').textContent = styles.secondary.description;
            secondaryStyleBox.setAttribute('data-dimension', styles.secondary.dimension);

            // Always show secondary caution
            const secondaryCautionEl = document.getElementById('secondaryCaution');
            if (secondaryCautionEl) {
                console.log('Adding secondary caution:', styles.secondary.caution);
                secondaryCautionEl.textContent = styles.secondary.caution;
                console.log('Secondary caution element updated');
            } else {
                console.error('Secondary caution element not found');
            }
        } else {
            console.error('Style boxes not found:', { primaryStyleBox, secondaryStyleBox });
        }
    }

    // Update dimension scores (always update these)
    Object.entries(scores).forEach(([dimension, score]) => {
        const roundedScore = Math.round(score);
        
        // Update score bars
        const scoreBar = document.getElementById(`score${dimension}`);
        const scoreValue = document.querySelector(`#score${dimension}Container .score-value`);
        
        if (scoreBar && scoreValue) {
            scoreBar.style.width = `${roundedScore}%`;
            scoreValue.textContent = `${roundedScore}%`;
        }

        // Update dimension boxes
        const dimensionBox = document.querySelector(`.dimension-box.${getDimensionClass(dimension)} .score`);
        if (dimensionBox) {
            dimensionBox.textContent = `${roundedScore}%`;
        }
    });

    // Update awareness score if available
    if (resultsData.awareness) {
        console.log('Updating awareness score with:', resultsData.awareness);
        const awarenessScore = Math.round(resultsData.awareness.percent);
        const awarenessScoreEl = document.getElementById('awarenessScore');
        const awarenessScoreBar = document.getElementById('awarenessScoreBar');
        const awarenessDescription = document.getElementById('awarenessDescription');
        
        console.log('Awareness elements found:', {
            awarenessScoreEl: !!awarenessScoreEl,
            awarenessScoreBar: !!awarenessScoreBar,
            awarenessDescription: !!awarenessDescription
        });
        
        if (awarenessScoreEl) {
            awarenessScoreEl.textContent = `${awarenessScore}%`;
            console.log('Updated awareness score element to:', awarenessScore);
        } else {
            console.error('Awareness score element not found');
        }
        
        if (awarenessScoreBar) {
            console.log('[DEBUG] Awareness score bar before update:', {
                width: awarenessScoreBar.style.width,
                className: awarenessScoreBar.className,
                computedStyle: window.getComputedStyle(awarenessScoreBar).width,
                backgroundColor: window.getComputedStyle(awarenessScoreBar).backgroundColor
            });
            
            awarenessScoreBar.style.width = `${awarenessScore}%`;
            
            console.log('[DEBUG] Awareness score bar after update:', {
                width: awarenessScoreBar.style.width,
                className: awarenessScoreBar.className,
                computedStyle: window.getComputedStyle(awarenessScoreBar).width,
                backgroundColor: window.getComputedStyle(awarenessScoreBar).backgroundColor
            });
            
            console.log('Updated awareness score bar to:', awarenessScore + '%');
        } else {
            console.error('Awareness score bar element not found');
        }
        
        if (awarenessDescription) {
            let description = 'Your ability to reflect on and understand your own decision-making processes.';
            if (resultsData.awareness.flag) {
                description += ' Consider developing greater self-awareness in your decision-making approach.';
            } else {
                description += ' You demonstrate good metacognitive awareness in your decision-making.';
            }
            awarenessDescription.textContent = description;
            console.log('Updated awareness description to:', description);
        } else {
            console.error('Awareness description element not found');
        }
    } else {
        console.log('No awareness data found in resultsData:', resultsData);
    }

    // Update validation insights (only if no scenario is active)
    if (currentScenario === 'general') {
        updateValidationInsights(scores);
    }

    // Initialize or update radar chart
    initializeRadarChart(scores);
    
    // If a scenario is active, update scenario-specific content
    if (currentScenario !== 'general' && scenarioInsights) {
        updateResultsForScenario(resultsData, scenarioInsights);
    }
}

// Helper function to get dimension class names
function getDimensionClass(dimension) {
    const classMap = {
        'V': 'verity',
        'A': 'association',
        'L': 'lived',
        'I': 'institutional',
        'D': 'desire'
    };
    return classMap[dimension] || '';
}

// Button Functions
function retakeAssessment() {
    // Clear stored data
    localStorage.removeItem('validAssessmentData');
    localStorage.removeItem('validAssessmentState');
    // Redirect to index
    window.location.href = 'index.html';
}

function exportResults() {
    const resultsData = getResultsData();
    if (!resultsData) {
        console.error('No results data found to export');
        alert('No results data found to export.');
        return;
    }

    try {
        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'valid-assessment-results.json';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        console.log('Results exported successfully');
    } catch (error) {
        console.error('Error exporting results:', error);
        alert('Failed to export results. Please try again.');
    }
}

function importResults() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.scores) {
                    throw new Error('Invalid results data format');
                }
                
                // Store the imported data
                localStorage.setItem('validAssessmentData', JSON.stringify(data));
                
                // Update the UI
                updateResultsUI(data);
                
                // Update the URL hash
                const encodedData = btoa(JSON.stringify(data));
                window.location.hash = `results=${encodedData}`;
            } catch (error) {
                alert('Error importing results: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function emailResults() {
    const resultsData = getResultsData();
    if (!resultsData) {
        console.error('No results data found to email');
        alert('No results data found to email.');
        return;
    }

    const email = prompt('Please enter your email address:');
    if (!email) {
        console.log('Email sending cancelled by user');
        return;
    }

    // For now, we'll just download the results since email functionality requires setup
    alert('Email functionality coming soon! Downloading results instead.');
    exportResults();
}

// Initialize radar chart
function initializeRadarChart(scores) {
    console.log('Initializing radar chart with scores:', scores);
    
    // Make sure Chart is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Get the canvas element
    const canvas = document.getElementById('radarChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return;
    }

    // Destroy existing chart if it exists
    if (window.radarChart instanceof Chart) {
        window.radarChart.destroy();
    }

    const chartData = {
        labels: ['Verity (V)', 'Association (A)', 'Lived Experience (L)', 'Institutional (I)', 'Desire (D)'],
        datasets: [{
            data: [
                scores.V || 0,
                scores.A || 0,
                scores.L || 0,
                scores.I || 0,
                scores.D || 0
            ],
            backgroundColor: 'rgba(13, 78, 92, 0.1)',
            borderColor: '#0D4E5C',
            borderWidth: 2,
            pointBackgroundColor: '#0D4E5C',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0D4E5C',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const config = {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        display: false
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            family: "'Segoe UI', sans-serif"
                        },
                        color: '#2d3436'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    };

    try {
        // Always create a new chart instance
        window.radarChart = new Chart(ctx, config);
        console.log('Radar chart created successfully');
    } catch (error) {
        console.error('Error creating radar chart:', error);
    }
}

// Register Chart.js plugin
if (typeof Chart !== 'undefined' && Chart.register) {
    Chart.register(ChartDataLabels);
}

// Expose functions to global scope
window.getResultsData = getResultsData;
window.updateResultsUI = updateResultsUI;
window.retakeAssessment = retakeAssessment;
window.exportResults = exportResults;
window.emailResults = emailResults;

// Initialize results function
async function initializeResults() {
    console.log('[DEBUG] initializeResults called');
    if (window.__lockResultsUI) {
        console.log('[DEBUG] UI is locked by test scoring, skipping initializeResults');
        return;
    }
    console.log('Initializing results page...');
    
    // Clear any invalid data first
    clearInvalidData();
    
    // Get results data
    const resultsData = await getResultsData();
    console.log('Retrieved results data:', resultsData);
    
    if (resultsData && resultsData.scores) {
        console.log('Initializing UI with data:', resultsData);
        
        // Extract original answers from URL hash or localStorage for context-aware scoring
        let originalAnswers = null;
        
        // Try to get answers from URL hash first
        const hash = window.location.hash;
        if (hash.startsWith('#results=')) {
            try {
                const encodedData = hash.substring('#results='.length);
                const decodedData = atob(encodedData);
                const hashData = JSON.parse(decodedData);
                if (hashData.answers && Object.keys(hashData.answers).length > 0) {
                    originalAnswers = hashData.answers;
                    console.log('Found original answers in URL hash:', originalAnswers);
                }
            } catch (error) {
                console.error('Error parsing URL hash for answers:', error);
            }
        }
        
        // If no answers in URL hash, try localStorage
        if (!originalAnswers && resultsData.answers) {
            originalAnswers = resultsData.answers;
            console.log('Found original answers in loaded resultsData:', originalAnswers);
        }
        
        // Store original results data with answers for scenario functionality
        originalResultsData = {
            ...resultsData,
            answers: originalAnswers
        };
        
        console.log('Stored original results data for context scoring:', originalResultsData);
        
        // Update UI with scores
        updateResultsUI(resultsData);
        
        // Initialize radar chart
        setTimeout(() => {
            initializeRadarChart(resultsData.scores);
        }, 100); // Small delay to ensure Chart.js is fully initialized
        
        // Setup scenario selector
        setTimeout(() => {
            setupScenarioSelector();
        }, 200); // Delay to ensure DOM is ready
    } else {
        console.error('No results data found or invalid format:', resultsData);
    }

    // Setup buttons
    const downloadButton = document.getElementById('downloadButton');
    const downloadMenu = document.getElementById('downloadMenu');
    const printButton = document.getElementById('printButton');
    const exportJSONButton = document.getElementById('exportJSONButton');
    const emailButton = document.getElementById('emailButton');
    const startNewButton = document.getElementById('startNewAssessment');
    const generateTestDataButton = document.getElementById('generateTestData');

    if (!downloadButton || !downloadMenu || !printButton || !exportJSONButton || 
        !emailButton || !startNewButton || !generateTestDataButton) {
        console.error('Some UI elements not found:', {
            downloadButton: !!downloadButton,
            downloadMenu: !!downloadMenu,
            printButton: !!printButton,
            exportJSONButton: !!exportJSONButton,
            emailButton: !!emailButton,
            startNewButton: !!startNewButton,
            generateTestDataButton: !!generateTestDataButton
        });
        return;
    }

    console.log('All UI elements found, attaching event listeners...');

    // Toggle dropdown
    downloadButton.addEventListener('click', function(e) {
        e.stopPropagation();
        downloadMenu.classList.toggle('show');
        console.log('Download menu toggled');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!downloadButton.contains(e.target)) {
            downloadMenu.classList.remove('show');
        }
    });

    // Print functionality
    printButton.addEventListener('click', function() {
        console.log('Print button clicked');
        window.print();
    });

    // Export JSON functionality
    exportJSONButton.addEventListener('click', function() {
        console.log('Export JSON button clicked');
        exportResults();
    });

    // Email functionality
    emailButton.addEventListener('click', function() {
        console.log('Email button clicked');
        emailResults();
    });

    // Start New Assessment
    startNewButton.addEventListener('click', function() {
        console.log('Start New button clicked');
        retakeAssessment();
    });

    // Generate Test Data
    generateTestDataButton.addEventListener('click', async function() {
        console.log('Generate Test Data button clicked');
        
        // Use the same balanced test data
        const testAnswers = getProperTestData();
        
        // Calculate actual scores from the answers
        const { calculateRawScoresV2, calculateAwarenessScore } = await import('./scoring.js');
        const raw = calculateRawScoresV2(testAnswers);
        const awarenessScore = calculateAwarenessScore(testAnswers);
        
        const testData = {
            scores: raw.percent,
            quality: {
                completion: 100,
                consistency: 85,
                thoughtfulness: 80
            },
            answers: testAnswers,
            awareness: awarenessScore
        };
        
        console.log('Generated test data with calculated scores:', testData);
        
        // Store original results data for scenario functionality
        originalResultsData = testData;
        
        // Update UI with new test data
        updateResultsUI(testData);
        
        // Store test data
        localStorage.setItem('validAssessmentData', JSON.stringify(testData));
        
        // Update URL hash
        const encodedData = btoa(JSON.stringify(testData));
        window.location.hash = `results=${encodedData}`;
        
        // Re-initialize scenario selector with new data
        setTimeout(() => {
            setupScenarioSelector();
        }, 100);
    });

    // Test Scoring Button
    const testScoringButton = document.getElementById('testScoring');
    if (testScoringButton) {
        testScoringButton.addEventListener('click', async function() {
            console.log('Test Scoring button clicked');
            
            try {
                // Test the scoring function directly
                const { calculateRawScoresV2, calculateAwarenessScore } = await import('./scoring.js');
                console.log('Scoring functions imported successfully');
                
                const testAnswers = getProperTestData();
                console.log('Test answers:', testAnswers);
                
                const rawScores = calculateRawScoresV2(testAnswers);
                console.log('Raw scores result:', rawScores);
                
                const awarenessScore = calculateAwarenessScore(testAnswers);
                console.log('Awareness score result:', awarenessScore);
                
                // Update the UI with the test data
                const testData = {
                    scores: rawScores.percent,
                    quality: { completion: 100, consistency: 85, thoughtfulness: 80 },
                    answers: testAnswers,
                    awareness: awarenessScore
                };
                updateResultsUI(testData);
                window.__lockResultsUI = true; // Lock the UI so it doesn't get overwritten
                alert(`Scoring test completed!\nRaw scores: ${JSON.stringify(rawScores.raw)}\nPercentages: ${JSON.stringify(rawScores.percent)}\nAwareness: ${awarenessScore.percent}%`);
                
            } catch (error) {
                console.error('Test scoring failed:', error);
                alert(`Scoring test failed: ${error.message}`);
            }
        });
    }

    console.log('All event listeners attached successfully');
}

// Export the initializeResults function
window.initializeResults = initializeResults;

// Function to validate and clean up question data
function validateQuestionData(answers) {
    if (!answers || typeof answers !== 'object') {
        console.log('No answers data or invalid format');
        return false;
    }
    
    // Check if answers contain invalid question IDs (like q1, q2, q3)
    const invalidIds = Object.keys(answers).filter(id => /^q\d+$/.test(id));
    if (invalidIds.length > 0) {
        console.log('Found invalid question IDs:', invalidIds);
        console.log('Clearing invalid data and using proper test data');
        return false;
    }
    
    // Check if we have any valid VALID assessment questions
    // Include all possible question prefixes from the questions data
    const validIds = Object.keys(answers).filter(id => 
        id.startsWith('DT-') || id.startsWith('IG-') || id.startsWith('CB-') || 
        id.startsWith('UP-') || id.startsWith('CR-') || id.startsWith('PD-') || 
        id.startsWith('SA-') || id.startsWith('AW-') || id.startsWith('SD-') || 
        id.startsWith('AC-')
    );
    
    if (validIds.length === 0) {
        console.log('No valid VALID assessment question IDs found');
        console.log('Available question IDs:', Object.keys(answers));
        return false;
    }
    
    console.log(`Found ${validIds.length} valid question IDs out of ${Object.keys(answers).length} total`);
    console.log('Valid IDs:', validIds);
    
    // Be more lenient - if we have at least some valid questions, consider it valid
    // This allows for partial data or data with some extra fields
    return validIds.length >= 5; // Require at least 5 valid questions
}

// Function to get proper test data
function getProperTestData() {
    return {
        // Decision Triggers (DT) - Verity, Association, Lived, Institutional, Desire
        "DT-01": 6, // Verity - data-driven
        "DT-02": 4, // Association - relationship-based  
        "DT-03": 5, // Lived - experiential
        "DT-04": 6, // Institutional - established practices
        "DT-05": 3, // Desire - future-focused
        "DT-06": 3, // Verity (reverse) - data-driven
        "DT-07": 5, // Association (reverse) - relationship-based
        
        // Information Gathering (IG) - Verity, Association, Lived, Institutional, Desire
        "IG-01": 5, // Verity - research and evidence
        "IG-02": 4, // Association - input from respected people
        "IG-03": 6, // Lived - own past experiences
        "IG-04": 6, // Institutional - recognized experts
        "IG-05": 3, // Desire - personal values and vision
        "IG-06": 4, // Verity (reverse) - research and evidence
        "IG-07": 5, // Association (reverse) - input from others
        
        // Confidence Building (CB) - Verity, Association, Lived, Institutional, Desire
        "CB-01": 6, // Verity - numbers clearly point
        "CB-02": 4, // Association - trusted people agree
        "CB-03": 5, // Lived - mirror what's worked before
        "CB-04": 5, // Institutional - established research
        "CB-05": 4, // Desire - feels right in gut
        "CB-06": 4, // Lived (reverse) - open to new approaches
        "CB-07": 5, // Institutional (reverse) - ignore procedures
        
        // Urgency & Pressure (UP) - Verity, Association, Lived, Institutional, Desire
        "UP-01": 5, // Verity - quick analysis
        "UP-02": 4, // Association - consult quickly
        "UP-03": 4, // Lived - draw on experience
        "UP-04": 5, // Institutional - follow protocols
        "UP-05": 4, // Desire - focus on outcome
        "UP-06": 5, // Lived (reverse) - try new approaches
        "UP-07": 4, // Institutional (reverse) - adapt procedures
        
        // Conflict Resolution (CR) - Verity, Association, Lived, Institutional, Desire
        "CR-01": 5, // Verity - find facts
        "CR-02": 4, // Association - find common ground
        "CR-03": 5, // Lived - draw on experience
        "CR-04": 5, // Institutional - follow procedures
        "CR-05": 3, // Desire - focus on future
        "CR-06": 4, // Lived (reverse) - try new approaches
        
        // Process & Decision (PD) - Verity, Association, Lived, Institutional, Desire
        "PD-01": 6, // Verity - systematic analysis
        "PD-02": 4, // Association - collaborative process
        "PD-03": 4, // Lived - practical approach
        "PD-04": 5, // Institutional - structured process
        "PD-05": 3, // Desire - visionary approach
        "PD-06": 4, // Lived (reverse) - flexible approach
        
        // General Validation Preferences (SA) - Verity, Association, Lived, Institutional, Desire
        "SA-01": 6, // Verity - examine data thoroughly
        "SA-02": 5, // Verity - facts over stories
        "SA-03": 4, // Association - seek input from network
        "SA-04": 4, // Association - respect others' opinions
        "SA-05": 5, // Lived - trust own experience
        "SA-06": 5, // Lived - learn by trying
        "SA-07": 4, // Institutional - follow procedures
        "SA-08": 5, // Institutional - expert opinions
        "SA-09": 4, // Desire - gut feelings
        "SA-10": 4, // Desire - core values
        
        // Social Desirability Scale (SD) - Quality control
        "SD-01": 4, // Social desirability
        "SD-02": 3, // Social desirability (reverse)
        "SD-03": 4, // Social desirability
        "SD-04": 3, // Social desirability (reverse)
        "SD-05": 4, // Social desirability
        
        // Attention Checks (AC) - Quality control
        "AC-01": 4, // Attention check - correct answer is 4
        "AC-02": 1, // Attention check - correct answer is 1
        
        // Awareness questions (AW) - moderate scores
        "AW-01": 5, "AW-02": 4, "AW-03": 5, "AW-04": 4, "AW-05": 5, "AW-06": 4, "AW-07": 5
    };
}

// Function to clear invalid localStorage data
function clearInvalidData() {
    console.log('Clearing invalid localStorage data...');
    
    // Check and clear invalid data from all possible keys
    const keysToCheck = [
        'valid_completed_assessments',
        'validAssessmentData', 
        'validAssessmentState'
    ];
    
    keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                let hasInvalidData = false;
                
                // Check if it's an array of assessments
                if (Array.isArray(parsed)) {
                    parsed.forEach(assessment => {
                        if (assessment.answers && !validateQuestionData(assessment.answers)) {
                            hasInvalidData = true;
                        }
                    });
                } else if (parsed.answers && !validateQuestionData(parsed.answers)) {
                    hasInvalidData = true;
                }
                
                if (hasInvalidData) {
                    console.log(`Clearing invalid data from ${key}`);
                    localStorage.removeItem(key);
                }
            } catch (error) {
                console.log(`Error parsing ${key}, removing:`, error);
                localStorage.removeItem(key);
            }
        }
    });
    
    console.log('Invalid data cleared');
}

// Function to reset all data and use test data
function resetToTestData() {
    console.log('Resetting to test data...');
    
    // Clear all assessment data
    localStorage.removeItem('valid_completed_assessments');
    localStorage.removeItem('validAssessmentData');
    localStorage.removeItem('validAssessmentState');
    
    // Reload the page to use test data
    window.location.reload();
}

// Make utility functions globally available
window.clearInvalidData = clearInvalidData;
window.resetToTestData = resetToTestData;