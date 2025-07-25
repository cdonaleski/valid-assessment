# 🔧 Hybrid Configuration System - Environment + Supabase

## ✨ **Overview**

Your mobile VALID assessment now uses a **hybrid configuration system** that combines the security of environment variables with the flexibility of database-stored settings.

## 🔒 **Security-First Architecture**

### **Environment Variables (Secure)**
```bash
# 🔐 ALWAYS keep these in environment variables
MAILERSEND_API_KEY=your-secret-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 🔧 Can override Supabase settings
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
```

### **Supabase Configuration (Dynamic)**
```sql
-- 📊 Can be changed through web interface without server restart
UPDATE app_config 
SET config_value = '"Welcome to Our Assessment!"' 
WHERE config_key = 'welcome_message';
```

## 🎯 **How It Works**

### **Configuration Priority:**
1. **Environment Variables** (highest priority - security)
2. **Supabase Database** (dynamic configuration)
3. **Default Values** (fallback)

### **Example:**
```javascript
// This will check in order:
// 1. FROM_EMAIL environment variable
// 2. Supabase app_config table  
// 3. Default: 'hello@validassessment.com'
const fromEmail = await configManager.get('from_email');
```

## 📊 **What's Stored Where**

### **🔐 Environment Variables (Never change these):**
- `MAILERSEND_API_KEY` - Email service API key
- `SUPABASE_URL` - Database connection
- `SUPABASE_ANON_KEY` - Database access key
- Any other secrets/credentials

### **📊 Supabase Configuration (Can change these):**

#### **Email Settings:**
- `email_from_name` - "VALID Assessment Team"
- `email_subject_template` - "Your Results - {firstName}"
- `email_enabled` - true/false

#### **Branding:**
- `brand_primary_color` - "#667eea"
- `brand_secondary_color` - "#764ba2"

#### **Content:**
- `welcome_message` - "Ready to Begin?"
- `completion_message` - "Thank you!"
- `assessment_title` - "VALID Assessment"

#### **Features:**
- `results_show_scores` - true/false
- `allow_retake` - true/false
- `auto_advance_questions` - true/false

## 🚀 **Setup Instructions**

### **1. Run the Database Migration**
```sql
-- In your Supabase SQL editor:
-- Copy and paste: supabase/migrations/002_app_configuration.sql
```

### **2. Set Environment Variables**
```bash
# Create .env file in mobile-valid-assessment/
MAILERSEND_API_KEY=your-mailersend-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
```

### **3. Customize in Supabase (Optional)**
Go to your Supabase dashboard → Table Editor → `app_config`:

```sql
-- Change welcome message
UPDATE app_config 
SET config_value = '"Welcome to Acme Corp Assessment!"' 
WHERE config_key = 'welcome_message';

-- Change brand colors
UPDATE app_config 
SET config_value = '"#FF6B6B"' 
WHERE config_key = 'brand_primary_color';

-- Disable email temporarily
UPDATE app_config 
SET config_value = 'false' 
WHERE config_key = 'email_enabled';
```

## 🎨 **Dynamic Customization Examples**

### **Change Branding:**
```sql
-- Update primary color
UPDATE app_config SET config_value = '"#1E40AF"' WHERE config_key = 'brand_primary_color';

-- Update company name in emails
UPDATE app_config SET config_value = '"Acme Corp Assessment Team"' WHERE config_key = 'email_from_name';

-- Change welcome message
UPDATE app_config SET config_value = '"Welcome to Acme Corp Decision Assessment!"' WHERE config_key = 'welcome_message';
```

### **Feature Toggles:**
```sql
-- Disable email temporarily
UPDATE app_config SET config_value = 'false' WHERE config_key = 'email_enabled';

-- Hide numerical scores
UPDATE app_config SET config_value = 'false' WHERE config_key = 'results_show_scores';

-- Disable retaking
UPDATE app_config SET config_value = 'false' WHERE config_key = 'allow_retake';
```

### **Content Updates:**
```sql
-- Custom email subject
UPDATE app_config SET config_value = '"🎯 Your Acme Corp Assessment Results - {firstName}"' WHERE config_key = 'email_subject_template';

-- Add privacy policy
UPDATE app_config SET config_value = '"https://acmecorp.com/privacy"' WHERE config_key = 'privacy_policy_url';
```

## 🔧 **API Usage**

### **Frontend Access:**
```javascript
// The mobile assessment automatically loads configuration
// Access via this.config in the MobileAssessment class

// Example: Check if retaking is allowed
if (this.config.allow_retake) {
    // Show "Take Again" button
}

// Example: Use custom colors
document.documentElement.style.setProperty('--primary-color', this.config.brand_primary_color);
```

### **Server-side Access:**
```javascript
const configManager = new ConfigManager();
await configManager.init();

// Get email configuration
const emailConfig = await configManager.getEmailConfig();

// Get UI theme
const themeConfig = await configManager.getThemeConfig();

// Check if feature is enabled
const emailEnabled = await configManager.get('email_enabled');
```

## 📊 **Configuration Categories**

### **Email Configuration:**
```javascript
const emailConfig = await configManager.getEmailConfig();
// Returns: { apiKey, fromEmail, fromName, subjectTemplate, enabled }
```

### **UI Theme:**
```javascript
const themeConfig = await configManager.getThemeConfig();
// Returns: { primaryColor, secondaryColor, showProgressBar, autoAdvanceQuestions }
```

### **Multiple Values:**
```javascript
const config = await configManager.getMultiple([
    'welcome_message',
    'brand_primary_color',
    'email_enabled'
]);
```

## 🎯 **Benefits**

### **For Developers:**
- ✅ **Security** - API keys never in database
- ✅ **Flexibility** - Change UI without deployment
- ✅ **Performance** - Cached configuration
- ✅ **Fallbacks** - Graceful degradation

### **For Business Users:**
- ✅ **Dynamic Updates** - Change content without technical help
- ✅ **Feature Toggles** - Enable/disable features instantly
- ✅ **Branding Control** - Update colors and messaging
- ✅ **A/B Testing** - Try different configurations

### **For Administrators:**
- ✅ **No Server Restart** - Changes take effect immediately
- ✅ **Easy Rollback** - Database change history
- ✅ **Audit Trail** - Track all configuration changes
- ✅ **Web Interface** - Manage through Supabase dashboard

## 🧪 **Testing Configuration**

### **1. Test Environment Variables:**
```bash
# Check if email works
cd mobile-valid-assessment
MAILERSEND_API_KEY=your-key npm start
```

### **2. Test Supabase Configuration:**
```sql
-- Temporarily change welcome message
UPDATE app_config SET config_value = '"TEST MESSAGE"' WHERE config_key = 'welcome_message';
-- Refresh your assessment page to see the change
```

### **3. Test Fallbacks:**
```sql
-- Disable a config temporarily
UPDATE app_config SET is_active = false WHERE config_key = 'welcome_message';
-- Should fall back to default value
```

## 🚨 **Important Security Notes**

### **❌ NEVER put these in Supabase:**
- API keys (MAILERSEND_API_KEY)
- Database credentials
- Authentication secrets
- Payment processor keys
- Any sensitive tokens

### **✅ Safe for Supabase:**
- Display text and messages
- Color codes and styling
- Feature enable/disable flags
- URLs (non-sensitive)
- Timeout values
- UI preferences

## 🎛️ **Admin Interface (Optional)**

You can build a simple admin interface to manage configuration:

```javascript
// Update configuration via API
const updateConfig = async (key, value) => {
    const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    return response.json();
};

// Example usage
await updateConfig('welcome_message', 'New Welcome Message!');
await updateConfig('brand_primary_color', '#FF6B6B');
```

## ✅ **Ready to Use!**

Your hybrid configuration system is now active! You get:

- 🔒 **Secure API key management** via environment variables
- 🎨 **Dynamic customization** via Supabase configuration  
- ⚡ **Real-time updates** without server restarts
- 🛡️ **Fallback protection** with sensible defaults
- 📊 **Easy management** through web interface

The best of both worlds - security AND flexibility! 🚀 