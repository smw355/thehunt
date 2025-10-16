# 🏁 The Hunt - Multi-User Photo Hunt Platform

A complete **multi-user photo hunt platform** with OAuth authentication, personal clue libraries, and team-based gameplay. Perfect for treasure hunts, scavenger hunts, corporate team building, museum adventures, and community events.

## 🚀 Key Features

### 👥 Multi-User Architecture
- **OAuth Authentication**: Sign in with GitHub (more providers coming)
- **Personal Clue Libraries**: Create, organize, and reuse your clue collections
- **Game Master & Player Roles**: Flexible permission system
- **Multiple Games**: Host unlimited simultaneous hunts
- **Team Management**: Invite players, assign teams, track progress

### 📚 Clue Library System
- **Personal Collections**: Build reusable libraries of clues
- **Ordering & Organization**: Set clue order within libraries
- **JSON Import/Export**: Share libraries between users
- **Three Clue Types**: Waypoint, Fork, Solo challenges
- **Edit & Reorder**: Modify clues and change sequence anytime

### 📱 Mobile-First Team Experience
- **Dual Upload Options**: Camera or gallery selection
- **Multi-Photo Challenges**: Require 1-10 specific photos per challenge
- **Real-Time Progress**: Visual photo counter and validation
- **Auto-Compression**: Optimize large files automatically
- **Touch-Optimized**: Perfect for phones and tablets

### 🎮 Game Master Tools
- **Photo Review System**: Beautiful gallery view with approval/rejection
- **Mandatory Feedback**: Comment on rejected submissions
- **Team Progress Dashboard**: Real-time status for all teams
- **Clue Sequence Editor**: Drag-and-drop clue ordering
- **Flexible Invitations**: Email or direct user invites

## 📦 Quick Deploy to Vercel

### Prerequisites
1. **GitHub Account** (for OAuth authentication)
2. **Neon PostgreSQL Database** (free tier available)
3. **Vercel Account** (free tier sufficient)

### Deployment Steps

1. **Fork or Clone Repository**
   ```bash
   git clone https://github.com/smw355/thehunt.git
   cd thehunt
   ```

2. **Set Up PostgreSQL Database**
   - Go to [Neon.tech](https://neon.tech) and create free database
   - Copy connection string

3. **Create GitHub OAuth App**
   - Go to GitHub Settings → Developer Settings → OAuth Apps
   - Create New OAuth App:
     - **Homepage URL**: `https://your-app.vercel.app`
     - **Callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
   - Save Client ID and Client Secret

4. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your repository
   - Set environment variables (see below)
   - Click Deploy

### Required Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Database
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://your-app.vercel.app

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Vercel Blob Storage (auto-configured)
BLOB_READ_WRITE_TOKEN=(automatic)
```

## 🎯 Complete User Guide

### 👤 Getting Started

#### 1. Sign Up / Sign In
- Visit your deployed app
- Click "Sign in with GitHub"
- Authorize the application
- You're ready to create games!

#### 2. Create Your First Library
- Go to **Libraries** page
- Click **New Library**
- Name it (e.g., "Downtown Adventure")
- Add description and set public/private
- Start adding clues!

#### 3. Build Your Clue Collection
- Click **+ Add Clue** in your library
- Choose clue type: Waypoint, Fork, or Solo
- Fill in title, content, and photo requirements
- Save and repeat
- Reorder clues using up/down arrows

#### 4. Create a Game
- Go to **Games** page
- Click **Create New Game**
- Enter game name and optional code
- Invite players via email or username
- Add your clue sequence from libraries
- Start the game!

### 🎮 Game Master Workflow

#### Setting Up a Game

1. **Create Game**
   - Name: "Museum Artifact Hunt"
   - Game Code: "MUSEUM" (optional, auto-generated if blank)
   - Click Create

2. **Invite Players**
   - Email invitations to participants
   - Or add by GitHub username
   - Assign role: Game Master or Player

3. **Build Clue Sequence**
   - Go to **Clues** tab in game
   - Select clues from your libraries
   - Add to sequence
   - Reorder with drag controls
   - Save sequence

4. **Create Teams**
   - Go to **Teams** tab
   - Click **Add Team**
   - Name team (e.g., "Team Alpha")
   - Set team password
   - Assign players to teams

5. **Start Game**
   - Review setup
   - Click **Start Game**
   - Teams can now login and begin!

#### Managing Active Games

- **Review Submissions**:
  - View team progress in real-time
  - Check photo galleries
  - Approve/reject with feedback

- **Monitor Progress**:
  - See which clue each team is on
  - Track completion status
  - View submission history

- **Communicate**:
  - Add admin comments to submissions
  - Guide teams with feedback
  - Answer questions via rejection notes

### 📱 Player/Team Workflow

#### Joining a Game

1. **Accept Invitation**
   - Click link in email invite
   - Or navigate to game with code
   - Sign in with GitHub

2. **Team Login**
   - Enter game code
   - Enter team name and password
   - View your first clue!

#### Playing the Hunt

1. **View Current Clue**
   - See clue card with instructions
   - Note required photo count
   - Check clue type (Waypoint/Fork/Solo)

2. **Complete Challenge**
   - Navigate to location
   - Perform task
   - Take required photos

3. **Submit Proof**
   - Click camera button for new photo
   - Or select from gallery
   - Upload required number of photos
   - Add text notes (optional)
   - Click Submit

4. **Handle Feedback**
   - **Approved**: Next clue unlocks automatically
   - **Rejected**: Read admin comments, fix issues, resubmit
   - **Pending**: Wait for review

5. **Finish the Hunt**
   - Complete all clues
   - Celebrate with your team!
   - Check final time

## 📋 Clue Types & Creation

### 1. Waypoint Clues

Standard information clues directing teams to locations.

**Example:**
```json
{
  "type": "waypoint",
  "title": "British Museum Gods Collection",
  "content": [
    "The British conquered much of the world over three centuries.",
    "During that time they discovered many incredible antiquities.",
    "Find and photograph objects depicting each of these five famous gods:",
    "1) Hoa Hakananai'a",
    "2) Isis protecting Osiris",
    "3) Bastet",
    "4) Athena",
    "5) Seated Buddha"
  ],
  "requiredPhotos": 5
}
```

### 2. Fork Clues

Teams choose between two different paths.

**Example:**
```json
{
  "type": "fork",
  "title": "Work It or Walk It",
  "optionA": {
    "title": "Work It",
    "description": "Find a local coffee shop and make a cappuccino for a customer. Take photos of you making it and the happy customer with the finished drink."
  },
  "optionB": {
    "title": "Walk It",
    "description": "Walk to the nearest park and find 5 different types of flowers. Take individual photos of each flower with a team member's hand for scale."
  },
  "requiredPhotos": 3
}
```

### 3. Solo Clues

One team member must be selected before seeing the task.

**Example:**
```json
{
  "type": "solo",
  "title": "Memory Master",
  "question": "Who has the best memory for details?",
  "task": "Study a storefront window display for 2 minutes, then recreate the exact arrangement using items from your backpack. Take a photo of your recreation next to the original.",
  "requiredPhotos": 2
}
```

## 📤 JSON Library Format (Version 2.0)

### Export Format

When you export a library, you get this structure:

```json
{
  "version": "2.0",
  "exportDate": "2025-01-15T10:00:00.000Z",
  "library": {
    "name": "Downtown Adventure",
    "description": "Urban scavenger hunt for teams of 2-4",
    "isPublic": false
  },
  "clues": [
    {
      "type": "waypoint",
      "title": "Central Station Start",
      "content": [
        "Begin at Central Station main entrance.",
        "Find the departure board.",
        "Take a team photo showing the current time."
      ],
      "requiredPhotos": 1
    },
    {
      "type": "fork",
      "title": "Fast or Slow Food",
      "optionA": {
        "title": "Fast Food",
        "description": "Visit a fast food restaurant, order 3 items, photo each item and receipt."
      },
      "optionB": {
        "title": "Slow Food",
        "description": "Find a sit-down restaurant, order appetizer, photo with server and food."
      },
      "requiredPhotos": 4
    },
    {
      "type": "solo",
      "title": "Street Performance",
      "question": "Who's ready to entertain?",
      "task": "Perform for 2 minutes, collect $5 in donations, photo the money and video of performance.",
      "requiredPhotos": 2
    }
  ]
}
```

### Importing Libraries

1. **From Libraries Page**:
   - Click **Import JSON** button
   - Choose file
   - Review preview
   - Confirm import (creates new library)

2. **From Existing Library**:
   - Open library detail page
   - Click import icon in header
   - Clues are added to existing library
   - Maintains order from JSON

## 🎨 Sample Hunt Scenarios

### Museum Treasure Hunt (2-3 hours)

Perfect for educational field trips or cultural adventures.

```json
{
  "version": "2.0",
  "library": {
    "name": "Museum Artifact Quest",
    "description": "Explore world history through famous artifacts"
  },
  "clues": [
    {
      "type": "waypoint",
      "title": "Ancient Egypt Gallery",
      "content": [
        "Navigate to the Ancient Egypt section.",
        "Find the Rosetta Stone.",
        "Take a photo with the stone and read one of the translations aloud.",
        "Find the hieroglyphics chart nearby and take a photo of it."
      ],
      "requiredPhotos": 2
    },
    {
      "type": "fork",
      "title": "Ancient Civilizations Choice",
      "optionA": {
        "title": "Greek Glory",
        "description": "Find 3 Greek artifacts from different time periods (Archaic, Classical, Hellenistic). Photo each with its date label visible."
      },
      "optionB": {
        "title": "Roman Rule",
        "description": "Find 3 Roman artifacts showing daily life (pottery, tools, jewelry). Photo each with descriptive plaques."
      },
      "requiredPhotos": 3
    },
    {
      "type": "solo",
      "title": "Expert Guide Challenge",
      "question": "Who's the best speaker and teacher?",
      "task": "Choose any artifact you've seen today. Give a 2-minute presentation to museum visitors about it. Get 3 people to sign their names confirming they watched. Photo the signatures and video your presentation.",
      "requiredPhotos": 2
    }
  ]
}
```

### Corporate Team Building (Half Day)

Ideal for office teams exploring the neighborhood.

```json
{
  "version": "2.0",
  "library": {
    "name": "Downtown Team Challenge",
    "description": "Corporate team building adventure"
  },
  "clues": [
    {
      "type": "waypoint",
      "title": "Office Neighborhood",
      "content": [
        "Find 5 businesses within 3 blocks of the office.",
        "Take a team photo at each business entrance.",
        "Each photo must include the business sign clearly visible."
      ],
      "requiredPhotos": 5
    },
    {
      "type": "fork",
      "title": "Lunch Rush or Coffee Culture",
      "optionA": {
        "title": "Lunch Rush",
        "description": "Visit 3 different food establishments. Order something small from each. Photo the food, receipt, and team member eating it (9 photos total)."
      },
      "optionB": {
        "title": "Coffee Culture",
        "description": "Find 3 coffee shops. Order different specialty drinks. Rate each shop 1-10. Photo: drink, menu board, rating sign you make (9 photos)."
      },
      "requiredPhotos": 9
    },
    {
      "type": "solo",
      "title": "LinkedIn Network Master",
      "question": "Who's the most professionally connected?",
      "task": "Go to nearby offices and get business cards from 5 people who work at 5 different companies. Take a photo with each person (holding their card) and connect with them on LinkedIn. Screenshot the connection requests.",
      "requiredPhotos": 10
    }
  ]
}
```

### Campus Orientation Hunt (3-4 hours)

Great for new student orientation programs.

```json
{
  "version": "2.0",
  "library": {
    "name": "Campus Discovery Tour",
    "description": "Learn your way around campus"
  },
  "clues": [
    {
      "type": "waypoint",
      "title": "Historic Campus Buildings",
      "content": [
        "Visit these 6 iconic campus landmarks:",
        "1. Main Gate - Find the founding year on the plaque",
        "2. Library - Photo at main entrance",
        "3. Student Union - Find the hours posted",
        "4. Oldest Building - Read cornerstone date",
        "5. Clock Tower - Note the time",
        "6. Sports Stadium - Find capacity number",
        "Each photo must show the team AND the information requested."
      ],
      "requiredPhotos": 6
    },
    {
      "type": "fork",
      "title": "Study Smart or Play Hard",
      "optionA": {
        "title": "Study Smart",
        "description": "Library scavenger hunt: Find a book from your birth year, the oldest book you can access, a thesis by a current professor, a magazine from this month, and a DVD/media item. Photo each with team member holding it."
      },
      "optionB": {
        "title": "Play Hard",
        "description": "Rec center challenges: Shoot 5 free throws (video), do 60-second team plank (video), take photo at pool, try one machine in gym (photo), get staff member signature."
      },
      "requiredPhotos": 5
    },
    {
      "type": "solo",
      "title": "Professor Network",
      "question": "Who's brave enough to approach faculty?",
      "task": "Find a professor in their office during office hours. Introduce yourself, ask about their research, and get them to pose for a photo with you. Get their business card. Write a 3-sentence summary of what they research.",
      "requiredPhotos": 2
    }
  ]
}
```

## 🛠 Development & Customization

### Local Development

```bash
# Clone repository
git clone https://github.com/smw355/thehunt.git
cd thehunt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Database Management

```bash
# Push schema changes to database
npx drizzle-kit push

# Generate migration
npx drizzle-kit generate

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js (OAuth)
- **Storage**: Vercel Blob (photos/videos)
- **UI**: Tailwind CSS
- **Hosting**: Vercel (or any Node.js platform)

### Project Structure

```
app/
├── api/              # API routes
│   ├── auth/         # NextAuth endpoints
│   ├── games/        # Game management
│   ├── libraries/    # Clue libraries
│   ├── clues/        # Clue CRUD
│   └── submissions/  # Photo submissions
├── games/            # Game pages
├── libraries/        # Library pages
├── auth/             # Auth pages
components/           # React components
db/                   # Database schema & config
lib/                  # Utility functions
public/               # Static assets
```

## 🔒 Security Features

- **OAuth Authentication**: Secure GitHub login
- **Session Management**: JWT tokens with NextAuth
- **Database Security**: Parameterized queries prevent SQL injection
- **File Validation**: Type and size limits on uploads
- **Access Control**: Role-based permissions (Game Master / Player)
- **Input Sanitization**: All user inputs validated
- **Environment Variables**: Secrets never committed to code

## 📱 Mobile Features

- **Camera Access**: Direct device camera integration
- **Gallery Selection**: Choose existing photos
- **Image Compression**: Auto-optimize before upload
- **Offline Detection**: Warn when connection lost
- **Touch Gestures**: Optimized for mobile interaction
- **Responsive Design**: Perfect on any screen size
- **PWA Ready**: Add to home screen capability

## 🆘 Troubleshooting

### Authentication Issues

**Can't sign in with GitHub?**
- Verify GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set
- Check callback URL matches in GitHub OAuth app settings
- Ensure NEXTAUTH_URL matches your deployment URL
- Try generating new NEXTAUTH_SECRET

**Session expires immediately?**
- Verify NEXTAUTH_SECRET is set and at least 32 characters
- Check browser allows cookies
- Clear cookies and try again

### Database Issues

**Connection errors?**
- Verify POSTGRES_URL is correct
- Check database is accessible from Vercel
- Ensure SSL mode is enabled (?sslmode=require)
- Test connection with `npx drizzle-kit studio`

**Schema out of sync?**
- Run `npx drizzle-kit push` to update database
- Check for migration errors in console
- Verify all tables exist in database

### Photo Upload Issues

**Photos not uploading?**
- Check BLOB_READ_WRITE_TOKEN is set (auto-configured on Vercel)
- Verify file size under 10MB
- Check internet connection
- Try smaller image resolution

**Photos not displaying?**
- Verify Vercel Blob is enabled in project
- Check browser console for CORS errors
- Ensure URLs are being stored in database

### Game Issues

**Teams can't join game?**
- Verify game status is "active" not "setup"
- Check team password is correct
- Ensure game code is correct (case-sensitive)
- Verify players are invited to game

**Clues not showing?**
- Check clue sequence is saved
- Verify clues are in library
- Ensure game has started
- Check team hasn't been removed

## 🌟 Perfect For

- **Corporate Events**: Team building, retreats, onboarding
- **Education**: Campus tours, field trips, orientations
- **Museums**: Interactive exhibits, educational programs
- **Community**: Neighborhood events, festivals
- **Families**: Reunions, parties, vacations
- **Youth Groups**: Camps, scout activities
- **Conferences**: Ice breakers, networking

## 📞 Support & Contributing

- **Issues**: [GitHub Issues](https://github.com/smw355/thehunt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/smw355/thehunt/discussions)
- **Pull Requests**: Contributions welcome!

## 📄 License

MIT License - feel free to use for personal or commercial projects!

---

## 🏆 Ready to Create Your Hunt!

This platform provides everything you need for professional photo hunt adventures:

✅ **Multi-User Platform** - OAuth login, personal libraries, team management
✅ **Clue Libraries** - Reusable, organized, shareable collections
✅ **Three Clue Types** - Waypoint, Fork, Solo challenges
✅ **Photo Requirements** - Enforce 0-10 specific photos per challenge
✅ **Mobile Optimized** - Camera + gallery with real-time validation
✅ **Game Master Tools** - Photo review, feedback, progress tracking
✅ **Production Ready** - PostgreSQL database, OAuth auth, Vercel hosting

**Start building your hunt today!** 🏁📸🎯
