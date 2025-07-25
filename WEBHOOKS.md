# 🔗 VALID Assessment Webhooks Documentation

The Mobile VALID Assessment includes a comprehensive webhook system to capture user involvement preferences and trigger automated workflows. This document explains how to use, configure, and integrate with the webhook endpoints.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Available Webhooks](#available-webhooks)
3. [Webhook Payload Structure](#webhook-payload-structure)
4. [Integration Examples](#integration-examples)
5. [Configuration](#configuration)
6. [Testing Webhooks](#testing-webhooks)
7. [Error Handling](#error-handling)
8. [Security](#security)

## 🎯 Overview

When users complete the VALID assessment, they're presented with involvement options on the results screen. Each option triggers a webhook that:

- Captures user contact information and assessment data
- Logs the interaction to the database
- Triggers external automations (email, CRM, calendar, etc.)
- Provides different priority levels and response times

## 🚀 Available Webhooks

### 1. Consultant Interest (`consultant`)
**Endpoint**: `POST /api/webhooks/involvement`
- **Priority**: High (24-hour response)
- **Use Case**: Professional consultants wanting to use VALID with clients
- **Typical Actions**: 
  - Send application form
  - Add to consultant CRM pipeline
  - Schedule follow-up call
  - Send welcome packet

### 2. Pilot Program (`pilot`)
**Endpoint**: `POST /api/webhooks/involvement`
- **Priority**: High (48-hour response)
- **Use Case**: Organizations wanting to test VALID internally
- **Typical Actions**:
  - Send pilot access information
  - Create enterprise opportunity
  - Schedule demo call
  - Provide trial access

### 3. Research Participation (`research`)
**Endpoint**: `POST /api/webhooks/involvement`
- **Priority**: Medium (weekly response)
- **Use Case**: Users interested in decision-making research studies
- **Typical Actions**:
  - Add to research mailing list
  - Send research updates
  - Invite to studies
  - Provide research insights

### 4. Newsletter Updates (`updates`)
**Endpoint**: `POST /api/webhooks/involvement`
- **Priority**: Low (automatic response)
- **Use Case**: Users wanting VALID insights and updates
- **Typical Actions**:
  - Subscribe to newsletter
  - Send welcome email
  - Add to content mailing list
  - Provide free resources

### 5. Founder Call (`founder`)
**Endpoint**: `POST /api/webhooks/involvement`
- **Priority**: Urgent (same-day response)
- **Use Case**: High-value prospects or partnership inquiries
- **Typical Actions**:
  - Send personal email from founder
  - Add to VIP pipeline
  - Schedule founder call
  - Provide direct contact

## 📦 Webhook Payload Structure

All webhooks send a standardized payload:

```json
{
  "involvement_type": "consultant|pilot|research|updates|founder",
  "contact_data": {
    "email": "user@example.com",
    "name": "John Doe",
    "age": "35-44",
    "jobRole": "manager",
    "decisionMaker": "yes",
    "consultantReferral": "no",
    "organization": "Company Name",
    "phone": "+1234567890"
  },
  "assessment_id": "uuid-string",
  "timestamp": "2024-01-15T10:30:00Z",
  "scores": {
    "verity": 64,
    "association": 44,
    "lived_experience": 64,
    "institutional": 60,
    "desire": 56
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `involvement_type` | string | Type of involvement selected by user |
| `contact_data` | object | User's contact and demographic information |
| `assessment_id` | string | Unique identifier for the assessment |
| `timestamp` | string | ISO 8601 timestamp of the webhook trigger |
| `scores` | object | User's VALID dimension scores (percentages) |

## 🔧 Integration Examples

### Email Marketing (MailerSend)

```javascript
// In api/routes.js - consultant handler
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const consultantHandler = async (data) => {
  const sentFrom = new Sender('hello@validassessment.com', 'VALID Assessment Team');
  const recipients = [new Recipient(data.contact_data.email, data.contact_data.name)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setTemplateId('consultant-welcome-template-id')
    .setVariables([
      {
        email: data.contact_data.email,
        substitutions: {
          name: data.contact_data.name,
          organization: data.contact_data.organization,
          scores: data.scores
        }
      }
    ]);
  
  await mailerSend.email.send(emailParams);
  
  // Add to consultant pipeline
  await addToConsultantPipeline(data.contact_data);
};
```

### CRM Integration (HubSpot)

```javascript
const hubspot = require('@hubspot/api-client');
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_TOKEN });

const pilotHandler = async (data) => {
  // Create contact in HubSpot
  const contactObj = {
    properties: {
      email: data.contact_data.email,
      firstname: data.contact_data.name.split(' ')[0],
      lastname: data.contact_data.name.split(' ')[1],
      company: data.contact_data.organization,
      phone: data.contact_data.phone,
      lifecyclestage: 'opportunity',
      lead_source: 'VALID Assessment - Pilot Interest',
      valid_verity_score: data.scores.verity,
      valid_association_score: data.scores.association,
      // ... other VALID scores
    }
  };
  
  await hubspotClient.crm.contacts.basicApi.create(contactObj);
};
```

### Calendar Booking (Calendly)

```javascript
const founderHandler = async (data) => {
  // Send personalized email with calendar link
  const personalizedEmail = {
    to: data.contact_data.email,
    from: 'christopher@validassessment.com',
    subject: `Re: Your VALID Assessment Results - ${data.contact_data.name}`,
    html: `
      <p>Hi ${data.contact_data.name},</p>
      <p>Thanks for your interest in discussing VALID further. I'd love to connect!</p>
      <p><a href="https://calendly.com/christopher-valid?prefill_email=${data.contact_data.email}">
        Click here to schedule a 30-minute call
      </a></p>
      <p>Best regards,<br>Christopher</p>
    `
  };
  
  await sendEmail(personalizedEmail);
  
  // Add to high-priority pipeline
  await addToFounderPipeline(data);
};
```

### Slack Notifications

```javascript
const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_TOKEN);

const notifyTeam = async (involvement_type, contact_data) => {
  const message = {
    channel: '#leads',
    text: `🎯 New ${involvement_type} interest from ${contact_data.name} (${contact_data.email})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New ${involvement_type} Interest*\n` +
                `Name: ${contact_data.name}\n` +
                `Email: ${contact_data.email}\n` +
                `Organization: ${contact_data.organization}\n` +
                `Role: ${contact_data.jobRole}`
        }
      }
    ]
  };
  
  await slack.chat.postMessage(message);
};
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `mobile-valid-assessment` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Server Configuration
PORT=3000
NODE_ENV=production

# Email Service (MailerSend)
MAILERSEND_API_KEY=your-mailersend-key
FROM_EMAIL=hello@validassessment.com
FROM_NAME=VALID Assessment Team

# CRM Integration (HubSpot)
HUBSPOT_ACCESS_TOKEN=your-hubspot-token

# Calendar Integration
CALENDLY_ACCESS_TOKEN=your-calendly-token

# Slack Notifications
SLACK_TOKEN=your-slack-token
SLACK_CHANNEL=#leads

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXX-X
MIXPANEL_TOKEN=your-mixpanel-token

# Webhook Security
WEBHOOK_SECRET=your-webhook-secret
```

### Customizing Handlers

Edit `api/routes.js` to customize the webhook handlers:

```javascript
const involvementHandlers = {
  consultant: async (data) => {
    // Your custom consultant logic
    await sendConsultantWelcome(data);
    await addToCRM(data, 'consultant');
    await notifySlack('consultant', data.contact_data);
    
    return { success: true, message: 'Consultant application processed' };
  },
  
  // ... other handlers
};
```

## 🧪 Testing Webhooks

### Local Testing

1. Start the server:
```bash
cd mobile-valid-assessment
npm start
```

2. Complete an assessment at `http://localhost:3000`

3. Click an involvement card and check the console logs

### Using ngrok for External Testing

1. Install ngrok: `npm install -g ngrok`

2. Expose your local server:
```bash
ngrok http 3000
```

3. Use the ngrok URL for webhook testing with external services

### Manual Webhook Testing

Use curl to test webhook endpoints directly:

```bash
curl -X POST http://localhost:3000/api/webhooks/involvement \
  -H "Content-Type: application/json" \
  -d '{
    "involvement_type": "consultant",
    "contact_data": {
      "email": "test@example.com",
      "name": "Test User",
      "age": "35-44",
      "jobRole": "manager",
      "decisionMaker": "yes",
      "consultantReferral": "no",
      "organization": "Test Company",
      "phone": "+1234567890"
    },
    "assessment_id": "test-assessment-123",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## 🚨 Error Handling

The webhook system includes comprehensive error handling:

### Response Formats

**Success Response:**
```json
{
  "success": true,
  "involvement_type": "consultant",
  "message": "Consultant application processed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Missing required fields: involvement_type, contact_data, assessment_id",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_ERROR` | Missing or invalid required fields | Check payload structure |
| `INVALID_INVOLVEMENT_TYPE` | Unknown involvement type | Use valid types: consultant, pilot, research, updates, founder |
| `EXTERNAL_SERVICE_ERROR` | Error with external API | Check API keys and service status |
| `DATABASE_ERROR` | Database connection issue | Check Supabase configuration |

### Retry Logic

The system includes automatic retry logic for failed external API calls:

```javascript
const retryWithExponentialBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## 🔒 Security

### Webhook Verification

Implement webhook signature verification:

```javascript
const crypto = require('crypto');

const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests from this IP'
});

app.use('/api/webhooks', webhookLimiter);
```

### Input Validation

Validate all incoming data:

```javascript
const Joi = require('joi');

const webhookSchema = Joi.object({
  involvement_type: Joi.string().valid('consultant', 'pilot', 'research', 'updates', 'founder').required(),
  contact_data: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    // ... other fields
  }).required(),
  assessment_id: Joi.string().required(),
  timestamp: Joi.string().isoDate()
});
```

## 📊 Analytics and Monitoring

### Webhook Analytics

Track webhook performance:

```javascript
const analytics = {
  trackWebhook: async (involvement_type, success, responseTime) => {
    await logToAnalytics({
      event: 'webhook_triggered',
      involvement_type,
      success,
      response_time_ms: responseTime,
      timestamp: new Date()
    });
  }
};
```

### Health Check Endpoint

Monitor webhook system health:

```javascript
app.get('/api/webhooks/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseConnection(),
      email: await checkEmailService(),
      crm: await checkCRMConnection()
    }
  };
  
  res.json(health);
});
```

## 🤝 Support

For webhook integration support:

- **Documentation**: This file and `README.md`
- **Examples**: Check `api/routes.js` for implementation examples
- **Issues**: Create GitHub issues for bugs or feature requests
- **Contact**: Reach out via the founder call webhook! 😉

---

*This webhook system is designed to be flexible and scalable. Customize it to fit your specific integration needs and business processes.* 