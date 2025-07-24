/**
 * API Routes for Mobile VALID Assessment
 * Handles webhook endpoints and other API functionality
 */

const express = require('express');
const router = express.Router();

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
        if (!process.env.SENDGRID_API_KEY) {
            console.log('SendGrid not configured, skipping email notification');
            return;
        }
        
        // Example SendGrid integration
        console.log(`Sending ${template} email to ${data.contact.email}`);
        
        // This is where you'd integrate with SendGrid, Mailchimp, etc.
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // 
        // const msg = {
        //     to: data.contact.email,
        //     from: process.env.FROM_EMAIL,
        //     template_id: process.env[`${template.toUpperCase()}_TEMPLATE_ID`],
        //     dynamic_template_data: data.contact
        // };
        // 
        // await sgMail.send(msg);
        
    } catch (error) {
        console.error('Email notification failed:', error);
    }
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

module.exports = router; 