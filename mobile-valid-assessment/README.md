# 🎯 Mobile VALID Assessment - Standalone Application

A secure, standalone mobile assessment application for the VALID Framework, featuring enterprise-grade security practices and complete data separation.

## 🔒 **Security First**

This application implements **best-practice security**:
- ✅ **No hardcoded API keys** in client-side code
- ✅ **Environment variables** for all sensitive configuration
- ✅ **Content Security Policy** protection against XSS
- ✅ **Separate database tables** with Row Level Security
- ✅ **Server-side configuration** endpoint

## 🚀 **Quick Start**

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=development
PORT=3000
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Database Setup**
1. Go to your [Supabase SQL Editor](https://app.supabase.com/project/your-project-id/sql)
2. Run the migration script from `supabase/migrations/001_mobile_assessment_tables.sql`
3. Verify tables are created: `mobile_assessments`, `mobile_user_involvement`, `mobile_assessment_sessions`

### **4. Start Server**
```bash
npm start
# or for development
npm run dev
```

### **5. Access Application**
Open http://localhost:3000 in your browser

## 📊 **Features**

### **Assessment Flow**
- Age selection
- Job role selection  
- Decision maker identification
- VALID assessment questions (25 questions)
- Comprehensive results with radar chart
- Personalized recommendations

### **Security Features**
- Server-side configuration loading
- Content Security Policy protection
- Environment variable protection
- Secure API key management

### **Database Integration**
- Separate mobile assessment tables
- Real-time answer saving
- Contact information capture
- Involvement preference tracking
- Session analytics

### **Webhook System**
- Automated involvement tracking
- External service integration ready
- Consultant application processing
- Research participation management

## 🗄️ **Database Schema**

### **Mobile Tables (Separate from Main Assessment)**
```sql
mobile_assessments          -- Core assessment data
mobile_user_involvement     -- Webhook/involvement tracking  
mobile_assessment_sessions  -- Session analytics
mobile_assessment_analytics -- Reporting view
```

### **Data Separation**
- ✅ **Independent tables** (no conflicts with main assessment)
- ✅ **Separate reporting** and analytics
- ✅ **Mobile-specific tracking** and webhooks

## 🔌 **API Endpoints**

### **Configuration** 
- `GET /api/config` - Secure configuration loading

### **Webhooks**
- `POST /api/webhooks/involvement` - User involvement preferences

## 🛡️ **Security Guide**

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation including:
- Environment variable protection
- Content Security Policy configuration  
- API key management
- Production deployment security
- Security incident response

## 🚀 **Deployment**

### **Environment Variables (Required)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production  
PORT=3000
WEBHOOK_BASE_URL=https://yourdomain.com
```

### **Platform-Specific Deployment**

#### **Vercel**
```bash
vercel --env SUPABASE_URL=... --env SUPABASE_ANON_KEY=...
```

#### **Heroku**
```bash
heroku config:set SUPABASE_URL=... SUPABASE_ANON_KEY=...
```

#### **Railway**
```bash
railway deploy
# Set environment variables in Railway dashboard
```

## 📁 **Project Structure**

```
mobile-valid-assessment/
├── index.html              # Main application (self-contained)
├── server.js               # Express server with security
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Environment template
├── .gitignore              # Excludes .env and sensitive files
├── README.md               # This file
├── SECURITY.md             # Security documentation
├── WEBHOOKS.md             # Webhook documentation
├── js/
│   ├── mobile-assessment.js    # Assessment logic
│   └── mobile-supabase.js      # Database integration
├── api/
│   └── routes.js           # API routes and webhooks
└── supabase/
    └── migrations/
        └── 001_mobile_assessment_tables.sql  # Database setup
```

## 🔧 **Configuration**

### **Secure Configuration Loading**
The application loads configuration securely from the server:

```javascript
// Client-side configuration loading
const config = await fetch('/api/config').then(r => r.json());
// API keys are never hardcoded in HTML/JS files
```

### **Content Security Policy**
Configured to allow only necessary external resources:
- FontAwesome icons
- Google Fonts  
- Supabase API
- No unsafe inline scripts in production

## 🧪 **Testing**

### **Local Testing**
```bash
# Start server
npm start

# Test configuration endpoint
curl http://localhost:3000/api/config

# Test application
open http://localhost:3000
```

### **Security Testing**
```bash
# Check for exposed API keys
grep -r "eyJ" . --exclude-dir=node_modules

# Verify .env is ignored
git check-ignore .env

# Test CSP compliance
# Check browser console for CSP violations
```

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Configuration Not Loading**
```bash
# Check environment variables
cat .env

# Verify server is running
curl http://localhost:3000/api/config

# Check server logs
npm start
```

#### **Database Connection Issues**
```bash
# Verify Supabase URL and key
curl -H "apikey: YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/mobile_assessments?select=count"
```

#### **CSP Violations**
- Check browser console for blocked resources
- Update CSP policy in `server.js` if needed
- Ensure external resources are from allowed domains

## 📞 **Support**

- **Security Issues**: See [SECURITY.md](./SECURITY.md)
- **Webhook Documentation**: See [WEBHOOKS.md](./WEBHOOKS.md)  
- **Database Issues**: Check Supabase dashboard logs
- **Deployment Help**: Check platform-specific documentation

---

## 🎯 **Production Ready**

This application is designed for production deployment with:
- 🔒 **Enterprise security practices**
- 📊 **Comprehensive analytics** 
- 🔌 **Webhook automation** ready
- 🗄️ **Separate database** tables
- 📱 **Mobile-optimized** interface
- 🚀 **Easy deployment** on any platform

**Ready to ship!** 🚢 