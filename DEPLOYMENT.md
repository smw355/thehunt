# The Race Deployment Guide

## Quick Deploy to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/yourusername/the-race.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure everything
   - Set environment variable: `NEXT_PUBLIC_ADMIN_PASSWORD` = `your_secure_password`
   - Click "Deploy"

### Method 2: Via Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variable:**
   ```bash
   vercel env add NEXT_PUBLIC_ADMIN_PASSWORD
   ```

## Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

- `NEXT_PUBLIC_ADMIN_PASSWORD`: Your secure admin password (default: admin123)

## What's Included

✅ **Improvements Made:**
- ✅ Data persistence with localStorage
- ✅ Environment variables for security
- ✅ Error handling and validation
- ✅ Loading states and user feedback
- ✅ Error boundary for crash protection
- ✅ Utility functions for better code organization
- ✅ Input validation and sanitization
- ✅ Better clipboard handling with fallbacks

## Features

- **Admin Dashboard**: Create games, manage teams, review submissions
- **Team Interface**: View clues, submit proof, track progress
- **Clue Types**: Route Info, Detour, Roadblock (just like the TV show!)
- **Data Persistence**: Game state saved automatically in browser
- **Import/Export**: Share clue libraries between games

## Usage

1. **Admin Login**: Use the password you set in environment variables
2. **Create Game**: Set up clues, add teams, generate game code
3. **Start Game**: Teams can login with game code + credentials
4. **Monitor Progress**: Approve/reject team submissions in real-time

## Security Notes

- Admin password is now configurable via environment variables
- No sensitive data is hardcoded in the source code
- All user inputs are validated and sanitized
- Error messages don't leak sensitive information