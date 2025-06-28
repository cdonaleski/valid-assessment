// Shared Results UI Module for VALID Assessment
// This file is intended to be imported by both results.html and dashboard.html

// Helper: Get dimension class
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

// Helper: Get primary/secondary styles
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

// Helper: Update validation insights
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

// Main: Update results UI
function updateResultsUI(resultsData) {
    console.log('[DEBUG] updateResultsUI called with:', JSON.stringify(resultsData));
    if (!resultsData || !resultsData.scores) {
        console.error('Invalid results data:', resultsData);
        return;
    }
    const { scores } = resultsData;
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
    // Update primary and secondary styles (only if no scenario is active)
    if (typeof currentScenario === 'undefined' || currentScenario === 'general') {
        const primaryStyleBox = document.querySelector('.primary-style');
        const secondaryStyleBox = document.querySelector('.secondary-style');
        if (primaryStyleBox && secondaryStyleBox) {
            document.getElementById('primaryStyle').textContent = styles.primary.label;
            document.getElementById('primaryScore').textContent = `${styles.primary.score}%`;
            document.getElementById('primaryDescription').textContent = styles.primary.description;
            primaryStyleBox.setAttribute('data-dimension', styles.primary.dimension);
            const primaryCautionEl = document.getElementById('primaryCaution');
            if (primaryCautionEl) {
                primaryCautionEl.textContent = styles.primary.caution;
            }
            document.getElementById('secondaryStyle').textContent = styles.secondary.label;
            document.getElementById('secondaryScore').textContent = `${styles.secondary.score}%`;
            document.getElementById('secondaryDescription').textContent = styles.secondary.description;
            secondaryStyleBox.setAttribute('data-dimension', styles.secondary.dimension);
            const secondaryCautionEl = document.getElementById('secondaryCaution');
            if (secondaryCautionEl) {
                secondaryCautionEl.textContent = styles.secondary.caution;
            }
        }
    }
    // Update dimension scores
    Object.entries(scores).forEach(([dimension, score]) => {
        const roundedScore = Math.round(score);
        const scoreBar = document.getElementById(`score${dimension}`);
        const scoreValue = document.querySelector(`#score${dimension}Container .score-value`);
        if (scoreBar && scoreValue) {
            scoreBar.style.width = `${roundedScore}%`;
            scoreValue.textContent = `${roundedScore}%`;
        }
        const dimensionBox = document.querySelector(`.dimension-box.${getDimensionClass(dimension)} .score`);
        if (dimensionBox) {
            dimensionBox.textContent = `${roundedScore}%`;
        }
    });
    // Update awareness score if available
    if (resultsData.awareness) {
        const awarenessScore = Math.round(resultsData.awareness.percent);
        const awarenessScoreEl = document.getElementById('awarenessScore');
        const awarenessScoreBar = document.getElementById('awarenessScoreBar');
        const awarenessDescription = document.getElementById('awarenessDescription');
        if (awarenessScoreEl) {
            awarenessScoreEl.textContent = `${awarenessScore}%`;
        }
        if (awarenessScoreBar) {
            awarenessScoreBar.style.width = `${awarenessScore}%`;
        }
        if (awarenessDescription) {
            let description = 'Your ability to reflect on and understand your own decision-making processes.';
            if (resultsData.awareness.flag) {
                description += ' Consider developing greater self-awareness in your decision-making approach.';
            } else {
                description += ' You demonstrate good metacognitive awareness in your decision-making.';
            }
            awarenessDescription.textContent = description;
        }
    }
    // Update validation insights (only if no scenario is active)
    if (typeof currentScenario === 'undefined' || currentScenario === 'general') {
        updateValidationInsights(scores);
    }
    // Initialize or update radar chart
    initializeRadarChart(scores);
    // If a scenario is active, update scenario-specific content (not handled in shared module)
}

// Chart.js Radar Chart
function initializeRadarChart(scores) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
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
        window.radarChart = new Chart(ctx, config);
    } catch (error) {
        console.error('Error creating radar chart:', error);
    }
}

// Export for use in other scripts
window.updateResultsUI = updateResultsUI;
window.initializeRadarChart = initializeRadarChart;
export { updateResultsUI, initializeRadarChart }; 