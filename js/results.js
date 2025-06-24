// Function to get results data from URL hash or localStorage
function getResultsData() {
    // First try to get data from URL hash
    const hash = window.location.hash;
    if (hash.startsWith('#results=')) {
        try {
            const encodedData = hash.substring('#results='.length);
            const decodedData = atob(encodedData);
            const resultsData = JSON.parse(decodedData);
            console.log('Loaded results from URL hash:', resultsData);
            return resultsData;
        } catch (error) {
            console.error('Error parsing URL hash data:', error);
        }
    }

    // Fallback to localStorage
    const assessmentData = localStorage.getItem('validAssessmentData');
    const stateData = localStorage.getItem('validAssessmentState');
    
    // Try assessment data first
    if (assessmentData) {
        try {
            const parsedAssessment = JSON.parse(assessmentData);
            if (parsedAssessment.scores) {
                console.log('Found scores in assessment data:', parsedAssessment.scores);
                return {
                    scores: parsedAssessment.scores,
                    quality: parsedAssessment.quality
                };
            }
        } catch (error) {
            console.error('Error parsing assessment data:', error);
        }
    }

    // Try state data
    if (stateData) {
        try {
            const parsedState = JSON.parse(stateData);
            if (parsedState.scores) {
                console.log('Found scores in state data:', parsedState.scores);
                return {
                    scores: parsedState.scores,
                    quality: parsedState.quality
                };
            }
        } catch (error) {
            console.error('Error parsing state data:', error);
        }
    }

    // Return test data if no real data is found
    return {
        scores: {
            V: 85,
            A: 90,
            L: 75,
            I: 95,
            D: 80
        },
        quality: {
            completion: 100,
            consistency: 90,
            thoughtfulness: 85
        }
    };
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
    if (!resultsData || !resultsData.scores) {
        console.error('Invalid results data:', resultsData);
        return;
    }

    const { scores } = resultsData;
    console.log('Updating UI with scores:', scores);
    
    const styles = getPrimarySecondaryStyles(scores);

    // Update primary and secondary styles
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

    // Update dimension scores
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

    // Update validation insights
    updateValidationInsights(scores);

    // Initialize or update radar chart
    initializeRadarChart(scores);
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
function initializeResults() {
    console.log('Initializing results page...');
    
    // Initialize the UI with data
    const resultsData = getResultsData();
    if (resultsData && resultsData.scores) {
        console.log('Initializing UI with data:', resultsData);
        
        // Update UI with scores
        updateResultsUI(resultsData);
        
        // Initialize radar chart
        setTimeout(() => {
            initializeRadarChart(resultsData.scores);
        }, 100); // Small delay to ensure Chart.js is fully initialized
    } else {
        console.error('No results data found');
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
    generateTestDataButton.addEventListener('click', function() {
        console.log('Generate Test Data button clicked');
        const testData = {
            scores: {
                V: Math.floor(Math.random() * 100),
                A: Math.floor(Math.random() * 100),
                L: Math.floor(Math.random() * 100),
                I: Math.floor(Math.random() * 100),
                D: Math.floor(Math.random() * 100)
            },
            quality: {
                completion: 100,
                consistency: Math.floor(Math.random() * 100),
                thoughtfulness: Math.floor(Math.random() * 100)
            }
        };
        
        console.log('Generated test data:', testData);
        
        // Update UI with new test data
        updateResultsUI(testData);
        
        // Store test data
        localStorage.setItem('validAssessmentData', JSON.stringify(testData));
        
        // Update URL hash
        const encodedData = btoa(JSON.stringify(testData));
        window.location.hash = `results=${encodedData}`;
    });

    console.log('All event listeners attached successfully');
}

// Export the initializeResults function
window.initializeResults = initializeResults;