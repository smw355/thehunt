# The Race - Photo-Enabled Competition Platform

A digital recreation of Amazing Race-style competitions with **full photo/video upload support** and **admin feedback system**.

## 🚀 **Major Features**

### 📱 **Mobile-First Photo Upload**
- **Camera Integration**: Direct camera access on mobile devices
- **Automatic Compression**: Images optimized for fast upload and storage
- **Multi-Media Support**: Photos and videos up to 10MB
- **Real-Time Preview**: See uploads before submitting
- **Drag & Drop**: Desktop-friendly file selection

### 🎯 **Enhanced Admin Review**
- **Photo Gallery**: Beautiful grid layout for reviewing submissions
- **Full-Screen View**: Click any photo/video to open in new tab
- **Mandatory Comments**: Admins must provide feedback when rejecting
- **Rich Submissions**: View photos alongside text descriptions

### 🔄 **Smart Feedback Loop**
- **Rejection History**: Teams see all previous attempts and feedback
- **Clear Guidance**: Admin comments help teams understand what to fix
- **Attempt Tracking**: Numbered attempts with timestamps
- **Visual Comparison**: Teams can review their rejected photos while creating new submissions

### 🏁 **Core Game Features**
- **Three Challenge Types**: Route Info, Detour, Roadblock
- **Team Management**: Multi-team competitions with individual logins
- **Real-Time Review**: Instant admin approval/rejection
- **Data Persistence**: Browser-based storage with auto-save
- **Responsive Design**: Works on all devices

## 🛠 **Tech Stack**

- **Framework**: Next.js 15 (App Router)
- **Storage**: Vercel Blob (photos/videos)
- **UI**: Tailwind CSS + Lucide Icons
- **State**: React Hooks + localStorage
- **Deployment**: Vercel (recommended)

## 📦 **Quick Deploy to Vercel**

### Option 1: GitHub Integration (Recommended)
1. **Create GitHub repo** and push this code:
   ```bash
   git remote add origin https://github.com/yourusername/therace.git
   git push -u origin main
   ```

2. **Deploy via Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import from GitHub
   - Select your repository
   - **Set Environment Variable**:
     - `NEXT_PUBLIC_ADMIN_PASSWORD` = `your_secure_password`
   - Click "Deploy"

### Option 2: Direct Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔐 **Environment Variables**

Set in Vercel Dashboard > Project Settings > Environment Variables:

- `NEXT_PUBLIC_ADMIN_PASSWORD`: Your secure admin password (default: admin123)
- `BLOB_READ_WRITE_TOKEN`: Auto-configured by Vercel Blob

## 🎮 **How to Use**

### Admin Workflow:
1. **Login** with admin password
2. **Create Game**: Name it, generate game code
3. **Add Clues**: Create challenges (Route Info/Detour/Roadblock)
4. **Add Teams**: Set team names and passwords
5. **Start Game**: Teams can now login and begin
6. **Review Submissions**: Approve photos or reject with detailed feedback

### Team Workflow:
1. **Login** with game code + team credentials
2. **View Clue**: See current challenge
3. **Complete Task**: Go to location, complete challenge
4. **Submit Proof**:
   - Take photos/videos of completion
   - Add optional text description
   - Submit for admin review
5. **Handle Feedback**: If rejected, read admin comments and resubmit

### Mobile Experience:
- Camera opens automatically when taking photos
- Images compressed automatically to save bandwidth
- Touch-friendly interface optimized for phones
- Works in mobile browsers (no app install needed)

## 🎯 **Perfect For**

- **Corporate Team Building**: Office amazing races
- **Educational Events**: Campus-wide scavenger hunts
- **Community Events**: City-wide competitions
- **Family Gatherings**: Neighborhood challenges
- **Youth Groups**: Camp activities
- **Conference Ice Breakers**: Event networking games

## 🔧 **Development**

```bash
npm install
npm run dev  # Start development server
npm run build  # Production build
npm run start  # Production server
```

## 📱 **Mobile Optimization**

The app is specifically designed for mobile teams who need to:
- Take photos at challenge locations
- Upload proof quickly with poor cell service
- Receive immediate feedback from game masters
- Navigate between challenges efficiently

## 🎨 **Visual Design**

- **Amazing Race Aesthetic**: Yellow and black color scheme
- **Card-Based Clues**: Authentic TV show appearance
- **Responsive Grids**: Beautiful on all screen sizes
- **Loading States**: Clear feedback during uploads
- **Error Handling**: User-friendly error messages

## 🔒 **Security & Privacy**

- Admin passwords configurable via environment variables
- File uploads limited to 10MB and validated types
- No sensitive data stored in code
- Temporary photo URLs with access controls
- Error boundaries prevent crashes

---

**Ready to deploy!** This is a complete, production-ready Amazing Race platform with photo uploads and admin feedback system.