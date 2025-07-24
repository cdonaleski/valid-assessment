# 🎯 VALID Assessment Framework

A comprehensive decision-making assessment tool built for modern organizations.

## 🚀 **Quick Start**

```bash
git clone https://github.com/cdonaleski/valid-assessment.git
cd valid-assessment
npm install
npm run dev
```

Visit `http://localhost:8000` to access the assessment.

## 📱 **Mobile Assessment Module**

### **Standalone Mobile Assessment**
Location: `mobile-valid-assessment/`

A secure, standalone mobile assessment optimized for deployment:

```bash
cd mobile-valid-assessment
npm install
npm start
```

Visit `http://localhost:3000` for the mobile assessment.

#### **Features:**
- ✅ **Enterprise security** - Environment variables, CSP protection
- ✅ **Separate database tables** - No conflicts with main assessment
- ✅ **Webhook automation** - User involvement tracking
- ✅ **Performance optimized** - Passive event listeners, mobile-first
- ✅ **Vercel-ready** - Complete deployment configuration

#### **Quick Deploy to Vercel:**
1. **Configure environment variables** in Vercel dashboard:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   NODE_ENV=production
   WEBHOOK_BASE_URL=https://your-app.vercel.app
   ```
2. **Deploy from GitHub** - Vercel auto-detects the configuration
3. **Run database migration** - Execute SQL from `mobile-valid-assessment/supabase/migrations/`

#### **Documentation:**
- 📖 **[Mobile README](mobile-valid-assessment/README.md)** - Complete guide
- 🚀 **[Deployment Guide](mobile-valid-assessment/DEPLOYMENT.md)** - Vercel setup
- 🔒 **[Security Guide](mobile-valid-assessment/SECURITY.md)** - Best practices
- 🔌 **[Webhook Guide](mobile-valid-assessment/WEBHOOKS.md)** - Automation setup

---

## 🎯 **Main Assessment Features**

### **Core Assessment**
- 25 research-backed questions across 5 VALID dimensions
- Real-time scoring and validation
- Comprehensive results with radar charts
- Personalized recommendations

### **Enterprise Features**
- Team management and bulk assessments
- Advanced analytics and reporting
- Change readiness evaluation
- Predictive insights dashboard

### **Technical Stack**
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Security**: Environment variables, CSP, RLS

## 📊 **Project Structure**

```
valid-assessment/
├── mobile-valid-assessment/    # 📱 Standalone mobile module
│   ├── index.html             # Mobile assessment app
│   ├── server.js              # Express server
│   ├── vercel.json            # Deployment config
│   └── DEPLOYMENT.md          # Setup guide
├── public/                    # 🖥️ Main assessment
│   ├── index.html             # Desktop assessment
│   ├── dashboard.html         # Analytics dashboard
│   └── js/                    # Core JavaScript
├── api/                       # 🔧 Backend APIs
├── supabase/                  # 🗄️ Database migrations
└── docs/                      # 📚 Documentation
```

## 🔒 **Security**

Both main and mobile assessments implement enterprise-grade security:
- **Environment variable protection**
- **Content Security Policy (CSP)**
- **Row Level Security (RLS) in database**
- **API key protection**
- **HTTPS enforcement**

## 🚀 **Deployment Options**

### **Main Assessment (Vercel)**
```bash
vercel --prod
```

### **Mobile Assessment (Vercel)**
```bash
cd mobile-valid-assessment
vercel --prod
```

### **Both Simultaneously**
Deploy the entire repository - both assessments available at different routes.

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/cdonaleski/valid-assessment/issues)
- **Mobile Assessment**: See `mobile-valid-assessment/README.md`
- **Security**: See `mobile-valid-assessment/SECURITY.md`

---

## 🎯 **Quick Links**

- 🖥️ **Main Assessment**: `/public/index.html`
- 📱 **Mobile Assessment**: `/mobile-valid-assessment/index.html`
- 📊 **Dashboard**: `/public/dashboard.html`
- 🔧 **API Docs**: `/api/README.md`

**Ready to assess decision-making at scale!** 🚀
