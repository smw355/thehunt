# 🏁 The Race - Photo-Enabled Competition Platform

A complete digital recreation of Amazing Race-style competitions with **mobile photo/video uploads**, **admin feedback system**, and **comprehensive clue management**.

Perfect for corporate team building, educational events, community competitions, and family gatherings.

## 🚀 **Key Features**

### 📱 **Mobile-First Experience**
- **Camera Integration**: Automatic camera access on mobile devices
- **Photo/Video Uploads**: Up to 10MB files with automatic compression
- **Offline Support**: Queue uploads when connection is poor
- **Touch-Optimized**: Designed for phones and tablets

### 🎯 **Advanced Admin Tools**
- **Photo Gallery Reviews**: Beautiful grid layout for submission review
- **Mandatory Feedback**: Admins must comment when rejecting submissions
- **Team Progress Tracking**: Real-time view of all team statuses
- **Bulk Clue Management**: Import/export clue libraries as JSON

### 🔄 **Smart Feedback System**
- **Rejection History**: Teams see all previous attempts with admin feedback
- **Clear Guidance**: Specific comments on what needs fixing
- **Visual Comparison**: Side-by-side view of rejected vs new submissions
- **Attempt Tracking**: Numbered attempts with timestamps

### 🎮 **Game Mechanics**
- **Three Challenge Types**: Route Info, Detour, Roadblock (TV show accurate)
- **Multi-Team Support**: Unlimited teams per game
- **Real-Time Updates**: Instant approval/rejection notifications
- **Data Persistence**: Browser-based storage with auto-save

## 📦 **Quick Deploy to Vercel**

### Option 1: GitHub Integration (Recommended)
1. **Fork or clone this repository**
2. **Deploy via Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import from GitHub
   - Select repository: `smw355/therace`
   - **Set Environment Variable**: `NEXT_PUBLIC_ADMIN_PASSWORD` = `your_secure_password`
   - Click "Deploy"

### Option 2: Direct Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔐 **Environment Variables**

Set in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin login password | `MySecurePassword123!` |
| `BLOB_READ_WRITE_TOKEN` | Auto-configured by Vercel Blob | (automatic) |

## 🎮 **Complete Usage Guide**

### 👨‍💼 **Admin Workflow**

1. **Login**: Use your admin password
2. **Create Game**:
   - Enter game name (e.g., "Downtown Adventure")
   - Generate or enter 6-character game code (e.g., "LONDON")
3. **Build Clue Library**: Create challenges or import from JSON
4. **Assign Clues**: Select clues and set sequence for the game
5. **Add Teams**: Create team names and passwords
6. **Start Game**: Teams can now login and begin racing
7. **Review Submissions**:
   - View photo galleries of team submissions
   - Approve or reject with detailed feedback
   - Track team progress in real-time

### 📱 **Team Workflow**

1. **Login**: Enter game code + team credentials
2. **View Current Clue**: See challenge card with instructions
3. **Complete Challenge**: Go to location, perform task
4. **Submit Proof**:
   - Take photos/videos at location
   - Add text description (optional)
   - Submit for admin review
5. **Handle Feedback**:
   - If approved: advance to next clue
   - If rejected: read admin comments and resubmit
6. **Race to Finish**: Complete all clues to win!

## 📋 **Clue Creation & Management**

### Challenge Types

#### 1. **Route Info**
Basic informational clues that direct teams to locations or give instructions.
```json
{
  "type": "route-info",
  "title": "Find the Red Bridge",
  "content": [
    "Make your way to the historic red bridge in downtown.",
    "Once there, find the plaque with the founding date.",
    "Take a photo of your team with the plaque clearly visible."
  ]
}
```

#### 2. **Detour**
Teams choose between two different tasks (just like the TV show).
```json
{
  "type": "detour",
  "title": "Work It or Walk It",
  "detourOptionA": {
    "title": "Work It",
    "description": "Find a local coffee shop and successfully make and serve a cappuccino to a customer. Take a photo of the finished drink and the happy customer."
  },
  "detourOptionB": {
    "title": "Walk It",
    "description": "Walk to the nearest park and find 5 different types of flowers. Take individual photos of each flower type with a team member's hand for scale."
  }
}
```

#### 3. **Roadblock**
One team member must be selected before the task is revealed.
```json
{
  "type": "road-block",
  "title": "Memory Challenge",
  "roadblockQuestion": "Who has the best memory for details?",
  "roadblockTask": "Study the storefront window display for 2 minutes, then recreate the exact arrangement using items from your backpack. Take a photo of your recreation next to the original."
}
```

### 📤 **Importing Clue Libraries**

#### Creating Your JSON File

Create a file called `my-clues.json` with this structure:

```json
{
  "version": "1.0",
  "exportDate": "2024-01-15T10:00:00.000Z",
  "clues": [
    {
      "type": "route-info",
      "title": "Central Station Start",
      "content": [
        "Begin your race at Central Station's main entrance.",
        "Look for the information board with departure times.",
        "Take a team photo in front of the board showing the current time."
      ]
    },
    {
      "type": "detour",
      "title": "Fast Food or Slow Food",
      "detourOptionA": {
        "title": "Fast Food",
        "description": "Visit any fast food restaurant and order exactly 3 different items. Take photos of each item and your receipt showing the timestamp."
      },
      "detourOptionB": {
        "title": "Slow Food",
        "description": "Find a sit-down restaurant and order an appetizer. Take a photo with the server and a selfie with your food when it arrives."
      }
    },
    {
      "type": "road-block",
      "title": "Street Performance",
      "roadblockQuestion": "Who's ready to entertain the crowd?",
      "roadblockTask": "Perform a 2-minute street performance (song, dance, or comedy) and collect at least $5 in donations. Take a photo of the money collected and a video of the performance."
    },
    {
      "type": "route-info",
      "title": "City Hall Finish",
      "content": [
        "Make your way to City Hall for the finish line.",
        "Find the main flagpole in front of the building.",
        "Take a celebratory team photo with the flag in the background.",
        "Check in with the race official to stop your time!"
      ]
    }
  ]
}
```

#### Import Process

1. **Access Admin Panel**: Login with admin password
2. **Go to Clue Library**: Scroll to "Clue Library" section
3. **Click Import**: Green "Import" button next to "Add Clue"
4. **Select File**: Choose your `.json` file
5. **Choose Import Mode**:
   - **Replace**: Removes all existing clues and imports new ones
   - **Add**: Keeps existing clues and adds new ones
6. **Confirm**: Review the import summary and confirm

#### Export Your Clues

1. **In Admin Panel**: Go to Clue Library section
2. **Click Export**: Purple "Export" button
3. **File Downloads**: `the-race-clues-[timestamp].json`
4. **Share Library**: Send file to other race organizers

### 💡 **Clue Writing Best Practices**

#### Route Info Clues
- **Be Specific**: Include landmark details and clear directions
- **Photo Requirements**: Always specify what should be in the photo
- **Difficulty Scaling**: Start easy, increase complexity throughout race
- **Local Knowledge**: Reference well-known local landmarks

#### Detour Clues
- **Balanced Options**: Make sure both choices take similar time/effort
- **Clear Differences**: Options should feel distinctly different (physical vs mental)
- **Equipment Needs**: Consider what teams will have available
- **Location Variety**: Mix indoor/outdoor and different neighborhoods

#### Roadblock Clues
- **Cryptic Questions**: Don't give away the task (like TV show)
- **Single Person**: Task must be completable by one team member
- **Clear Success Criteria**: Teams must know when they're done
- **Photo/Video Proof**: Specify exactly what evidence is needed

### 🎯 **Sample Race Scenarios**

#### **Corporate Team Building** (2-3 hours)
```json
{
  "clues": [
    {
      "type": "route-info",
      "title": "Office Scavenger Hunt",
      "content": ["Find 5 different company logos within a 2-block radius of the office..."]
    },
    {
      "type": "detour",
      "title": "Lunch Rush or Coffee Culture",
      "detourOptionA": {"title": "Lunch Rush", "description": "Order team lunch from 3 different food trucks..."},
      "detourOptionB": {"title": "Coffee Culture", "description": "Visit 3 coffee shops and rate their lattes..."}
    }
  ]
}
```

#### **Campus Adventure** (4-5 hours)
```json
{
  "clues": [
    {
      "type": "road-block",
      "title": "Academic Challenge",
      "roadblockQuestion": "Who's the biggest bookworm?",
      "roadblockTask": "Find a book in the library published the same year you were born..."
    }
  ]
}
```

#### **City-Wide Competition** (Full day)
```json
{
  "clues": [
    {
      "type": "route-info",
      "title": "Public Transportation Master",
      "content": ["Using only public transportation, get to the city's highest viewpoint..."]
    }
  ]
}
```

## 🛠 **Development & Customization**

### Local Development
```bash
git clone https://github.com/smw355/therace.git
cd therace
npm install
npm run dev  # http://localhost:3000
```

### Build & Deploy
```bash
npm run build  # Production build
npm run start  # Production server
npm run lint   # Check code quality
```

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Storage**: Vercel Blob (photos/videos) + localStorage (game data)
- **UI**: Tailwind CSS + Lucide Icons
- **State**: React Hooks with custom localStorage persistence
- **Deployment**: Vercel (recommended) or any Node.js host

## 📱 **Mobile Optimization Features**

- **Camera API**: Direct access to device camera
- **Image Compression**: Automatic optimization before upload
- **Offline Queue**: Store photos when connection is poor
- **Touch Gestures**: Swipe, pinch, tap optimized
- **Responsive Design**: Perfect on all screen sizes
- **Progressive Web App**: Add to home screen capability

## 🔒 **Security & Privacy**

- **Environment Variables**: All secrets stored securely
- **File Validation**: Only images/videos accepted, size limits enforced
- **Input Sanitization**: All user inputs validated and sanitized
- **Access Control**: Team isolation, admin-only functions protected
- **Error Boundaries**: Graceful failure handling prevents crashes

## 🎨 **Customization Options**

### Branding
- Change color scheme in `app/globals.css`
- Update logo and title in components
- Modify clue card designs in `renderClueCard()`

### Functionality
- Add new clue types in the main component
- Implement scoring systems
- Add time limits and timers
- Create leaderboards and analytics

## 🆘 **Troubleshooting**

### Common Issues

**Photos not uploading?**
- Check internet connection
- Verify Vercel Blob is configured
- Try smaller file sizes (under 5MB)

**Teams can't login?**
- Verify game is started (not in 'setup' mode)
- Check game code and team credentials
- Ensure team was added before game start

**Admin panel not working?**
- Verify `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable is set
- Try the default password: `admin123`
- Check browser console for errors

**Vercel deployment failing?**
- Ensure all environment variables are set
- Check build logs for specific errors
- Verify `package.json` has all required scripts

## 🌟 **Perfect For**

- **Corporate Events**: Office team building, company retreats
- **Education**: Campus orientation, field trips, class activities
- **Community**: Neighborhood events, festival activities
- **Family**: Reunions, birthday parties, holiday gatherings
- **Youth Groups**: Summer camps, scout activities, youth events
- **Conferences**: Ice breakers, networking activities

## 📞 **Support**

For issues, feature requests, or questions:
- **GitHub Issues**: [Create an issue](https://github.com/smw355/therace/issues)
- **Documentation**: This README and inline code comments
- **Community**: Share your race experiences and clue libraries!

---

## 🏆 **Ready to Race!**

This platform provides everything needed to run professional-quality Amazing Race competitions with:
- ✅ Mobile photo submission system
- ✅ Admin feedback and management tools
- ✅ Comprehensive clue creation system
- ✅ Real-time team progress tracking
- ✅ Production-ready deployment on Vercel

**Start your race today!** 🏁📸🎯