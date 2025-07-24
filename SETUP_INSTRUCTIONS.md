# 🎯 Mobile VALID Assessment - Database Setup

## ⚠️ **IMPORTANT: SEPARATE DATABASE TABLES**

This mobile assessment uses **completely separate tables** from your main VALID assessment system. This ensures:
- ✅ **No conflicts** with existing assessment data
- ✅ **Independent analytics** for mobile vs desktop users  
- ✅ **Separate reporting** and webhooks
- ✅ **Clean data separation** for different user flows

## 📊 **What Tables Will Be Created**

### **Core Tables:**
1. **`mobile_assessments`** - Main mobile assessment data (separate from `assessments`)
2. **`mobile_user_involvement`** - Mobile-specific webhook tracking  
3. **`mobile_assessment_sessions`** - Session analytics for mobile users

### **Analytics Views:**
4. **`mobile_assessment_analytics`** - Daily breakdowns for mobile data
5. **`mobile_assessment_summary`** - Dashboard stats for mobile assessments

---

## 🗃️ **Database Setup Instructions**

### **1. Go to Your Supabase Dashboard**
Visit: **https://app.supabase.com/project/txqtbblkrqmydkjztaip/sql**

### **2. Run the Mobile Assessment Migration**
Copy and paste the **entire contents** of `supabase/migrations/001_mobile_assessment_tables.sql` into the SQL Editor and click **"Run"**.

This will create:
- **3 new tables** with `mobile_` prefix (completely separate)
- **2 analytics views** for mobile-specific reporting
- **Row Level Security** policies for anonymous access
- **Indexes** for optimal performance

### **3. Verify Tables Were Created**
After running the migration, check your **Table Editor** to confirm you see:
- ✅ `mobile_assessments` 
- ✅ `mobile_user_involvement`
- ✅ `mobile_assessment_sessions`

---

## 🧪 **Test Your Setup**

### **1. Start the Mobile Assessment Server**
```bash
cd mobile-valid-assessment
npm install  # If you haven't already
npm start    # Starts on http://localhost:3000
```

### **2. Complete a Test Assessment**
1. Visit `http://localhost:3000`
2. Complete the full assessment flow
3. Click an involvement card on the results screen

### **3. Verify Data in Supabase**
Check your Supabase dashboard:
- **Table Editor** → `mobile_assessments` → Should see your test data
- **Table Editor** → `mobile_user_involvement` → Should see webhook data

---

## 📈 **View Your Mobile Assessment Analytics**

### **Quick Dashboard Query**
Run this in your SQL Editor for a summary:
```sql
SELECT * FROM mobile_assessment_summary;
```

### **Daily Breakdown Query**
For detailed analytics:
```sql
SELECT 
    date,
    total_mobile_assessments,
    completed_mobile_assessments,
    completion_rate_percent,
    involvement_type
FROM mobile_assessment_analytics 
ORDER BY date DESC 
LIMIT 10;
```

---

## 🔍 **Data Structure Overview**

### **`mobile_assessments` Table Fields:**
- `id` - Unique assessment ID
- `user_age` - Age group (e.g., "35-44")
- `job_role` - Role level (e.g., "manager")
- `decision_maker` - Decision making authority
- `contact_info` - Email, name, organization (JSONB)
- `answers` - All assessment responses (JSONB)
- `scores` - VALID dimension scores (JSONB)
- `status` - 'started' or 'completed'
- `source` - Always 'mobile_standalone'

### **`mobile_user_involvement` Table Fields:**
- `involvement_type` - consultant, pilot, research, updates, founder
- `contact_email` - User's email
- `webhook_sent` - Whether webhook was triggered
- `additional_data` - Demographics + scores (JSONB)

---

## ✅ **Verification Checklist**

- [ ] Migration ran successfully (no SQL errors)
- [ ] 3 new tables appear in Table Editor
- [ ] Mobile assessment loads at `http://localhost:3000`
- [ ] Test assessment creates data in `mobile_assessments`
- [ ] Involvement cards trigger `mobile_user_involvement` entries
- [ ] Analytics views return data

---

## 🚨 **Issues Fixed**

- ✅ **Separate Tables**: Mobile data completely isolated
- ✅ **Event Listeners**: Target specific mobile screens  
- ✅ **Supabase Config**: Real project credentials
- ✅ **Step Counter**: Removed from mobile header
- ✅ **Analytics Views**: Mobile-specific reporting

## 🎯 **Next Steps**

Once setup is complete:
1. **Customize Webhooks**: Edit `api/routes.js` for your integrations
2. **Deploy**: Upload to your hosting platform
3. **Monitor**: Use analytics views for insights
4. **Scale**: The system handles unlimited mobile assessments

---

**🔗 Related Files:**
- `WEBHOOKS.md` - Complete webhook documentation
- `README.md` - Full project overview
- `api/routes.js` - Webhook customization 