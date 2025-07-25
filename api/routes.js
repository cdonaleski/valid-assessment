/**
 * API Routes for Mobile VALID Assessment
 * Handles webhook endpoints and other API functionality
 */

const express = require('express');
const router = express.Router();
const ConfigManager = require('../js/config-manager');

// Webhook handlers for different involvement types
const involvementHandlers = {
    consultant: async (data) => {
        console.log('Processing consultant application:', data.contact_data.email);
        
        // Trigger automation for consultant interest
        await triggerAutomation('consultant', {
            priority: 'high',
            responseTime: '24 hours',
            action: 'consultant_application',
            contact: data.contact_data
        });
        
        return { success: true, message: 'Consultant application processed' };
    },
    
    pilot: async (data) => {
        console.log('Processing pilot program request:', data.contact_data.email);
        
        // Trigger automation for pilot program
        await triggerAutomation('pilot', {
            priority: 'high',
            responseTime: '48 hours',
            action: 'pilot_request',
            contact: data.contact_data
        });
        
        return { success: true, message: 'Pilot program request processed' };
    },
    
    research: async (data) => {
        console.log('Processing research cohort signup:', data.contact_data.email);
        
        // Trigger automation for research interest
        await triggerAutomation('research', {
            priority: 'medium',
            responseTime: 'weekly',
            action: 'research_signup',
            contact: data.contact_data
        });
        
        return { success: true, message: 'Research cohort signup processed' };
    },
    
    updates: async (data) => {
        console.log('Processing newsletter subscription:', data.contact_data.email);
        
        // Trigger automation for newsletter
        await triggerAutomation('updates', {
            priority: 'low',
            responseTime: 'automatic',
            action: 'newsletter_signup',
            contact: data.contact_data
        });
        
        return { success: true, message: 'Newsletter subscription processed' };
    },
    
    founder: async (data) => {
        console.log('Processing founder call request:', data.contact_data.email);
        
        // Trigger automation for founder call (highest priority)
        await triggerAutomation('founder', {
            priority: 'urgent',
            responseTime: 'same day',
            action: 'founder_call_request',
            contact: data.contact_data
        });
        
        return { success: true, message: 'Founder call request processed' };
    }
};

// Main webhook endpoint for involvement tracking
router.post('/webhooks/involvement', async (req, res) => {
    try {
        const { involvement_type, contact_data, assessment_id, timestamp } = req.body;
        
        // Validate required fields
        if (!involvement_type || !contact_data || !assessment_id) {
            return res.status(400).json({
                error: 'Missing required fields: involvement_type, contact_data, assessment_id'
            });
        }
        
        // Validate involvement type
        if (!involvementHandlers[involvement_type]) {
            return res.status(400).json({
                error: `Invalid involvement type: ${involvement_type}`
            });
        }
        
        console.log(`Processing ${involvement_type} involvement for assessment ${assessment_id}`);
        
        // Process the involvement preference
        const result = await involvementHandlers[involvement_type](req.body);
        
        // Log the activity
        await logWebhookActivity({
            involvement_type,
            assessment_id,
            contact_email: contact_data.email,
            contact_name: contact_data.name,
            timestamp: timestamp || new Date().toISOString(),
            result
        });
        
        res.json({
            success: true,
            involvement_type,
            message: result.message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            involvement_type: req.body.involvement_type,
            timestamp: new Date().toISOString()
        });
    }
});

// Analytics endpoint (optional)
router.get('/analytics/involvement', async (req, res) => {
    try {
        // This would typically query your database for analytics
        // For now, return sample analytics data
        const analytics = {
            total_assessments: 0,
            involvement_breakdown: {
                consultant: 0,
                pilot: 0,
                research: 0,
                updates: 0,
                founder: 0
            },
            response_times: {
                consultant: '24 hours',
                pilot: '48 hours',
                research: 'weekly',
                updates: 'automatic',
                founder: 'same day'
            },
            last_updated: new Date().toISOString()
        };
        
        res.json(analytics);
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve analytics',
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to trigger external automations
async function triggerAutomation(automationType, data) {
    try {
        console.log(`Triggering ${automationType} automation:`, data);
        
        // Example webhook URLs (replace with your actual automation endpoints)
        const webhookUrls = {
            consultant: process.env.CONSULTANT_WEBHOOK_URL,
            pilot: process.env.PILOT_WEBHOOK_URL,
            research: process.env.RESEARCH_WEBHOOK_URL,
            updates: process.env.NEWSLETTER_WEBHOOK_URL,
            founder: process.env.FOUNDER_WEBHOOK_URL
        };
        
        const webhookUrl = webhookUrls[automationType];
        
        if (webhookUrl) {
            // Call external webhook (Zapier, Make.com, etc.)
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.WEBHOOK_AUTH_TOKEN || ''}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.warn(`Webhook call failed for ${automationType}:`, response.status);
            } else {
                console.log(`Webhook successfully triggered for ${automationType}`);
            }
        }
        
        // Send email notification (example using SendGrid)
        await sendEmailNotification(automationType, data);
        
        // Update CRM (example using HubSpot)
        await updateCRM(automationType, data);
        
    } catch (error) {
        console.error(`Failed to trigger ${automationType} automation:`, error);
        // Don't throw error - we want the main process to continue
    }
}

// Email notification helper (example implementation)
async function sendEmailNotification(template, data) {
    try {
        if (!process.env.MAILERSEND_API_KEY) {
            console.log('MailerSend not configured, skipping email notification');
            return;
        }
        
        // Example MailerSend integration
        console.log(`Sending ${template} email to ${data.contact.email}`);
        
        // This is where you'd integrate with MailerSend templates
        // const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
        // 
        // const mailerSend = new MailerSend({
        //     apiKey: process.env.MAILERSEND_API_KEY,
        // });
        // 
        // const sentFrom = new Sender(process.env.FROM_EMAIL, process.env.FROM_NAME);
        // const recipients = [new Recipient(data.contact.email, data.contact.name)];
        // 
        // const emailParams = new EmailParams()
        //     .setFrom(sentFrom)
        //     .setTo(recipients)
        //     .setTemplateId(process.env[`${template.toUpperCase()}_TEMPLATE_ID`])
        //     .setVariables([
        //         {
        //             email: data.contact.email,
        //             substitutions: data.contact
        //         }
        //     ]);
        // 
        // await mailerSend.email.send(emailParams);
        
    } catch (error) {
        console.error('Email notification failed:', error);
    }
}

// Send assessment results email with beautiful HTML template
async function sendAssessmentResultsEmail(contactInfo, scores, persona, overallScore) {
    try {
        // Initialize configuration manager
        const configManager = new ConfigManager();
        await configManager.init();

        // Check if email is configured
        const emailConfigured = await configManager.isEmailConfigured();
        if (!emailConfigured) {
            console.log('MailerSend not configured, skipping results email');
            return { 
                success: false, 
                error: 'Email service not configured. Please set MAILERSEND_API_KEY environment variable.',
                configured: false
            };
        }

        // Get email configuration
        const emailConfig = await configManager.getEmailConfig();
        const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

        const mailerSend = new MailerSend({
            apiKey: emailConfig.apiKey,
        });

        const htmlTemplate = createAssessmentEmailTemplate(contactInfo, scores, persona, overallScore, configManager);
        const textTemplate = createPlainTextResults(contactInfo, scores, persona, overallScore, configManager);
        
        const sentFrom = new Sender(
            emailConfig.fromEmail || 'hello@validassessment.com', 
            emailConfig.fromName || 'VALID Assessment Team'
        );

        const recipients = [
            new Recipient(contactInfo.email, contactInfo.firstName || 'User')
        ];

        // Get dynamic email subject
        const subject = await configManager.getEmailSubject({ firstName: contactInfo.firstName });

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(subject)
            .setHtml(htmlTemplate)
            .setText(textTemplate);

        const response = await mailerSend.email.send(emailParams);
        console.log(`Assessment results email sent to ${contactInfo.email}`);
        
        return { success: true, messageId: response.headers['x-message-id'] };
        
    } catch (error) {
        console.error('Failed to send assessment results email:', error);
        return { success: false, error: error.message };
    }
}

// Create beautiful HTML email template for assessment results
function createAssessmentEmailTemplate(contactInfo, scores, persona, overallScore, configManager = null) {
    const dimensionLabels = {
        verity: 'Verity (Truth-seeking)',
        association: 'Association (Peer Input)', 
        lived_experience: 'Lived Experience',
        institutional: 'Institutional Knowledge',
        desire: 'Desire (Motivation)'
    };

    const dimensionDescriptions = {
        verity: 'How much you rely on evidence and fact-checking',
        association: 'How much you seek input from others',
        lived_experience: 'How much you draw from personal experience',
        institutional: 'How much you rely on established processes',
        desire: 'How much motivation drives your decisions'
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#10B981'; // Green
        if (score >= 60) return '#F59E0B'; // Yellow
        if (score >= 40) return '#EF4444'; // Red
        return '#6B7280'; // Gray
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Strong';
        if (score >= 60) return 'Moderate';
        if (score >= 40) return 'Developing';
        return 'Limited';
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Your VALID Assessment Results</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .profile-section { text-align: center; margin-bottom: 40px; }
            .persona { font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
            .overall-score { font-size: 48px; font-weight: 700; color: #667eea; margin: 20px 0; }
            .score-label { font-size: 16px; color: #6b7280; }
            .dimensions { margin: 40px 0; }
            .dimensions h3 { color: #1f2937; font-size: 20px; margin-bottom: 30px; text-align: center; }
            .dimension { margin-bottom: 25px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #667eea; }
            .dimension-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .dimension-name { font-weight: 600; color: #1f2937; font-size: 16px; }
            .dimension-score { font-weight: 700; font-size: 18px; }
            .dimension-description { color: #6b7280; font-size: 14px; line-height: 1.5; }
            .score-bar { height: 8px; background: #e5e7eb; border-radius: 4px; margin: 15px 0 10px; overflow: hidden; }
            .score-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
            .recommendations { background: #f0f9ff; padding: 25px; border-radius: 12px; margin: 40px 0; }
            .recommendations h3 { color: #0369a1; margin-bottom: 15px; }
            .recommendation { margin-bottom: 12px; color: #1e40af; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your VALID Assessment Results</h1>
                <p>Hello ${contactInfo.firstName}, here are your personalized results</p>
            </div>
            
            <div class="content">
                <div class="profile-section">
                    <div class="persona">${persona}</div>
                    <div class="overall-score">${overallScore}%</div>
                    <div class="score-label">Overall Decision-Making Strength</div>
                </div>

                <div class="dimensions">
                    <h3>Your VALID Dimensions Breakdown</h3>
                    ${Object.entries(scores).map(([dimension, score]) => `
                        <div class="dimension">
                            <div class="dimension-header">
                                <div class="dimension-name">${dimensionLabels[dimension]}</div>
                                <div class="dimension-score" style="color: ${getScoreColor(score)}">${score}% - ${getScoreLabel(score)}</div>
                            </div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${score}%; background-color: ${getScoreColor(score)};"></div>
                            </div>
                            <div class="dimension-description">${dimensionDescriptions[dimension]}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="recommendations">
                    <h3>🎯 Recommended Next Steps</h3>
                    <div class="recommendation">• Focus on strengthening your lowest-scoring dimensions</div>
                    <div class="recommendation">• Practice evidence-based decision making in daily situations</div>
                    <div class="recommendation">• Seek diverse perspectives when making important decisions</div>
                    <div class="recommendation">• Document your decision outcomes to build experience</div>
                </div>

                <div style="text-align: center;">
                    <a href="https://validassessment.com/resources" class="cta-button">Explore Decision-Making Resources</a>
                </div>
            </div>

            <div class="footer">
                <p>© 2024 The Validated Mind Research Lab. Helping you make better decisions.</p>
                <p style="margin-top: 10px; font-size: 12px;">This assessment is for educational purposes. Results provide insights into decision-making preferences.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Create plain text version for email clients that don't support HTML
function createPlainTextResults(contactInfo, scores, persona, overallScore, configManager = null) {
    const dimensionLabels = {
        verity: 'Verity (Truth-seeking)',
        association: 'Association (Peer Input)', 
        lived_experience: 'Lived Experience',
        institutional: 'Institutional Knowledge',
        desire: 'Desire (Motivation)'
    };

    let text = `VALID Assessment Results for ${contactInfo.firstName}\n\n`;
    text += `Your Decision-Making Profile: ${persona}\n`;
    text += `Overall Score: ${overallScore}%\n\n`;
    text += `DIMENSION BREAKDOWN:\n`;
    text += `==================\n`;
    
    Object.entries(scores).forEach(([dimension, score]) => {
        text += `${dimensionLabels[dimension]}: ${score}%\n`;
    });
    
    text += `\nRECOMMENDED NEXT STEPS:\n`;
    text += `======================\n`;
    text += `• Focus on strengthening your lowest-scoring dimensions\n`;
    text += `• Practice evidence-based decision making in daily situations\n`;
    text += `• Seek diverse perspectives when making important decisions\n`;
    text += `• Document your decision outcomes to build experience\n\n`;
    text += `For more resources, visit: https://validassessment.com/resources\n\n`;
    text += `© 2024 The Validated Mind Research Lab`;
    
    return text;
}

// CRM update helper (example implementation)
async function updateCRM(action, data) {
    try {
        if (!process.env.HUBSPOT_ACCESS_TOKEN) {
            console.log('HubSpot not configured, skipping CRM update');
            return;
        }
        
        // Example HubSpot integration
        console.log(`Updating CRM for ${action}:`, data.contact.email);
        
        // This is where you'd integrate with HubSpot, Salesforce, etc.
        // const hubspot = require('@hubspot/api-client');
        // const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
        // 
        // const properties = {
        //     email: data.contact.email,
        //     firstname: data.contact.name.split(' ')[0],
        //     lastname: data.contact.name.split(' ').slice(1).join(' '),
        //     involvement_type: action,
        //     assessment_completed: 'true'
        // };
        // 
        // await hubspotClient.crm.contacts.basicApi.create({ properties });
        
    } catch (error) {
        console.error('CRM update failed:', error);
    }
}

// Activity logging helper
async function logWebhookActivity(data) {
    try {
        // Log webhook activity (could be to database, file, external service)
        console.log('Webhook Activity:', {
            timestamp: data.timestamp,
            type: data.involvement_type,
            assessment: data.assessment_id,
            contact: data.contact_email,
            result: data.result.success ? 'success' : 'failed'
        });
        
        // You could save this to your database here
        // await supabase.from('webhook_logs').insert([data]);
        
    } catch (error) {
        console.error('Failed to log webhook activity:', error);
    }
}

// Email assessment results endpoint
router.post('/email-results', async (req, res) => {
    try {
        const { contactInfo, scores, persona, overallScore } = req.body;
        
        if (!contactInfo || !contactInfo.email) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }
        
        // Send assessment results email
        const emailResult = await sendAssessmentResultsEmail(contactInfo, scores, persona, overallScore);
        
        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Assessment results sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to send email',
                details: emailResult.error
            });
        }
        
    } catch (error) {
        console.error('Email results endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get configuration endpoint (for frontend dynamic config)
router.get('/config', async (req, res) => {
    try {
        const configManager = new ConfigManager();
        await configManager.init();

        // Get safe, non-sensitive configuration for frontend
        const config = await configManager.getMultiple([
            'assessment_title',
            'welcome_message',
            'completion_message',
            'brand_primary_color',
            'brand_secondary_color',
            'show_progress_bar',
            'auto_advance_questions',
            'results_show_scores',
            'results_show_recommendations',
            'allow_retake',
            'privacy_policy_url',
            'terms_of_service_url',
            'email_enabled'
        ]);

        res.json({
            success: true,
            config: config
        });

    } catch (error) {
        console.error('Config endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load configuration'
        });
    }
});

module.exports = router; 