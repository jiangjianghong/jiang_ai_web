<div align="center">

# Jiang's Tab

```
 /\_/\
( o.o )
 > ^ <
```

**A modern, highly customizable personal website navigation application**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🌐 Live Demo](https://jiangjiang.cc) | [🐛 Report Bug](https://github.com/jiangjianghong/jiang_ai_web/issues) | [✨ Request Feature](https://github.com/jiangjianghong/jiang_ai_web/issues)

**[ English | [简体中文](README.zh-CN.md) ]**

![Screenshot](image.png)

</div>

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Database Setup](#-database-setup)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [Changelog](#-changelog)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 User Interface
- ✅ **Responsive Design** - Perfect for desktop and mobile
- 🌄 **Dynamic Wallpapers** - Auto-refresh daily, multi-resolution support
- 🎭 **Parallax Effects** - Mouse-following parallax animations
- 🎚️ **Opacity Control** - Customizable card and search bar transparency
- 🌗 **Theme Switching** - Seamless light/dark mode toggle
- ⏰ **Time Display** - Real-time clock and date display
- 🎨 **Color Customization** - Custom colors for cards and search bar

### 🔧 Functionality
- 📝 **Website Card Management** - Add, edit, delete website cards
- 🔍 **Smart Search** - Real-time search by name, URL, and tags
- 🎯 **Drag & Drop** - Reorder cards with drag and drop
- 📊 **Visit Statistics** - Auto-track visit counts and timestamps
- 🏷️ **Tag System** - Organize websites with tags
- 📝 **Notes Feature** - Add personal notes to each website
- ✅ **TODO Management** - Built-in todo list functionality
- 📖 **Poetry Display** - Random Chinese poetry display

</td>
<td width="50%">

### ☁️ Cloud Services
- 🔐 **User Authentication** - Secure Supabase-based auth system
- 🔄 **Smart Data Sync** - Auto-sync data and settings to cloud
- 🛡️ **Data Validation** - Validate data before sync, prevent empty overwrites
- 📱 **Multi-device Sync** - Seamless sync across devices
- 🔌 **Offline Support** - Full functionality when offline
- 📧 **Email Verification** - Email verification and password reset
- 👤 **User Profiles** - Customize display name and avatar

### 🚀 Performance
- 💾 **Smart Caching** - Multi-layer cache strategy (Memory + IndexedDB)
- 🖼️ **Icon Caching** - Auto-cache website icons for faster loading
- ⚡ **Code Splitting** - Load on demand, reduce initial bundle size
- 🎯 **Resource Preloading** - Smart preload frequently used resources
- 📱 **PWA Support** - Offline access and install to desktop
- 🧹 **Memory Management** - Auto cleanup and memory optimization

</td>
</tr>
</table>

### 🔌 Notion Integration

- 📊 **Workspace** - Integrate with Notion databases
- 📑 **Multiple Views** - Card view and list view support
- 🔍 **Search & Filter** - Filter by category and tags
- ⌨️ **Keyboard Navigation** - Full keyboard shortcuts support
- 🎨 **Rich Text Rendering** - Support Notion rich text format

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="33%">

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

</td>
<td width="33%">

### State & Data
![React Context](https://img.shields.io/badge/React_Context-API-61DAFB?style=flat-square&logo=react)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Storage-orange?style=flat-square)
![LocalStorage](https://img.shields.io/badge/LocalStorage-API-yellow?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)

</td>
<td width="33%">

### Backend
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Serverless-black?style=flat-square)

</td>
</tr>
<tr>
<td width="33%">

### Animation
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.9.2-BB4E9D?style=flat-square&logo=framer)
![React DnD](https://img.shields.io/badge/React_DnD-16.0.1-orange?style=flat-square)
![Particles](https://img.shields.io/badge/TSParticles-3.0.0-blueviolet?style=flat-square)

</td>
<td width="33%">

### Visualization
![Recharts](https://img.shields.io/badge/Recharts-2.15.1-8884d8?style=flat-square)
![HTML2Canvas](https://img.shields.io/badge/HTML2Canvas-1.4.1-green?style=flat-square)

</td>
<td width="33%">

### Deployment
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-222?style=flat-square&logo=github)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Code_Style-F7B93E?style=flat-square&logo=prettier&logoColor=white)

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (recommended) or npm >= 9.0.0
```

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/jiangjianghong/jiang_ai_web.git
cd jiang_ai_web
```

2. **Install dependencies**

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

3. **Configure environment variables**

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=Jiang's Tab
VITE_APP_VERSION=1.0.0
```

4. **Start development server**

```bash
pnpm run dev
```

Visit http://localhost:3000 to see the app 🎉

5. **Build for production**

```bash
pnpm run build
pnpm run preview
```

---

## 🏗️ Architecture

```
jiang_ai_web/
├── 📁 public/                    # Static assets
│   ├── icon/                     # App icons
│   ├── manifest.json             # PWA config
│   └── sw.js                     # Service Worker
│
├── 📁 src/
│   ├── 📁 components/            # React components
│   │   ├── AnimatedCat.tsx       # Animated cat component
│   │   ├── AuthForm.tsx          # Authentication form
│   │   ├── CardEditModal.tsx     # Card edit modal
│   │   ├── SearchBar.tsx         # Search bar component
│   │   ├── TodoModal.tsx         # TODO modal
│   │   ├── TimeDisplay.tsx       # Time display
│   │   ├── PoemDisplay.tsx       # Poetry display
│   │   └── Workspace/            # Workspace components
│   │       ├── WorkspaceModal.tsx
│   │       ├── WorkspaceCard.tsx
│   │       └── NotionGuide.tsx
│   │
│   ├── 📁 contexts/              # React contexts
│   │   ├── SupabaseAuthContext.tsx     # Auth context
│   │   ├── SyncContext.tsx             # Sync state
│   │   ├── TransparencyContext.tsx     # Transparency settings
│   │   ├── UserProfileContext.tsx      # User profile
│   │   └── WorkspaceContext.tsx        # Workspace state
│   │
│   ├── 📁 hooks/                 # Custom hooks
│   │   ├── useAutoSync.ts        # Auto sync
│   │   ├── useCloudData.ts       # Cloud data management
│   │   ├── useDataManager.ts     # Data import/export
│   │   ├── useDragAndDrop.ts     # Drag & drop
│   │   ├── useFavicon.ts         # Icon handling
│   │   ├── useTheme.ts           # Theme management
│   │   └── useWebsiteData.ts     # Website data
│   │
│   ├── 📁 lib/                   # Utilities and services
│   │   ├── api/                  # API clients
│   │   │   ├── ApiClient.ts
│   │   │   ├── NotionApiClient.ts
│   │   │   └── WorkspaceManager.ts
│   │   ├── proxy/                # Proxy services
│   │   │   ├── CorsProxyService.ts
│   │   │   └── smartProxy.ts
│   │   ├── faviconCache.ts       # Icon cache
│   │   ├── indexedDBCache.ts     # IndexedDB cache
│   │   ├── storageManager.ts     # Storage manager
│   │   ├── supabase.ts           # Supabase config
│   │   └── supabaseSync.ts       # Supabase sync
│   │
│   ├── 📁 pages/                 # Page components
│   │   ├── Home.tsx              # Home page
│   │   ├── Settings.tsx          # Settings page
│   │   └── ResetPassword.tsx     # Password reset
│   │
│   ├── MainApp.tsx               # Main app component
│   ├── main.tsx                  # App entry
│   └── index.css                 # Global styles
│
├── 📁 supabase/                  # Supabase config
│   ├── functions/                # Edge Functions
│   │   ├── cors-proxy/           # CORS proxy service
│   │   ├── favicon-service/      # Favicon service
│   │   ├── notion-proxy/         # Notion proxy
│   │   └── wallpaper-service/    # Wallpaper service
│   └── config.toml               # Supabase config
│
├── package.json                  # Dependencies
├── vite.config.ts                # Vite config
├── tailwind.config.js            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

---

## 📦 Deployment

### GitHub Pages Auto Deploy

```bash
pnpm run deploy
```

GitHub Actions is configured to auto-deploy when pushing to main branch.

### Vercel Deploy

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Auto deploy ✨

---

## 🗄️ Supabase Configuration

### Database Setup

If you need to set up your own Supabase instance, follow these steps:

<details>
<summary>1️⃣ Complete Database Schema (First Time Setup)</summary>

Execute the following script in Supabase SQL Editor:

```sql
-- ====================================
-- 1. Create Tables
-- ====================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  -- Basic settings
  card_opacity NUMERIC DEFAULT 0.8,
  search_bar_opacity NUMERIC DEFAULT 0.9,
  parallax_enabled BOOLEAN DEFAULT true,
  wallpaper_resolution TEXT DEFAULT 'high',
  theme TEXT DEFAULT 'dark',
  -- Color settings
  card_color TEXT DEFAULT '255, 255, 255',
  search_bar_color TEXT DEFAULT '255, 255, 255',
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 30,
  -- Search and sort
  search_in_new_tab BOOLEAN DEFAULT true,
  auto_sort_enabled BOOLEAN DEFAULT false,
  -- Time component settings
  time_component_enabled BOOLEAN DEFAULT true,
  show_full_date BOOLEAN DEFAULT true,
  show_seconds BOOLEAN DEFAULT true,
  show_weekday BOOLEAN DEFAULT true,
  show_year BOOLEAN DEFAULT true,
  show_month BOOLEAN DEFAULT true,
  show_day BOOLEAN DEFAULT true,
  -- Style settings
  search_bar_border_radius INTEGER DEFAULT 12,
  -- Timestamps
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User websites table
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  websites JSONB DEFAULT '[]'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. Enable Row Level Security (RLS)
-- ====================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 3. Create Security Policies
-- ====================================

-- user_profiles policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_settings policies
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_websites policies
CREATE POLICY "Users can read own websites" ON user_websites
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own websites" ON user_websites
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own websites" ON user_websites
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ====================================
-- 4. Create Functions and Triggers
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_websites_updated_at
  BEFORE UPDATE ON user_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 5. Create Indexes
-- ====================================

CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_user_websites_id ON user_websites(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

</details>

<details>
<summary>2️⃣ Incremental Migration (Existing Database)</summary>

If you already have a database, just add the new fields:

```sql
-- Add color settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '255, 255, 255',
ADD COLUMN IF NOT EXISTS search_bar_color TEXT DEFAULT '255, 255, 255';

-- Add sync settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 30;

-- Add search and sort settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_in_new_tab BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sort_enabled BOOLEAN DEFAULT false;

-- Add time component settings fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS time_component_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_full_date BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_seconds BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_weekday BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_year BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_month BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_day BOOLEAN DEFAULT true;

-- Add search bar style settings field
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_bar_border_radius INTEGER DEFAULT 12;
```

</details>

<details>
<summary>3️⃣ Storage Buckets Configuration</summary>

Create Storage buckets for Favicon and Wallpaper services:

```sql
-- Create favicons bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('favicons', 'favicons', true)
ON CONFLICT (id) DO NOTHING;

-- Create wallpapers bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- favicons bucket policies
CREATE POLICY "Public favicon access" ON storage.objects
FOR SELECT USING (bucket_id = 'favicons');

CREATE POLICY "Service role favicon upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'favicons');

CREATE POLICY "Service role favicon update" ON storage.objects
FOR UPDATE USING (bucket_id = 'favicons');

-- wallpapers bucket policies
CREATE POLICY "Public wallpaper access" ON storage.objects
FOR SELECT USING (bucket_id = 'wallpapers');

CREATE POLICY "Service role wallpaper upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wallpapers');

CREATE POLICY "Service role wallpaper update" ON storage.objects
FOR UPDATE USING (bucket_id = 'wallpapers');
```

</details>

### Edge Functions Deployment

<details>
<summary>📦 Favicon Service</summary>

Unified favicon fetching and caching service.

**Deploy Command:**
```bash
supabase functions deploy favicon-service
```

**API Usage:**
```bash
GET https://your-project.supabase.co/functions/v1/favicon-service?domain=github.com&size=64
```

**Features:**
- 🚀 Unified API for website favicons
- 💾 Auto-cache to Supabase Storage
- 🔄 Multi-source support with automatic failover
- ⚡ Edge computing, global low latency

See: `supabase/functions/favicon-service/README.md`

</details>

<details>
<summary>🖼️ Wallpaper Service</summary>

Daily wallpaper fetching and caching service (Bing daily wallpaper).

**Deploy Command:**
```bash
supabase functions deploy wallpaper-service
```

**API Usage:**
```bash
GET https://your-project.supabase.co/functions/v1/wallpaper-service?resolution=uhd
```

**Supported Resolutions:**
- `uhd` - 3840x2160 (4K)
- `1920x1080` - Full HD
- `1366x768` - HD
- `mobile` - 1080x1920 (Mobile)

See: `supabase/functions/wallpaper-service/README.md`

</details>

<details>
<summary>🔗 Notion Proxy</summary>

Notion API proxy service for workspace integration.

**Deploy Command:**
```bash
supabase functions deploy notion-proxy
```

**Configuration Required:**
Set environment variables in Supabase Dashboard:
- `NOTION_API_KEY` - Notion Integration Token

</details>

---

## 🔐 Security Features

- 🛡️ **Row Level Security** - Supabase RLS policies
- 🔒 **Data Encryption** - Encrypted storage for sensitive data
- ✅ **Input Validation** - Strict data validation (Zod)
- 🚫 **XSS Protection** - Content Security Policy
- 🍪 **Cookie Management** - GDPR compliant

---

## 🤝 Contributing

We welcome all forms of contributions!

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint code linting
- ✅ Prettier code formatting
- ✅ Conventional Commits

---

## 📝 Changelog

### v1.2.1 (2025-12-08)

**🔧 Fixes**
- Fixed wallpaper update issue where new wallpapers were not fetched until 8:00 AM (UTC+8)
- Updated wallpaper service to use local time (UTC+8) for consistent daily updates
- Optimized client-side caching logic to respect local timezone

### v1.2.0 (2024-12-19)

**🔧 Fixes**
- Fixed data sync issue that could overwrite cloud data with empty data
- Added data validation to ensure only valid website data is synced

**✨ Improvements**
- Optimized sync status display for clearer feedback
- Enhanced error handling for better system stability
- Refactored core code for better performance and maintainability

**🛡️ Security**
- Implemented multi-layer data protection to prevent data loss
- Strengthened data validation rules for data integrity

---

## 🛠️ Troubleshooting

<details>
<summary>Common Issues & Solutions</summary>

### Domain Not Accessible
- Check DNS configuration
- Wait for DNS propagation (up to 24 hours)
- Clear browser cache

### Functionality Issues
- Check browser console for errors
- Verify network connection
- Validate Supabase configuration

### Sync Issues
- Check if user is logged in
- Verify stable network connection
- Check sync status indicator

### Icon Loading Failed
- Check network connection
- Try refreshing page
- Clear browser cache

</details>

---

## 📄 License

This project is licensed under Apache License 2.0 - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Thanks to the following open source projects and services:

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Backend service
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

## 📞 Contact

- **Repository**: [GitHub](https://github.com/jiangjianghong/jiang_ai_web)
- **Issue Tracker**: [Issues](https://github.com/jiangjianghong/jiang_ai_web/issues)
- **Live Demo**: [jiangjiang.cc](https://jiangjiang.cc)

---

<div align="center">

**Jiang's Tab** - Make website management simpler and smarter 🚀

Made with ❤️ by [Jiang](https://github.com/jiangjianghong)

⭐ Star this repo if you like it!

</div>
