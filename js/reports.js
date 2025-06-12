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
 * @param {Object} results - Assessment results including scores and persona
 * @returns {Promise<Blob>} PDF document as blob
 */
export async function generatePDF(results) {
    try {
        console.log('Starting PDF generation with results:', results);
        
        // Initialize jsPDF
        if (!window.jspdf) {
            console.error('jsPDF not loaded');
            throw new Error('PDF generation library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        console.log('jsPDF initialized');
        
        // Create new PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Page 1: Executive Summary
        await generateExecutiveSummary(doc, results);
        doc.addPage();

        // Page 2: Detailed Insights
        await generateDetailedInsights(doc, results);
        doc.addPage();

        // Page 3: Development Plan
        await generateDevelopmentPlan(doc, results);

        // Save and download the PDF
        const filename = `VALID-Assessment-Results-${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('Saving PDF as:', filename);
        doc.save(filename);
    } catch (error) {
        console.error('Error in PDF generation:', error);
        throw error;
    }
}

/**
 * Generate executive summary page
 * @param {Object} doc - jsPDF document
 * @param {Object} results - Assessment results
 */
async function generateExecutiveSummary(doc, results) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('VALID Assessment Results', margins.left, margins.top + 10);

    // Date
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.setFontSize(PDF_CONFIG.fonts.subheader.size);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.text(new Date().toLocaleDateString(), pageWidth - margins.right, margins.top + 25, { align: 'right' });

    // Scores Summary
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);

    let yPos = margins.top + 40;
    const dimensions = {
        V: 'Verity (Data-Driven)',
        A: 'Association (Relationship)',
        L: 'Lived Experience',
        I: 'Institutional Knowledge',
        D: 'Desire (Future-Focused)'
    };

    Object.entries(dimensions).forEach(([key, label]) => {
        const score = results.scores[key];
        doc.text(`${label}: ${score}%`, margins.left, yPos);
        yPos += 10;
    });

    // Primary Style
    yPos += 10;
    doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
    doc.text('Your Primary Style', margins.left, yPos);
    
    yPos += 10;
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    const primaryStyle = `${results.persona.primary} (${Math.max(...Object.values(results.scores))}%)`;
    doc.text(primaryStyle, margins.left, yPos);

    // Add chart
    try {
        const chartImage = await createChartImage(results.scores);
        const imgWidth = 150;
        const imgHeight = 150;
        doc.addImage(
            chartImage,
            'PNG',
            (pageWidth - imgWidth) / 2,
            yPos + 10,
            imgWidth,
            imgHeight
        );
    } catch (error) {
        console.error('Failed to add chart to PDF:', error);
    }
}

/**
 * Generate detailed insights page
 * @param {Object} doc - jsPDF document
 * @param {Object} results - Assessment results
 */
async function generateDetailedInsights(doc, results) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Page Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('Detailed Insights', margins.left, margins.top + 10);

    // Description
    doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
    doc.setFontSize(PDF_CONFIG.fonts.body.size);
    doc.setTextColor(...PDF_CONFIG.colors.text);

    let yPos = margins.top + 30;
    
    if (results.persona.description) {
        const description = doc.splitTextToSize(results.persona.description, contentWidth);
        doc.text(description, margins.left, yPos);
        yPos += (description.length * 7) + 10;
    }

    // Secondary Style
    if (results.persona.secondary) {
        doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
        doc.text('Secondary Style', margins.left, yPos);
        yPos += 10;

        doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
        const secondaryText = doc.splitTextToSize(
            `Your secondary style is ${results.persona.secondary}. This indicates flexibility in your decision-making approach.`,
            contentWidth
        );
        doc.text(secondaryText, margins.left, yPos);
    }
}

/**
 * Generate development plan page
 * @param {Object} doc - jsPDF document
 * @param {Object} results - Assessment results
 */
async function generateDevelopmentPlan(doc, results) {
    const { pageWidth, margins } = PDF_CONFIG;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Page Header
    doc.setFont(PDF_CONFIG.fonts.header.name, PDF_CONFIG.fonts.header.style);
    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('Development Opportunities', margins.left, margins.top + 10);

    let yPos = margins.top + 30;

    // Development Areas
    if (results.development) {
        doc.setFont(PDF_CONFIG.fonts.subheader.name, PDF_CONFIG.fonts.subheader.style);
        doc.setFontSize(PDF_CONFIG.fonts.subheader.size);
        doc.setTextColor(...PDF_CONFIG.colors.secondary);
        doc.text(results.development.area, margins.left, yPos);
        yPos += 10;

        doc.setFont(PDF_CONFIG.fonts.body.name, PDF_CONFIG.fonts.body.style);
        doc.setFontSize(PDF_CONFIG.fonts.body.size);
        doc.setTextColor(...PDF_CONFIG.colors.text);
        const description = doc.splitTextToSize(results.development.description, contentWidth);
        doc.text(description, margins.left, yPos);
    }
}

/**
 * Create chart image for PDF
 * @param {Object} scores - VALID dimension scores
 * @returns {Promise<string>} Base64 encoded image
 */
async function createChartImage(scores) {
    try {
        console.log('Creating chart image with scores:', scores);
        
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Create chart
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Verity', 'Association', 'Lived Experience', 'Institutional', 'Desire'],
                datasets: [{
                    label: 'Your VALID Profile',
                    data: [scores.V || 0, scores.A || 0, scores.L || 0, scores.I || 0, scores.D || 0],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Wait for chart animation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get image data
        const imageData = canvas.toDataURL('image/png');
        
        // Cleanup
        chart.destroy();
        document.body.removeChild(canvas);
        
        console.log('Chart image created successfully');
        return imageData;
    } catch (error) {
        console.error('Error creating chart image:', error);
        throw error;
    }
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