# 🌸 Fertility Tracker

A comprehensive, privacy-focused fertility and menstrual cycle tracking application built with React and Supabase. Track your periods, predict ovulation, plan pregnancies, and gain insights into your reproductive health.

[![Live Demo](https://img.shields.io/badge/Live-Demo-pink?style=for-the-badge)](https://fertility-tracker-beta.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

## ✨ Features

### 📊 **Period Tracking**
- **Excel-style table entry** for bulk period logging
- **Smart auto-calculation** of end dates based on duration
- **Flow intensity tracking** (Light, Medium, Heavy)
- **Symptom monitoring** with 10+ predefined options
- **Notes and observations** for each cycle

### 🔮 **Predictions & Analytics**
- **Next period predictions** with confidence levels
- **Ovulation window calculations** based on your cycle patterns
- **Cycle length analysis** and pattern recognition
- **Fertility window identification** for conception planning

### 🍼 **Pregnancy Planning**
- **Reverse conception calculator** - enter desired birth month/year
- **Optimal timing guidance** for conception attempts
- **Fertile window mapping** for specific cycles
- **Timeline visualization** from conception to delivery

### 👑 **Admin Dashboard** (Admin Users Only)
- **User management** - view all registered users
- **Activity monitoring** - track user engagement and app usage
- **Admin action logging** - audit trail for all administrative actions
- **System statistics** - user counts, cycle data, and engagement metrics
- **User privilege management** - grant/revoke admin access

### 🔐 **Security & Privacy**
- **Secure authentication** with email verification
- **Row-level security** ensures users only see their data
- **Encrypted data storage** in PostgreSQL database
- **HIPAA-compliant infrastructure** via Supabase
- **No data tracking** or third-party analytics

## 🚀 Live Demo

**Try it now:** [https://fertility-tracker-beta.vercel.app/](https://fertility-tracker-beta.vercel.app/)

Create an account or use the demo features to explore the application.

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Lucide React** - Beautiful, customizable icons
- **JavaScript ES6+** - Modern JavaScript features

### **Backend & Database**
- **Supabase** - Open-source Firebase alternative
- **PostgreSQL** - Robust, ACID-compliant relational database
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time subscriptions** - Live data updates

### **Deployment & Hosting**
- **Vercel** - Fast, reliable frontend hosting with automatic deployments
- **GitHub Actions** - Continuous integration and deployment
- **Custom domain support** - Professional URL structure

### **Authentication & Security**
- **Supabase Auth** - Secure user authentication with email verification
- **JWT tokens** - Stateless authentication
- **Password hashing** - bcrypt-based secure password storage
- **Session management** - Automatic token refresh

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js 16+** and **npm** installed
- **Supabase account** (free tier available)
- **Vercel account** for deployment (optional)
- **Git** for version control

## ⚡ Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/durgesh0505/Fertility-Tracker.git
cd Fertility-Tracker
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Set Up Supabase**

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **API Key** from Settings → API

#### Run Database Setup
Execute this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  weight DECIMAL,
  typical_cycle_length INTEGER DEFAULT 28,
  cycle_length_variation INTEGER DEFAULT 2,
  typical_period_length INTEGER DEFAULT 5,
  period_length_variation INTEGER DEFAULT 1,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Cycles table
CREATE TABLE public.cycles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  period_length INTEGER,
  cycle_length INTEGER,
  flow TEXT CHECK (flow IN ('light', 'medium', 'heavy')),
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own cycles" ON public.cycles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycles" ON public.cycles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycles" ON public.cycles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cycles" ON public.cycles
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. **Environment Configuration**

Create `.env.local` in your project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. **Run the Application**
```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Update Supabase Settings:**
   - Go to Supabase → Authentication → Settings
   - Update Site URL to your Vercel domain

### Alternative Deployment Options
- **Netlify** - Similar to Vercel with GitHub integration
- **GitHub Pages** - Free static hosting (requires build setup)
- **AWS Amplify** - AWS-based hosting with CI/CD
- **DigitalOcean App Platform** - Container-based deployment

## 👥 User Guide

### **Getting Started**
1. **Sign Up** - Create account with email verification
2. **Add Periods** - Use the Excel-style table or form entry
3. **View Predictions** - See upcoming periods and fertile windows
4. **Plan Pregnancy** - Use conception calculator for family planning

### **Period Tracking**
- **Table Entry:** Add multiple periods at once with auto-calculated end dates
- **Form Entry:** Traditional single-period entry with symptom selection
- **Data Import:** Upload CSV files from other tracking apps

### **Understanding Predictions**
- **Confidence Levels:** Higher confidence for recent cycles, lower for future predictions
- **Fertile Windows:** 6-day window (5 days before + day of ovulation)
- **Cycle Variations:** App learns your patterns and adjusts predictions

## 🔧 Development

### **Project Structure**
```
src/
├── App.js              # Main application component
├── index.js            # React app entry point
├── supabaseClient.js   # Supabase configuration
└── components/         # Reusable components (future)
```

### **Key Components**
- **AuthComponent** - Login/signup flow
- **Dashboard** - Overview and predictions
- **PeriodTracker** - Cycle logging interface
- **PregnancyPlanner** - Conception timing calculator
- **AdminPanel** - User management (admin only)
- **Profile** - User settings and preferences

### **Database Schema**
- **user_profiles** - User information and cycle settings
- **cycles** - Individual period and cycle data
- **user_activity_logs** - App usage tracking
- **admin_logs** - Administrative action audit trail

### **Contributing**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📈 Roadmap

### **Upcoming Features**
- [ ] **Mobile App** (React Native)
- [ ] **Data Export** (PDF reports, CSV backups)
- [ ] **Reminder Notifications** (email/SMS)
- [ ] **Partner Sharing** (optional cycle sharing)
- [ ] **Healthcare Provider Portal** (medical professional access)
- [ ] **Advanced Analytics** (cycle insights, health correlations)
- [ ] **Multi-language Support** (i18n)
- [ ] **Dark Mode** (theme customization)

### **Technical Improvements**
- [ ] **Offline Support** (PWA capabilities)
- [ ] **Performance Optimization** (code splitting, lazy loading)
- [ ] **Enhanced Security** (2FA, audit logging)
- [ ] **API Documentation** (OpenAPI specification)
- [ ] **Automated Testing** (unit, integration, e2e tests)
- [ ] **Performance Monitoring** (error tracking, analytics)

## 🛡️ Privacy & Security

### **Data Protection**
- **No third-party tracking** - Your data stays private
- **Encrypted storage** - AES-256 encryption at rest
- **Secure transmission** - TLS 1.3 for all communications
- **Regular backups** - Automated daily backups with point-in-time recovery

### **User Rights**
- **Data portability** - Export your data anytime
- **Right to deletion** - Complete account and data removal
- **Transparency** - Clear privacy policy and data usage
- **No data selling** - Your personal health data is never commercialized

### **Compliance**
- **GDPR compliant** - European data protection standards
- **HIPAA considerations** - Healthcare data protection practices
- **SOC 2 infrastructure** - Enterprise-grade security via Supabase

## 🤝 Support

### **Getting Help**
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive guides and API docs
- **Community** - Join discussions and share feedback
- **Email Support** - Direct contact for urgent issues

### **Common Issues**
- **Login Problems** - Check email verification and password requirements
- **Data Sync** - Ensure stable internet connection and refresh browser
- **Prediction Accuracy** - Add more cycle data for better predictions
- **Performance** - Clear browser cache and check internet speed

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **What this means:**
- ✅ **Commercial use** - Use in commercial projects
- ✅ **Modification** - Modify and adapt the code
- ✅ **Distribution** - Share and distribute freely
- ✅ **Private use** - Use for personal projects
- ❗ **No warranty** - Software provided "as is"

## 🎯 Why Fertility Tracker?

### **Privacy-First**
Unlike many commercial apps, Fertility Tracker prioritizes your privacy. Your sensitive health data is encrypted, never sold, and completely under your control.

### **Open Source**
Transparency builds trust. Our open-source approach means you can verify our privacy claims and contribute to improvements.

### **Professional Grade**
Built with enterprise-level security and scalability in mind, suitable for personal use or integration into healthcare systems.

### **Community Driven**
Developed with input from users who understand the importance of accurate, reliable menstrual cycle tracking.

---

## 🙏 Acknowledgments

- **Supabase Team** - For providing an excellent open-source Backend-as-a-Service
- **Vercel Team** - For seamless deployment and hosting platform
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide Icons** - For beautiful, consistent iconography
- **React Community** - For the robust ecosystem and documentation
- **Open Source Contributors** - For inspiration and code examples

---

## 📞 Contact

**Project Maintainer:** [Durgesh](https://github.com/durgesh0505)

**Project Link:** [https://github.com/durgesh0505/Fertility-Tracker](https://github.com/durgesh0505/Fertility-Tracker)

**Live Demo:** [https://fertility-tracker-beta.vercel.app/](https://fertility-tracker-beta.vercel.app/)

---

<div align="center">
  <p>Made with ❤️ for reproductive health awareness</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
