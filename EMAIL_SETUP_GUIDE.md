# 📧 Email Setup Guide - Assessment Results

## ✨ **What This Does**

When users complete the mobile VALID assessment and click "View My Results":
1. **Results display** on screen immediately
2. **Email is sent** automatically with beautifully formatted results
3. **User notification** appears confirming email was sent
4. **Both HTML and plain text** versions for maximum compatibility

## 🚀 **Quick Setup (3 minutes)**

### **Step 1: Get MailerSend API Key**
1. Go to [MailerSend](https://app.mailersend.com/) and create a free account
2. Navigate to **API Tokens** in the sidebar
3. Click **"Create Token"**
4. Choose **"Full access"** or **"Email Send"** permissions
5. Copy your API key

### **Step 2: Set Environment Variables**
Add these to your `.env` file:

```bash
# Required for email functionality
MAILERSEND_API_KEY=your-mailersend-api-key-here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=VALID Assessment Team
```

### **Step 3: Verify Domain (Optional but Recommended)**
1. In MailerSend, go to **Domains** in the sidebar
2. Click **"Add Domain"** to add your domain
3. Follow the DNS verification process (improves deliverability)

### **Step 4: Test Email Functionality**
1. Complete a test assessment with your own email
2. Check your inbox for the results email
3. Check spam folder if not received

## 📨 **Email Template Features**

The assessment results email includes:

### **Beautiful HTML Design:**
- **Responsive layout** that works on all devices
- **Branded header** with gradient background
- **Color-coded scores** (green/yellow/red based on performance)
- **Visual progress bars** for each VALID dimension
- **Personalized recommendations** based on results
- **Call-to-action button** for additional resources

### **Content Includes:**
- Personal greeting with user's name
- Overall decision-making score
- Detailed breakdown of all 5 VALID dimensions:
  - Verity (Truth-seeking)
  - Association (Peer Input)
  - Lived Experience
  - Institutional Knowledge
  - Desire (Motivation)
- Actionable recommendations
- Professional footer with branding

### **Plain Text Version:**
- Clean, readable format for email clients that don't support HTML
- All the same information in text format
- Maintains professional appearance

## 🔧 **Configuration Options**

### **Basic Configuration (.env)**
```bash
# Email Service (Required)
MAILERSEND_API_KEY=your-api-key
FROM_EMAIL=noreply@yourdomain.com

# Optional: Custom sender name
FROM_NAME=VALID Assessment Team
```

### **Advanced Configuration**
```bash
# Custom branding
COMPANY_NAME=Your Company Name
WEBSITE_URL=https://yourdomain.com
LOGO_URL=https://yourdomain.com/logo.png

# Email customization
EMAIL_SUBJECT_PREFIX=Your VALID Results
RESOURCES_URL=https://yourdomain.com/resources
```

## 🧪 **Testing Your Setup**

### **1. Local Testing**
```bash
cd mobile-valid-assessment
npm start
# Complete assessment with your email address
```

### **2. MailerSend Test**
Use MailerSend's built-in testing tools:
1. Go to **Email** → **Send Test Email** in MailerSend dashboard
2. Send a test email to verify your API key works

### **3. Production Testing**
- Deploy to your hosting platform with environment variables set
- Complete a test assessment
- Verify email delivery and formatting

## 🚨 **Troubleshooting**

### **Email Not Received:**
1. ✅ Check spam/junk folder
2. ✅ Verify `MAILERSEND_API_KEY` is set correctly
3. ✅ Verify `FROM_EMAIL` is valid
4. ✅ Check MailerSend activity logs for delivery status

### **API Key Errors:**
```bash
# Common errors:
- "Unauthorized" → Check API key validity
- "Forbidden" → Check API key permissions
- "Not found" → Verify MailerSend account setup
```

### **Email Formatting Issues:**
- HTML version not displaying → Check email client compatibility
- Images not loading → Verify image URLs are accessible
- Layout broken → Check CSS compatibility with email clients

### **Console Debugging:**
```javascript
// Check browser console for errors:
// ❌ Failed to send results email: [error details]
// ✅ Results email sent successfully
```

## 🔒 **Security Best Practices**

### **API Key Management:**
- ✅ Never commit `.env` files to version control
- ✅ Use different API keys for development/production
- ✅ Rotate API keys regularly
- ✅ Use minimum required permissions

### **Email Security:**
- ✅ Validate email addresses before sending
- ✅ Implement rate limiting for email endpoints
- ✅ Monitor for abuse patterns
- ✅ Use HTTPS for all API endpoints

### **Privacy Compliance:**
- ✅ Include unsubscribe links if required
- ✅ Respect user privacy preferences
- ✅ Secure handling of personal data
- ✅ Comply with GDPR/CCPA as applicable

## 📊 **Monitoring & Analytics**

### **MailerSend Analytics:**
Track email performance:
- Delivery rates
- Open rates
- Click rates
- Bounce rates

### **Application Monitoring:**
```javascript
// Log email events for monitoring
console.log('Email sent successfully:', {
    recipient: email,
    timestamp: new Date(),
    assessmentId: id
});
```

## 💡 **Customization Ideas**

### **Template Enhancements:**
- Add company logo to email header
- Customize color scheme to match brand
- Include additional resources/links
- Add social media links

### **Content Personalization:**
- Industry-specific recommendations
- Role-based advice
- Personalized next steps
- Custom call-to-action buttons

### **Integration Options:**
- Connect to CRM systems
- Trigger follow-up email sequences
- Integration with calendar booking
- Connection to learning management systems

---

## ✅ **Ready to Go!**

Once configured, your mobile VALID assessment will automatically send beautiful, professional results emails to every user who completes the assessment. The system handles:

- ✅ **Automatic sending** after assessment completion
- ✅ **Error handling** with user notifications
- ✅ **Responsive design** for all devices
- ✅ **Professional formatting** with your branding
- ✅ **Secure delivery** via MailerSend infrastructure

For additional support, check the [MailerSend Documentation](https://developers.mailersend.com/) or reach out to the development team. 