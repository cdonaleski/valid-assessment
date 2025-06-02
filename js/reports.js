/**
 * VALID Assessment Tool - Reports Module
 * Purpose: Generates comprehensive assessment reports and visualizations.
 * 
 * This module handles:
 * - Report generation
 * - Data visualization
 * - PDF export functionality
 * - Custom report templates
 * - Comparative analysis
 */ 

/**
 * VALID Assessment Report Generator
 * Generates and delivers professional PDF reports with personalized insights
 */

// PDF Generation Constants
const PDF_CONFIG = {
    pageWidth: 210, // A4 width in mm
    pageHeight: 297, // A4 height in mm
    margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
    },
    fonts: {
        header: {
            name: 'helvetica',
            style: 'bold',
            size: 24
        },
        subheader: {
            name: 'helvetica',
            style: 'bold',
            size: 16
        },
        body: {
            name: 'helvetica',
            style: 'normal',
            size: 12
        }
    },
    colors: {
        primary: [52, 152, 219],
        secondary: [44, 62, 80],
        text: [52, 73, 94]
    }
};

/**
 * Generate complete PDF report
 * @param {Object} persona - Persona data
 * @param {Object} scores - VALID dimension scores
 * @param {Object} demographics - User demographic data
 * @returns {Promise<Blob>} PDF document as blob
 */
export async function generatePDF(persona, scores, demographics) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Page 1: Executive Summary
    await generateExecutiveSummary(doc, persona, scores, demographics);
    doc.addPage();

    // Page 2: Detailed Insights
    await generateDetailedInsights(doc, persona, scores);
    doc.addPage();

    // Page 3: Development Plan
    await generateDevelopmentPlan(doc, persona, scores);

    return doc.output('blob');
}

/**
 * Generate executive summary page
 * @param {Object} doc - jsPDF document
 * @param {Object} persona - Persona data
 * @param {Object} scores - VALID scores
 * @param {Object} demographics - User demographics
 */
async function generateExecutiveSummary(doc, persona, scores, demographics) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('VALID Assessment Results', margins.left, margins.top + 10);

    // Persona Name & Date
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.setFontSize(PDF_CONFIG.fonts.subheader.size);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.text(persona.name, margins.left, margins.top + 25);
    doc.text(new Date().toLocaleDateString(), pageWidth - margins.right, margins.top + 25, { align: 'right' });

    // Description
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    
    const description = formatPersonalizedContent(persona, scores);
    const splitDesc = doc.splitTextToSize(description, contentWidth);
    doc.text(splitDesc, margins.left, margins.top + 40);

    // Primary Strength Box
    drawStrengthBox(doc, persona, margins.left, margins.top + 80, contentWidth);

    // Skills Development Message
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.text('Skills You Can Develop', margins.left, margins.top + 140);
    
    const growthMessage = "Your VALID assessment results reflect your current preferences and approaches - not fixed traits. These are skills you can develop and adapt as you grow professionally.";
    const splitGrowth = doc.splitTextToSize(growthMessage, contentWidth);
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.text(splitGrowth, margins.left, margins.top + 155);
}

/**
 * Generate detailed insights page
 * @param {Object} doc - jsPDF document
 * @param {Object} persona - Persona data
 * @param {Object} scores - VALID scores
 */
async function generateDetailedInsights(doc, persona, scores) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Page Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('Your VALID Profile', margins.left, margins.top + 10);

    // Radar Chart
    const chartImage = await createChartImage(scores);
    doc.addImage(
        chartImage,
        'PNG',
        margins.left,
        margins.top + 20,
        contentWidth,
        contentWidth * 0.75
    );

    // Scenarios Section
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.setFontSize(PDF_CONFIG.fonts.subheader.size);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.text('When Your Style Excels', margins.left, margins.top + 140);

    // Scenarios Content
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);

    let yPos = margins.top + 155;
    persona.idealEnvironments.forEach(scenario => {
        doc.text(`• ${scenario}`, margins.left + 5, yPos);
        yPos += 10;
    });
}

/**
 * Generate development plan page
 * @param {Object} doc - jsPDF document
 * @param {Object} persona - Persona data
 * @param {Object} scores - VALID scores
 */
async function generateDevelopmentPlan(doc, persona, scores) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Page Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('30-Day Development Plan', margins.left, margins.top + 10);

    // Focus Area
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.setFontSize(PDF_CONFIG.fonts.subheader.size);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.text('Focus Area', margins.left, margins.top + 30);

    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    
    const focusArea = persona.developmentTips[0];
    const splitFocus = doc.splitTextToSize(focusArea, contentWidth);
    doc.text(splitFocus, margins.left, margins.top + 45);

    // Action Steps
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.text('Action Steps', margins.left, margins.top + 70);

    let yPos = margins.top + 85;
    generateActionSteps(persona).forEach((step, index) => {
        doc.setFont(PDF_CONFIG.fonts.body.name, 'bold');
        doc.text(`${index + 1}. ${step.timeframe}`, margins.left, yPos);
        doc.setFont(PDF_CONFIG.fonts.body.name, 'normal');
        const splitStep = doc.splitTextToSize(step.action, contentWidth - 10);
        doc.text(splitStep, margins.left + 10, yPos + 10);
        yPos += 25;
    });
}

/**
 * Create chart image for PDF
 * @param {Object} scores - VALID dimension scores
 * @returns {Promise<string>} Base64 encoded image
 */
async function createChartImage(scores) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const chart = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Verity', 'Association', 'Lived Experience', 'Institutional', 'Desire'],
            datasets: [{
                label: 'Your VALID Profile',
                data: [scores.V, scores.A, scores.L, scores.I, scores.D],
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    return new Promise(resolve => {
        setTimeout(() => {
            const image = canvas.toDataURL('image/png');
            chart.destroy();
            resolve(image);
        }, 100);
    });
}

/**
 * Format personalized content based on persona and scores
 * @param {Object} persona - Persona data
 * @param {Object} scores - VALID scores
 * @returns {string} Formatted content
 */
function formatPersonalizedContent(persona, scores) {
    return `As a ${persona.name}, you currently demonstrate a strong preference for ${persona.validationPattern} approaches to validation and decision-making. ${persona.description} Your approach is particularly valuable in ${persona.organizationalImpact.toLowerCase()}.`;
}

/**
 * Generate 30-day action plan steps
 * @param {Object} persona - Persona data
 * @returns {Array} Action steps
 */
function generateActionSteps(persona) {
    return [
        {
            timeframe: 'Week 1-2',
            action: persona.developmentTips[0]
        },
        {
            timeframe: 'Week 3-4',
            action: persona.developmentTips[1]
        },
        {
            timeframe: 'Throughout',
            action: 'Document your experiences and reflect on what works best in different situations.'
        },
        {
            timeframe: 'End of Month',
            action: 'Review your progress and adjust your approach based on what you\'ve learned.'
        }
    ];
}

/**
 * Draw strength highlight box
 * @param {Object} doc - jsPDF document
 * @param {Object} persona - Persona data
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Box width
 */
function drawStrengthBox(doc, persona, x, y, width) {
    const boxHeight = 50;
    const radius = 5;

    // Draw box with rounded corners
    doc.setFillColor(242, 247, 251);
    doc.roundedRect(x, y, width, boxHeight, radius, radius, 'F');

    // Add content
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.setFontSize(14);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('Primary Strength', x + 10, y + 15);

    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    const strengthText = doc.splitTextToSize(persona.organizationalImpact, width - 20);
    doc.text(strengthText, x + 10, y + 30);
}

/**
 * Send PDF report via email
 * @param {string} email - Recipient email
 * @param {Blob} pdfData - Generated PDF data
 * @returns {Promise<void>}
 */
export async function sendReport(email, pdfData) {
    try {
        const reader = new FileReader();
        reader.readAsDataURL(pdfData);

        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const response = await emailjs.send(
                        config.emailjs.serviceId,
                        config.emailjs.templateId,
                        {
                            to_email: email,
                            report_data: reader.result.split(',')[1],
                            template_params: {
                                date: new Date().toLocaleDateString()
                            }
                        },
                        config.emailjs.userId
                    );
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read PDF data'));
        });
    } catch (error) {
        throw new Error(`Failed to send report: ${error.message}`);
    }
}

// Export core functions
export {
    createChartImage,
    formatPersonalizedContent,
    generateActionSteps
}; 