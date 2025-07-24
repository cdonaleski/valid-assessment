# 🚀 Deployment Guide - Vercel

## Quick Deploy to Vercel

### **Step 1: Push to GitHub**
1. Create a new repository on GitHub (e.g., `mobile-valid-assessment`)
2. Push this code to your GitHub repository

### **Step 2: Deploy to Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Deploy!

## 🔒 **Required Environment Variables**

Set these in your Vercel project settings:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=production
WEBHOOK_BASE_URL=https://your-vercel-domain.vercel.app
```

## 📁 **Project Structure**
```
mobile-valid-assessment/
├── vercel.json          # Vercel configuration
├── server.js           # Main server file
├── index.html          # Frontend application
├── package.json        # Dependencies
├── .env.example        # Environment template
└── api/
    └── routes.js       # API endpoints
```

## 🔧 **Vercel Configuration**

The `vercel.json` file is configured to:
- ✅ Build the Node.js server
- ✅ Serve static files
- ✅ Route API calls to server
- ✅ Set production environment
- ✅ Configure function timeouts

## 🚨 **Important Notes**

### **Environment Variables**
- **Never commit `.env` files** to GitHub
- **Set all environment variables** in Vercel dashboard
- **Update `WEBHOOK_BASE_URL`** to your Vercel domain

### **Database Setup**
- **Run the SQL migration** in your Supabase dashboard
- **Verify RLS policies** are properly configured
- **Test database connectivity** after deployment

### **Domain Configuration**
```bash
# After deployment, update webhook base URL
WEBHOOK_BASE_URL=https://your-app-name.vercel.app
```

## 🧪 **Testing Deployment**

After deployment, test:
1. **Main application**: `https://your-domain.vercel.app`
2. **Configuration endpoint**: `https://your-domain.vercel.app/api/config`
3. **Database connectivity**: Complete an assessment
4. **Webhook functionality**: Test involvement selections

## 🔄 **Continuous Deployment**

Vercel automatically deploys when you push to GitHub:
1. **Push changes** to your main branch
2. **Vercel builds and deploys** automatically
3. **Test the new deployment**

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **Environment Variables Not Found**
- Check Vercel dashboard environment variables
- Ensure variable names match exactly
- Redeploy after adding variables

#### **API Routes Not Working**
- Verify `vercel.json` configuration
- Check function logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

#### **Database Connection Issues**
- Verify Supabase URL and key
- Check RLS policies in Supabase
- Test connection with curl/Postman

## 📞 **Support**

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Check GitHub repository issues

---

## 🎯 **Quick Commands**

```bash
# Deploy from command line
npx vercel

# Set environment variable
vercel env add SUPABASE_URL

# View deployment logs
vercel logs

# Open project in browser
vercel --open
```

**Ready to deploy!** 🚀 