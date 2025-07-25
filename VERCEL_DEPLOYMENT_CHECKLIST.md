# ✅ Vercel Deployment Checklist - Mobile VALID Assessment

## 🚀 **Pre-Deployment Setup**

### **✅ 1. Vercel Environment Variables Set**
In your Vercel project → Settings → Environment Variables:

```bash
# ✅ Required for Email Functionality
MAILERSEND_API_KEY=mlsn.your-api-key-here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name

# ✅ Database Configuration  
SUPABASE_URL=https://txqtbblkrqmydkjztaip.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key

# ✅ Production Settings
NODE_ENV=production
```

### **✅ 2. Supabase Database Migration**
Run this in your Supabase SQL Editor:
```sql
-- Copy and paste entire file: supabase/migrations/002_app_configuration.sql
```

### **✅ 3. Domain Verification (Recommended)**
In MailerSend Dashboard:
1. Go to **Domains** → **Add Domain**
2. Add your domain (e.g., `yourdomain.com`)
3. Follow DNS verification steps
4. Update `FROM_EMAIL` to use verified domain

## 🔧 **Deployment Process**

### **Method 1: GitHub Auto-Deploy**
```bash
# Push to main branch (if connected to GitHub)
git add .
git commit -m "Add MailerSend integration with Vercel env vars"
git push origin main
```

### **Method 2: Vercel CLI**
```bash
# Deploy directly
npm install -g vercel
vercel --prod
```

## 🧪 **Post-Deployment Testing**

### **1. Test Basic Functionality**
- [ ] Visit your production URL
- [ ] Complete the assessment flow
- [ ] Verify results display correctly
- [ ] Test "Take Again" functionality

### **2. Test Email Functionality**
- [ ] Complete assessment with your email address
- [ ] Check for email delivery
- [ ] Verify email formatting (HTML + plain text)
- [ ] Test different email clients (Gmail, Outlook, etc.)

### **3. Test Configuration Loading**
```bash
# Test configuration endpoint
curl https://your-app.vercel.app/api/config

# Expected response:
{
  "success": true,
  "config": {
    "assessment_title": "VALID Assessment",
    "welcome_message": "Ready to Begin?",
    "brand_primary_color": "#667eea",
    "email_enabled": true
    // ... other config values
  }
}
```

### **4. Test Dynamic Configuration**
In Supabase Dashboard → Table Editor → `app_config`:
```sql
-- Test changing welcome message
UPDATE app_config 
SET config_value = '"Welcome to Production!"' 
WHERE config_key = 'welcome_message';
```
- [ ] Refresh your assessment page
- [ ] Verify welcome message changed
- [ ] No server restart required!

## 📊 **Monitoring & Verification**

### **Vercel Function Logs**
1. Go to Vercel Dashboard → Your Project → Functions
2. Check logs for any errors
3. Look for successful email sends

### **MailerSend Dashboard**
1. Visit [MailerSend Dashboard](https://app.mailersend.com)
2. Check **Analytics** → **Email Activity**
3. Verify delivery rates and opens

### **Supabase Monitoring**
1. Check **Database** → **mobile_assessments** table
2. Verify new assessment records
3. Check **API** → **Logs** for any errors

## 🎯 **Success Criteria**

### **✅ Email System Working:**
- [ ] Assessment emails deliver successfully
- [ ] HTML formatting displays correctly
- [ ] Plain text fallback works
- [ ] MailerSend analytics show deliveries

### **✅ Configuration System Working:**
- [ ] Environment variables loaded from Vercel
- [ ] Dynamic config loaded from Supabase  
- [ ] UI updates when config changes
- [ ] Graceful fallbacks to defaults

### **✅ Assessment Functioning:**
- [ ] All 25 questions display correctly
- [ ] Results calculation accurate
- [ ] Charts and visualizations working
- [ ] Take Again resets properly

## 🚨 **Troubleshooting**

### **Email Not Sending**
```bash
# Check environment variables in Vercel
# Should see: MAILERSEND_API_KEY, FROM_EMAIL

# Check Vercel function logs for errors like:
# "MailerSend not configured" → API key missing
# "Unauthorized" → Invalid API key  
# "Domain not verified" → Need to verify sending domain
```

### **Configuration Not Loading**
```bash
# Test API endpoint
curl https://your-app.vercel.app/api/config

# If error, check:
# 1. Supabase migration ran successfully
# 2. SUPABASE_URL and SUPABASE_ANON_KEY in Vercel
# 3. No RLS policy blocking access
```

### **Assessment Not Working**
```bash
# Check main page loads
curl -I https://your-app.vercel.app

# Common issues:
# 1. Build errors in Vercel deployment
# 2. Missing static files
# 3. Environment variables not set
```

## 🔧 **Environment Variable Reference**

### **Required (Must Set):**
```bash
MAILERSEND_API_KEY=mlsn.your-key    # Email sending
SUPABASE_URL=https://your-project   # Database
SUPABASE_ANON_KEY=eyJ...           # Database access
```

### **Recommended:**
```bash
FROM_EMAIL=hello@yourdomain.com    # Verified sender
FROM_NAME=Your Company Name        # Sender display name  
NODE_ENV=production                # Production mode
```

### **Optional:**
```bash
WEBHOOK_BASE_URL=https://your-app  # For webhooks
```

## 📈 **Performance Optimization**

### **Vercel Settings:**
- [ ] Enable **Edge Functions** for faster response
- [ ] Configure **Cache Headers** for static assets
- [ ] Enable **Compression** for smaller payloads

### **Database Optimization:**
- [ ] **Indexes** created (via migration)
- [ ] **RLS Policies** optimized for performance
- [ ] **Connection pooling** enabled in Supabase

## 🎉 **Production Ready!**

Once all items are ✅, your mobile VALID assessment is production-ready with:

- 🔐 **Secure API key management** via Vercel environment variables
- 📧 **Professional email delivery** via MailerSend
- 🎨 **Dynamic configuration** via Supabase database
- ⚡ **Fast global delivery** via Vercel Edge Network
- 📊 **Real-time analytics** via MailerSend + Supabase
- 🛡️ **Robust error handling** with graceful fallbacks

## 🔗 **Useful Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **MailerSend Dashboard:** https://app.mailersend.com
- **Supabase Dashboard:** https://app.supabase.com
- **Production URL:** https://your-app.vercel.app
- **Configuration API:** https://your-app.vercel.app/api/config

---

## 🚀 **Deploy Command**

Ready to deploy? Run this:

```bash
# If using Vercel CLI
vercel --prod

# Or push to GitHub (if auto-deploy enabled)
git push origin main
```

Your assessment is ready for users! 🎯 