# Multi-User Architecture Implementation Plan
## The Hunt - Complete Feature Analysis & Roadmap

**Status**: Multi-user foundation implemented (v0.3), core features pending
**Current State**: OAuth working, Dashboard accessible, feature pages missing (404s)
**Goal**: Complete multi-user experience with full feature parity to legacy app

---

## 📊 Current Implementation Status

### ✅ Completed (v0.3)
- **Authentication System**
  - NextAuth.js with GitHub OAuth
  - Database session management (JWT)
  - User registration and login flow
  - Session persistence

- **Database Schema**
  - All tables created and migrated
  - Multi-user tables: `users`, `accounts`, `sessions`, `verificationTokens`
  - Game tables: `gameMembers`, `clueLibraries`, `libraryClues`, `gameInvitations`
  - Legacy tables: `games`, `teams`, `clues`, `submissions`, `teamStates`

- **User Interface**
  - Landing page with multi-user branding
  - Sign in/error pages
  - User dashboard (with placeholder links)
  - Feature flag system for gradual rollout
  - Dark mode support throughout

### ❌ Not Implemented (Blocking Usability)
- `/games/create` - Game creation page
- `/libraries` - Clue library management
- `/games/join` - Join game by code
- `/games/[id]` - Individual game management
- All admin/game master functionality
- All player functionality
- Invitation system
- **Platform administration panel**
- **Marketplace for clue libraries/game packs**
- **AI-powered self-guided mode**

---

## 🎯 Complete Legacy App Feature Analysis

### **Admin/Game Master Features** (Single-page app at `/legacy`)

#### 1. **Game Management**
```javascript
// Core Functions:
- handleAdminLogin() - Password-based admin access
- Create game with name + 6-char code
- Generate random game code
- Select clues from library → build clue sequence
- Reorder clues (move up/down in sequence)
- Remove clues from sequence
- Start game (changes status from 'setup' to 'active')
- Reset entire game (all teams to beginning)
- Delete game (with optional photo download)
- Download all game photos as ZIP
```

#### 2. **Team Management**
```javascript
// Core Functions:
- Create team (name + password)
- Edit team (name/password)
- Delete team
- View team progress (current clue / total clues)
- Manual advance team (skip current clue)
- Reset individual team to beginning
- See all teams and their current status
```

#### 3. **Clue Library Management**
```javascript
// Core Functions:
- Create clue (3 types: route-info, detour, road-block)
- Edit existing clue
- Delete clue from library
- Import clues from JSON file (replace or add mode)
- Export clues to JSON file
- View all clues in library with type badges

// Clue Types & Fields:
1. WAYPOINT (route-info):
   - title
   - content[] (array of text lines)
   - requiredPhotos (0-10)

2. FORK (detour):
   - title
   - detourOptionA {title, description}
   - detourOptionB {title, description}
   - requiredPhotos (0-10)

3. SOLO (road-block):
   - title
   - roadblockQuestion (cryptic question)
   - roadblockTask (revealed after player selected)
   - requiredPhotos (0-10)
```

#### 4. **Submission Review**
```javascript
// Core Functions:
- View all pending submissions
- See submission details:
  - Team name
  - Clue details
  - Text proof
  - Notes
  - Photos (gallery view)
  - Detour choice (A or B)
  - Roadblock player name
- Approve submission → advance team to next clue
- Reject submission → require admin comment (mandatory)
- View rejection history for teams
- Track submission timestamps
```

### **Team/Player Features** (Single-page app at `/legacy`)

#### 1. **Login & Session**
```javascript
// Core Functions:
- handleTeamLogin(gameCode, teamName, password)
- Session persistence in localStorage
- Auto-restore on page reload
- Logout function
```

#### 2. **Game Play**
```javascript
// Core Functions:
- View current clue card with styling
- See progress (clue X of Y)
- Handle three clue types differently:

// WAYPOINT flow:
1. See clue content
2. Submit text proof + photos
3. Wait for admin approval

// FORK flow:
1. See both options (A and B)
2. Choose one option
3. Choice is permanent
4. Submit proof for chosen option
5. Wait for admin approval

// SOLO flow:
1. See cryptic question
2. Select player name (typed in)
3. Assignment is permanent
4. Task revealed after player selected
5. Submit proof
6. Wait for admin approval

- PhotoUpload component (camera + gallery)
- Real-time photo counter
- Photo validation (exact count matching requiredPhotos)
- View submission status (pending/approved/rejected)
- See rejection feedback from admin
- Resubmit after rejection
- Completion screen when all clues done
```

### **Shared Features**
```javascript
// Core Functions:
- Real-time data loading from PostgreSQL
- Photo upload to Vercel Blob
- Error boundary for crash prevention
- Dark mode throughout
- Mobile-responsive design
- Loading states
- Form validation
- Confirmation modals for destructive actions
```

---

## 🏗️ Multi-User Architecture Design

### **Key Differences from Legacy**

#### Legacy (Current `/legacy`)
```
Single admin password → controls everything
Teams login with game code + credentials
No user accounts
No persistence across games
Clue library is global/shared
```

#### Multi-User (Target Architecture)
```
OAuth user accounts (GitHub, Google)
User owns/creates games
User invites others as co-game-masters or players
User has personal clue libraries
Games have access control (members only)
Users can be in multiple games with different roles
```

### **User Roles & Permissions**

#### 1. **Global Roles**
- `admin` - Platform administrator (can do anything)
- `user` - Standard user (can create games, libraries)

#### 2. **Game Roles** (per game via `gameMembers` table)
- `game_master` - Can manage game, review submissions, control teams
- `player` - Can join team, submit proofs, play game

#### 3. **Permission Matrix**
```
Action                        | game_master | player
---------------------------------------------------------
Create game                   | ✓ (creator) | ✗
Edit game settings            | ✓           | ✗
Delete game                   | ✓ (creator) | ✗
Invite users to game          | ✓           | ✗
Create/edit teams             | ✓           | ✗
Assign players to teams       | ✓           | ✗
Start/reset game              | ✓           | ✗
Review submissions            | ✓           | ✗
Approve/reject submissions    | ✓           | ✗
Join team                     | ✗           | ✓
View current clue             | ✓ (all)     | ✓ (own team)
Submit proof                  | ✗           | ✓
View team progress            | ✓ (all)     | ✓ (own team)
Create clue library           | ✓           | ✓
Add clues to library          | ✓           | ✓
Use own libraries in game     | ✓           | ✗
Use public libraries in game  | ✓           | ✗
```

---

## 📋 Complete Implementation Checklist

### **Phase 1: Core Navigation & Game Creation** (Priority: CRITICAL)
*Estimated: 8-12 hours*

#### `/games/create` Page
- [ ] Create page file: `app/games/create/page.js`
- [ ] Require authentication (redirect if not logged in)
- [ ] Game creation form:
  - [ ] Game name input
  - [ ] Generate game code button
  - [ ] Manual game code input
  - [ ] Clue selection interface (from user's libraries)
  - [ ] Clue sequencing (drag/drop or up/down buttons)
  - [ ] Save as draft functionality
- [ ] Create game API endpoint enhancements:
  - [ ] Link game to creator (`gameMembers` entry as game_master)
  - [ ] Validate clue ownership/access
  - [ ] Store clue sequence
- [ ] Success flow → redirect to `/games/[id]`

#### `/games/join` Page
- [ ] Create page file: `app/games/join/page.js`
- [ ] Require authentication
- [ ] Game code input form
- [ ] Validate game exists and user has access
- [ ] Show game details (name, game masters)
- [ ] Join as player button
- [ ] Create `gameMembers` entry with role='player'
- [ ] Success flow → redirect to `/games/[id]`

#### `/games/[id]` Page - Initial View
- [ ] Create page file: `app/games/[id]/page.js`
- [ ] Require authentication
- [ ] Fetch game + verify user is member
- [ ] Role-based view:
  - [ ] If game_master → show admin dashboard
  - [ ] If player → show player view
- [ ] Basic game info display (name, code, status)
- [ ] Navigation tabs: Overview | Teams | Clues | Submissions | Settings

---

### **Phase 1A: Basic Admin Panel** (Priority: CRITICAL - MVP)
*Estimated: 4-6 hours*

#### `/admin` Dashboard - Foundation
- [ ] Create page file: `app/admin/page.js`
- [ ] Access control:
  - [ ] Check `session.user.globalRole === 'admin'`
  - [ ] Redirect non-admins to dashboard with error message
  - [ ] Log unauthorized access attempts
- [ ] Admin layout component:
  - [ ] Persistent sidebar navigation
  - [ ] Breadcrumb navigation
  - [ ] User info header (logged in as admin)
  - [ ] Quick stats at top

#### Tab 1: Overview & Platform Stats
- [ ] Platform statistics cards:
  - [ ] Total users (with 7-day/30-day growth)
  - [ ] Total games (by status: setup/active/completed)
  - [ ] Total libraries (public vs private count)
  - [ ] Active sessions right now
  - [ ] Total photos uploaded
- [ ] Recent activity feed (last 50 items):
  - [ ] User registrations
  - [ ] Games created
  - [ ] Games started
  - [ ] Libraries created
  - [ ] Timestamp for each
- [ ] Charts (optional for MVP):
  - [ ] User registration trend (last 30 days)
  - [ ] Games created trend (last 30 days)

#### Tab 2: User Management (Basic)
- [ ] User list table:
  - [ ] Columns: Email, Name, Provider, Global Role, Created, Last Active
  - [ ] Search by email/name
  - [ ] Filter by role (admin/user)
  - [ ] Filter by OAuth provider
  - [ ] Sort by any column
  - [ ] Pagination (50 users per page)
- [ ] User quick actions:
  - [ ] View user details (games, libraries)
  - [ ] Change global role (promote/demote)
  - [ ] Suspend account (set status field)
- [ ] Bulk export:
  - [ ] Export user list to CSV

#### Tab 3: Game Overview (Basic)
- [ ] All games list table:
  - [ ] Columns: Name, Code, Creator, Status, Teams, Players, Created
  - [ ] Search by name/code/creator email
  - [ ] Filter by status
  - [ ] Sort by any column
  - [ ] Pagination (50 games per page)
- [ ] Game quick actions:
  - [ ] View game details
  - [ ] View as observer (see game master view read-only)
  - [ ] Delete game (with confirmation)

#### API Endpoints for Admin
- [ ] GET `/api/admin/stats` - Platform statistics
  - [ ] Verify admin role
  - [ ] Return counts from database
  - [ ] Include growth calculations
- [ ] GET `/api/admin/users` - User list with pagination
  - [ ] Verify admin role
  - [ ] Support search, filter, sort, pagination
  - [ ] Return sanitized user data
- [ ] PUT `/api/admin/users/[id]/role` - Change user role
  - [ ] Verify admin role
  - [ ] Validate role value
  - [ ] Update users table
  - [ ] Log action to audit trail
- [ ] PUT `/api/admin/users/[id]/suspend` - Suspend user
  - [ ] Verify admin role
  - [ ] Update user status
  - [ ] Log action to audit trail
- [ ] GET `/api/admin/games` - All games list
  - [ ] Verify admin role
  - [ ] Support search, filter, sort, pagination
  - [ ] Include creator info
- [ ] DELETE `/api/admin/games/[id]` - Delete game
  - [ ] Verify admin role
  - [ ] Cascade delete or preserve photos (option)
  - [ ] Log action to audit trail
- [ ] GET `/api/admin/activity` - Recent activity feed
  - [ ] Verify admin role
  - [ ] Return recent platform events

#### Audit Logging Foundation
- [ ] Create `adminAuditLogs` table:
  ```javascript
  export const adminAuditLogs = pgTable('admin_audit_logs', {
    id: serial('id').primaryKey(),
    adminUserId: integer('admin_user_id').notNull().references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(), // 'user.role_changed', 'game.deleted', etc.
    targetType: varchar('target_type', { length: 50 }), // 'user', 'game', 'library'
    targetId: integer('target_id'),
    metadata: jsonb('metadata').default({}), // Additional context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  });
  ```
- [ ] Audit logging utility function
- [ ] Log all admin actions automatically

---

### **Phase 2: Clue Library System** (Priority: CRITICAL)
*Estimated: 6-8 hours*

#### `/libraries` Page
- [ ] Create page file: `app/libraries/page.js`
- [ ] Require authentication
- [ ] List user's clue libraries:
  - [ ] Library name
  - [ ] Description
  - [ ] Clue count
  - [ ] Public/Private toggle
  - [ ] Created/updated dates
- [ ] Create new library button + modal
- [ ] Edit library button + modal
- [ ] Delete library with confirmation
- [ ] Click library → navigate to `/libraries/[id]`

#### `/libraries/[id]` Page
- [ ] Create page file: `app/libraries/[id]/page.js`
- [ ] Require authentication + ownership check
- [ ] Library header (name, description, stats)
- [ ] Clue list with type badges (WAYPOINT/FORK/SOLO)
- [ ] Add clue button + full form (all 3 types)
- [ ] Edit clue functionality
- [ ] Delete clue confirmation
- [ ] Import clues from JSON
- [ ] Export clues to JSON
- [ ] Make library public/private toggle

#### API Endpoints for Libraries
- [ ] POST `/api/libraries` - Create library
- [ ] GET `/api/libraries` - List user's libraries
- [ ] GET `/api/libraries/[id]` - Get library details
- [ ] PUT `/api/libraries/[id]` - Update library
- [ ] DELETE `/api/libraries/[id]` - Delete library
- [ ] POST `/api/libraries/[id]/clues` - Add clue to library
- [ ] DELETE `/api/libraries/[id]/clues/[clueId]` - Remove clue

---

### **Phase 2A: Admin Content Oversight** (Priority: CRITICAL - MVP)
*Estimated: 2-3 hours*

#### `/admin/libraries` Tab
- [ ] All libraries list table:
  - [ ] Columns: Name, Owner, Public/Private, Clue Count, Created, Updated
  - [ ] Search by name/owner email
  - [ ] Filter by public/private
  - [ ] Sort by any column
  - [ ] Pagination (50 libraries per page)
- [ ] Library quick actions:
  - [ ] View library details (read-only access to all clues)
  - [ ] Feature/unfeature library (for future marketplace)
  - [ ] Make private (if inappropriate)
  - [ ] Delete library (with confirmation)
- [ ] Content moderation queue (basic):
  - [ ] Flag inappropriate library names
  - [ ] Flag inappropriate clue content
  - [ ] Manual review queue

#### `/admin/clues` Tab
- [ ] All clues list (across all libraries):
  - [ ] Columns: Title, Type, Library, Owner, Created
  - [ ] Search by title/content
  - [ ] Filter by type
  - [ ] Pagination (100 clues per page)
- [ ] Clue quick actions:
  - [ ] View full clue details
  - [ ] Delete clue (with confirmation)

#### API Endpoints
- [ ] GET `/api/admin/libraries` - All libraries list
  - [ ] Verify admin role
  - [ ] Support search, filter, sort, pagination
  - [ ] Include owner info and stats
- [ ] GET `/api/admin/libraries/[id]` - View any library
  - [ ] Verify admin role
  - [ ] Return all clues in library
- [ ] DELETE `/api/admin/libraries/[id]` - Delete any library
  - [ ] Verify admin role
  - [ ] Log action to audit trail
- [ ] PUT `/api/admin/libraries/[id]/visibility` - Force private
  - [ ] Verify admin role
  - [ ] Update isPublic field
  - [ ] Log action to audit trail
- [ ] GET `/api/admin/clues` - All clues list
  - [ ] Verify admin role
  - [ ] Support search, filter, sort, pagination
- [ ] DELETE `/api/admin/clues/[id]` - Delete any clue
  - [ ] Verify admin role
  - [ ] Log action to audit trail

---

### **Phase 3: Game Master Dashboard** (Priority: HIGH)
*Estimated: 12-16 hours*

#### `/games/[id]` - Game Master View

**Tab 1: Overview**
- [ ] Game statistics:
  - [ ] Total teams
  - [ ] Active players
  - [ ] Total clues in sequence
  - [ ] Pending submissions count
  - [ ] Game status (setup/active/completed)
- [ ] Quick actions:
  - [ ] Start game button
  - [ ] Pause game button
  - [ ] Reset all teams button
  - [ ] Delete game button
- [ ] Recent activity feed

**Tab 2: Teams**
- [ ] Team list with:
  - [ ] Team name
  - [ ] Player count
  - [ ] Current clue progress (X / Y)
  - [ ] Status (not started / in progress / completed)
  - [ ] Last active timestamp
- [ ] Create team button + form:
  - [ ] Team name
  - [ ] Team password
  - [ ] Auto-assign players (optional)
- [ ] Edit team (name/password)
- [ ] Delete team confirmation
- [ ] Manual team actions:
  - [ ] Advance team to next clue
  - [ ] Reset team to beginning
  - [ ] View team details
- [ ] Assign players to teams:
  - [ ] List of game members with role='player'
  - [ ] Drag/drop or select interface
  - [ ] Update `gameMembers.teamId`

**Tab 3: Clues**
- [ ] Current clue sequence display
- [ ] Clue cards with type, title, details
- [ ] Reorder clues (up/down or drag/drop)
- [ ] Add clues from libraries:
  - [ ] Browse user's libraries
  - [ ] Browse public libraries
  - [ ] Search/filter clues
  - [ ] Add to sequence button
- [ ] Remove clue from sequence
- [ ] Edit clue details (affects library)
- [ ] Preview clue as player would see it

**Tab 4: Submissions**
- [ ] Filter options:
  - [ ] All / Pending / Approved / Rejected
  - [ ] By team
  - [ ] By clue
- [ ] Submission cards with:
  - [ ] Team name
  - [ ] Clue title and type
  - [ ] Submission timestamp
  - [ ] Status badge
  - [ ] Quick actions (approve/reject)
- [ ] Detailed submission view:
  - [ ] Full clue details
  - [ ] Team's choices (detour/roadblock)
  - [ ] Text proof
  - [ ] Notes
  - [ ] Photo gallery (grid view)
  - [ ] Previous rejection history
  - [ ] Approve button
  - [ ] Reject button (requires comment)
- [ ] Bulk actions:
  - [ ] Select multiple
  - [ ] Approve selected
  - [ ] Download photos

**Tab 5: Settings**
- [ ] Game details:
  - [ ] Edit game name
  - [ ] Change game code
  - [ ] Game description
  - [ ] Set start/end dates (optional)
- [ ] Invite users:
  - [ ] Email input
  - [ ] Role selection (game_master/player)
  - [ ] Generate invite link
  - [ ] Send invitation
  - [ ] View pending invitations
- [ ] Game members list:
  - [ ] Name, email, role
  - [ ] Team assignment (for players)
  - [ ] Remove member button
  - [ ] Change role button
- [ ] Danger zone:
  - [ ] Download all photos (ZIP)
  - [ ] Export game data (JSON)
  - [ ] Archive game
  - [ ] Delete game

---

### **Phase 4: Player Experience** (Priority: HIGH)
*Estimated: 8-12 hours*

#### `/games/[id]` - Player View

**Before Team Assignment**
- [ ] Welcome screen
- [ ] Game details (name, description, game masters)
- [ ] "Waiting for team assignment" message
- [ ] Option to leave game

**After Team Assignment**
- [ ] Team header:
  - [ ] Team name
  - [ ] Team members (other players)
  - [ ] Progress indicator (clue X / Y)
- [ ] Current clue display:
  - [ ] Type-specific rendering
  - [ ] WAYPOINT: content lines
  - [ ] FORK: both options with choose buttons
  - [ ] SOLO: question → player input → task reveal
- [ ] Submission form:
  - [ ] Text proof textarea
  - [ ] Notes textarea (optional)
  - [ ] Photo upload component:
    - [ ] Take photo (camera)
    - [ ] Choose from gallery
    - [ ] Photo counter (X / Y required)
    - [ ] Photo preview grid
    - [ ] Remove photo button
  - [ ] Submit button (disabled if photo count wrong)
- [ ] Submission status:
  - [ ] Pending: "Waiting for admin review"
  - [ ] Approved: "Approved! Next clue unlocked"
  - [ ] Rejected: Show admin comment + resubmit form
- [ ] Rejection history accordion:
  - [ ] Attempt number
  - [ ] Timestamp
  - [ ] Admin comment
  - [ ] Photos from that attempt
- [ ] Completion screen:
  - [ ] Trophy/celebration animation
  - [ ] Final stats
  - [ ] Leaderboard (if applicable)
  - [ ] Share buttons

---

### **Phase 5: Invitation System** (Priority: MEDIUM)
*Estimated: 4-6 hours*

#### Invitation Flow
- [ ] Game master creates invitation:
  - [ ] Enter email or generate link
  - [ ] Select role (game_master/player)
  - [ ] Set expiration (default 7 days)
  - [ ] Generate unique token
  - [ ] Store in `gameInvitations` table
- [ ] Email notification (optional):
  - [ ] Send email with invite link
  - [ ] Include game details
  - [ ] Include expiration date
- [ ] Recipient clicks link:
  - [ ] If not logged in → OAuth flow → return to invite
  - [ ] If logged in → show invitation details
  - [ ] Accept/Decline buttons
- [ ] Accept invitation:
  - [ ] Create `gameMembers` entry
  - [ ] Update invitation status to 'accepted'
  - [ ] Redirect to game page
- [ ] Decline invitation:
  - [ ] Update invitation status to 'declined'
  - [ ] Redirect to dashboard

#### `/invitations/[token]` Page
- [ ] Create page file: `app/invitations/[token]/page.js`
- [ ] Fetch invitation details
- [ ] Show game info, inviter, role
- [ ] Accept/decline interface
- [ ] Handle expired invitations
- [ ] Handle already-accepted invitations

#### API Endpoints
- [ ] POST `/api/invitations` - Create invitation
- [ ] GET `/api/invitations/[token]` - Get invitation details
- [ ] POST `/api/invitations/[token]/accept` - Accept invitation
- [ ] POST `/api/invitations/[token]/decline` - Decline invitation
- [ ] GET `/api/games/[id]/invitations` - List game invitations

---

### **Phase 5A: Admin User Management** (Priority: CRITICAL - MVP)
*Estimated: 3-4 hours*

#### `/admin/users` Tab - Enhanced
- [ ] Extended user actions:
  - [ ] View full user profile with complete activity history
  - [ ] See all games user created (with links)
  - [ ] See all games user is playing (with links)
  - [ ] See all libraries user owns (with links)
  - [ ] View user's storage usage details
- [ ] User account management:
  - [ ] Suspend user account (prevents login)
  - [ ] Reactivate suspended account
  - [ ] Delete user account permanently:
    - [ ] Option: Delete all data
    - [ ] Option: Anonymize data (keep games/libraries)
    - [ ] Option: Transfer ownership to another user
  - [ ] Force logout (invalidate all sessions)
- [ ] User moderation:
  - [ ] Add note to user account (internal only)
  - [ ] Flag user for review
  - [ ] Ban user (stronger than suspend)
  - [ ] View moderation history
- [ ] Bulk user operations:
  - [ ] Suspend multiple users
  - [ ] Delete inactive accounts (30/60/90 days)
  - [ ] Export user data (GDPR compliance)

#### `/admin/support` Tab
- [ ] Support ticket system:
  - [ ] List all user inquiries/bug reports
  - [ ] Filter by status (new/in progress/resolved)
  - [ ] Assign tickets to admin users
  - [ ] Respond to tickets
  - [ ] Mark as resolved
  - [ ] Track response time metrics
- [ ] User feedback collection:
  - [ ] Feature requests
  - [ ] Bug reports
  - [ ] General feedback
  - [ ] Vote/priority system

#### Database Schema Addition
```javascript
// Add status field to users table
export const users = pgTable('users', {
  // ... existing fields
  accountStatus: varchar('account_status', { length: 20 }).default('active'), // 'active', 'suspended', 'banned', 'deleted'
  suspendedAt: timestamp('suspended_at'),
  suspendedReason: text('suspended_reason'),
  adminNotes: text('admin_notes'), // Internal admin notes
});

// Support tickets
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'bug', 'feature', 'question', 'feedback'
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).default('new'), // 'new', 'in_progress', 'resolved', 'closed'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'urgent'
  assignedToAdminId: integer('assigned_to_admin_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  metadata: jsonb('metadata').default({}), // Browser info, URL, etc.
});

// Ticket responses
export const ticketResponses = pgTable('ticket_responses', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  isAdmin: boolean('is_admin').default(false),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### API Endpoints
- [ ] GET `/api/admin/users/[id]/profile` - Full user profile
  - [ ] Verify admin role
  - [ ] Return complete user data with relationships
- [ ] PUT `/api/admin/users/[id]/suspend` - Suspend user
  - [ ] Verify admin role
  - [ ] Update accountStatus to 'suspended'
  - [ ] Invalidate all sessions
  - [ ] Log action to audit trail
- [ ] PUT `/api/admin/users/[id]/reactivate` - Reactivate user
  - [ ] Verify admin role
  - [ ] Update accountStatus to 'active'
  - [ ] Log action to audit trail
- [ ] DELETE `/api/admin/users/[id]` - Delete user permanently
  - [ ] Verify admin role
  - [ ] Handle data deletion/anonymization based on options
  - [ ] Log action to audit trail
- [ ] POST `/api/admin/users/[id]/force-logout` - Invalidate sessions
  - [ ] Verify admin role
  - [ ] Delete all sessions for user
- [ ] GET `/api/admin/support/tickets` - List support tickets
  - [ ] Verify admin role
  - [ ] Support filtering and sorting
- [ ] POST `/api/admin/support/tickets/[id]/respond` - Respond to ticket
  - [ ] Verify admin role
  - [ ] Create ticket response
  - [ ] Update ticket status if needed
- [ ] PUT `/api/admin/support/tickets/[id]/status` - Update ticket status
  - [ ] Verify admin role
  - [ ] Update status field
  - [ ] Set resolvedAt if status is 'resolved'

---

### **Phase 6: Polish & Additional Features** (Priority: LOW)
*Estimated: 6-8 hours*

#### Dashboard Enhancements
- [ ] User stats:
  - [ ] Games created
  - [ ] Games played
  - [ ] Total clues completed
  - [ ] Libraries created
- [ ] Recent games list (with status)
- [ ] Recent activity feed
- [ ] Quick create buttons
- [ ] Search games
- [ ] Filter games by role/status

#### Game Enhancements
- [ ] Real-time updates (polling or websockets)
- [ ] Leaderboard by completion time
- [ ] Team chat/comments
- [ ] Game templates
- [ ] Clone game feature
- [ ] Share game publicly

#### Library Enhancements
- [ ] Browse public libraries
- [ ] Fork public library
- [ ] Rate/review libraries
- [ ] Featured libraries
- [ ] Library categories/tags
- [ ] Search libraries

#### Mobile Optimizations
- [ ] Native share API
- [ ] Install as PWA
- [ ] Offline support
- [ ] Push notifications
- [ ] Better camera handling
- [ ] Geolocation integration

---

### **Phase 6A: Admin Platform Management** (Priority: CRITICAL - MVP)
*Estimated: 3-5 hours*

#### `/admin/settings` Tab
- [ ] Platform configuration management:
  - [ ] Site name and tagline (editable)
  - [ ] Maintenance mode toggle with custom message
  - [ ] Feature flags management UI:
    - [ ] List all feature flags
    - [ ] Enable/disable features for all users
    - [ ] Enable features for specific user emails (beta testing)
    - [ ] Feature rollout percentage
  - [ ] File upload limits:
    - [ ] Max photo size per submission
    - [ ] Max photos per submission
    - [ ] Storage quota per user
    - [ ] Total platform storage limit
- [ ] System settings:
  - [ ] Session timeout duration
  - [ ] Invitation expiration duration
  - [ ] Game code length (4-8 characters)
  - [ ] Rate limiting settings per endpoint

#### `/admin/logs` Tab
- [ ] Admin audit log viewer:
  - [ ] All admin actions with timestamps
  - [ ] Filter by admin user
  - [ ] Filter by action type
  - [ ] Filter by date range
  - [ ] Export to CSV
- [ ] System error logs:
  - [ ] API errors (last 7 days)
  - [ ] Failed OAuth attempts
  - [ ] Database errors
  - [ ] Upload failures
  - [ ] Group by error type
  - [ ] View stack traces
- [ ] Performance metrics:
  - [ ] Average API response times
  - [ ] Slowest endpoints (with examples)
  - [ ] Database query performance
  - [ ] Vercel Blob upload/download speeds

#### `/admin/analytics` Tab (Extended)
- [ ] Enhanced platform analytics:
  - [ ] User growth chart (daily/weekly/monthly)
  - [ ] Game creation trends
  - [ ] Most active users (by games created/played)
  - [ ] Most popular clue types
  - [ ] Average game duration
  - [ ] Submission approval rates
  - [ ] Photo upload volume over time
  - [ ] Storage usage trends
- [ ] Cohort analysis:
  - [ ] User retention by registration date
  - [ ] First-week engagement metrics
  - [ ] Power user identification (top 10%)
- [ ] Export all analytics data

#### Platform Settings Database
```javascript
// Platform configuration table
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  valueType: varchar('value_type', { length: 20 }).notNull(), // 'string', 'number', 'boolean', 'json'
  description: text('description'),
  category: varchar('category', { length: 50 }), // 'general', 'security', 'storage', 'features'
  updatedBy: integer('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Feature flags table
export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  flagKey: varchar('flag_key', { length: 100 }).notNull().unique(),
  flagName: varchar('flag_name', { length: 255 }).notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').default(false),
  rolloutPercentage: integer('rollout_percentage').default(0), // 0-100
  enabledForEmails: jsonb('enabled_for_emails').default([]), // Array of email addresses
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// System error logs
export const errorLogs = pgTable('error_logs', {
  id: serial('id').primaryKey(),
  errorType: varchar('error_type', { length: 100 }).notNull(), // 'api', 'database', 'auth', 'upload'
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  endpoint: varchar('endpoint', { length: 255 }),
  method: varchar('method', { length: 10 }), // GET, POST, etc.
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default({}), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### API Endpoints
- [ ] GET `/api/admin/settings` - Get all platform settings
  - [ ] Verify admin role
  - [ ] Return categorized settings
- [ ] PUT `/api/admin/settings/[key]` - Update setting
  - [ ] Verify admin role
  - [ ] Validate value based on type
  - [ ] Log change to audit trail
- [ ] GET `/api/admin/feature-flags` - List feature flags
  - [ ] Verify admin role
  - [ ] Return all flags with status
- [ ] PUT `/api/admin/feature-flags/[key]` - Update feature flag
  - [ ] Verify admin role
  - [ ] Update flag configuration
  - [ ] Log change to audit trail
- [ ] GET `/api/admin/logs/audit` - Get audit logs
  - [ ] Verify admin role
  - [ ] Support pagination and filtering
- [ ] GET `/api/admin/logs/errors` - Get error logs
  - [ ] Verify admin role
  - [ ] Support pagination and filtering
  - [ ] Group by error type option
- [ ] GET `/api/admin/analytics/advanced` - Advanced analytics
  - [ ] Verify admin role
  - [ ] Return detailed metrics
  - [ ] Support date range filtering
- [ ] POST `/api/admin/maintenance` - Toggle maintenance mode
  - [ ] Verify admin role
  - [ ] Enable/disable with custom message
  - [ ] Log action to audit trail

#### Middleware for Admin Features
- [ ] Create maintenance mode middleware:
  - [ ] Check if maintenance mode is enabled
  - [ ] Allow admins to bypass
  - [ ] Show maintenance page to others
- [ ] Create feature flag middleware:
  - [ ] Check if feature is enabled for current user
  - [ ] Handle percentage-based rollouts
  - [ ] Return 403 if feature not enabled
- [ ] Error logging middleware:
  - [ ] Automatically log all API errors
  - [ ] Capture user context
  - [ ] Sanitize sensitive data

---

## 🔄 Migration Strategy

### **Approach: Parallel Modes**

Keep both modes running side-by-side:
1. **Legacy Mode** (`/legacy`) - Fully functional today
2. **Multi-User Mode** (new pages) - Rolled out progressively

### **Migration Path**

**Option A: Gradual (Recommended)**
```
1. Implement Phases 1-2 (Games + Libraries)
2. Enable for beta testers via feature flag
3. Gather feedback, iterate
4. Implement Phase 3 (Game Master)
5. Enable for more users
6. Implement Phase 4 (Player)
7. Full rollout
8. Keep legacy mode as "Quick Game" option
```

**Option B: Full Build**
```
1. Implement all phases (1-5)
2. Extensive testing
3. Single big launch
4. Deprecate legacy mode after 1 month
```

---

## 📐 Component Architecture

### **Reusable Components to Create**

```javascript
// Layout Components
<AuthenticatedLayout>        // Wraps all logged-in pages
<GameLayout>                  // Wraps game pages with role-based nav
<LibraryLayout>               // Wraps library pages

// Game Components
<GameCard>                    // Display game summary
<GameHeader>                  // Game name, code, status
<GameStats>                   // Statistics panel
<GameInviteModal>             // Invite users dialog
<GameSettingsForm>            // Game settings editor

// Clue Components
<ClueCard>                    // Display clue (all types)
<ClueForm>                    // Create/edit clue (all types)
<ClueSequenceEditor>          // Drag/drop clue ordering
<ClueSelector>                // Browse and add clues
<ClueLibraryCard>             // Display library summary

// Team Components
<TeamCard>                    // Display team summary
<TeamForm>                    // Create/edit team
<TeamProgressBar>             // Visual progress indicator
<TeamMemberList>              // List of players
<PlayerAssignment>            // Assign players to teams

// Submission Components
<SubmissionCard>              // Display submission summary
<SubmissionDetails>           // Full submission view
<SubmissionPhotoGallery>      // Photo grid
<SubmissionReviewForm>        // Approve/reject interface
<SubmissionHistory>           // Past attempts

// Shared Components
<PhotoUpload>                 // Already exists, reuse
<LoadingSpinner>              // Already exists, reuse
<ErrorBoundary>               // Already exists, reuse
<ConfirmDialog>               // Confirmation modals
<Toast>                       // Success/error notifications
```

---

## 🎨 UI/UX Considerations

### **Consistent Design System**
- Continue using Tailwind CSS
- Maintain dark mode support
- Use existing color palette (primary, secondary, accent-green)
- Keep mobile-first responsive design
- Use Lucide icons consistently

### **Navigation Structure**
```
Dashboard
├── My Games
│   ├── Games I Created (game_master)
│   └── Games I'm Playing (player)
├── My Libraries
│   ├── Personal Libraries
│   └── Public Libraries
├── Invitations
│   ├── Pending Invites
│   └── Send Invitation
└── Profile Settings

Individual Game
├── Overview (stats, quick actions)
├── Teams (for game_masters)
├── Clues (sequence editor for game_masters)
├── Submissions (review for game_masters)
├── Play (for players)
└── Settings (invite, members, danger zone)
```

### **Responsive Breakpoints**
```css
/* Mobile-first approach */
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small desktops
xl: 1280px  // Large desktops
```

---

## 🔐 Security Considerations

### **Authentication & Authorization**
- [ ] Verify session on every API route
- [ ] Check game membership before showing data
- [ ] Verify role (game_master/player) for actions
- [ ] Use row-level security mindset
- [ ] Rate limit API endpoints
- [ ] Sanitize all user inputs
- [ ] Validate file uploads (type, size)

### **Data Privacy**
- [ ] Users only see games they're members of
- [ ] Players only see own team data
- [ ] Game masters see all teams in their games
- [ ] Private libraries only visible to owner
- [ ] Public libraries visible to all authenticated users

---

## 🧪 Testing Strategy

### **Unit Tests**
- [ ] API route handlers
- [ ] Database queries
- [ ] Form validation logic
- [ ] Permission checks

### **Integration Tests**
- [ ] Complete user flows:
  - [ ] Sign up → create game → invite player → play → complete
  - [ ] Create library → add clues → use in game
  - [ ] Submit proof → review → approve/reject

### **Manual Testing Checklist**
- [ ] Create account via GitHub OAuth
- [ ] Create personal clue library
- [ ] Add all 3 clue types
- [ ] Create game with library clues
- [ ] Invite another user as player
- [ ] Assign player to team
- [ ] Start game
- [ ] Submit proofs as player
- [ ] Review and approve/reject as game master
- [ ] Complete game as player
- [ ] Export/import clue libraries
- [ ] Delete game

---

## 📊 Database Modifications Needed

### **Schema Updates**
```javascript
// Add createdBy to games table
export const games = pgTable('games', {
  // ... existing fields
  createdBy: integer('created_by').notNull().references(() => users.id),
});

// Add userId to clueLibraries (already exists ✓)
// Add userId to clues for ownership tracking
export const clues = pgTable('clues', {
  // ... existing fields
  userId: integer('user_id').references(() => users.id), // null = legacy clue
  libraryId: integer('library_id').references(() => clueLibraries.id),
});
```

### **Indexes to Add**
```sql
-- Performance indexes
CREATE INDEX idx_game_members_user_id ON game_members(user_id);
CREATE INDEX idx_game_members_game_id ON game_members(game_id);
CREATE INDEX idx_clue_libraries_user_id ON clue_libraries(user_id);
CREATE INDEX idx_library_clues_library_id ON library_clues(library_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_game_invitations_token ON game_invitations(invite_token);
```

---

## 📈 MVP Effort Estimate (Core Platform + Admin)

### **Total Time: 56-78 hours**

| Phase | Description | Hours |
|-------|-------------|-------|
| Phase 1 | Navigation & Game Creation | 8-12 |
| Phase 1A | **Basic Admin Panel** | 4-6 |
| Phase 2 | Clue Library System | 6-8 |
| Phase 2A | **Admin Content Oversight** | 2-3 |
| Phase 3 | Game Master Dashboard | 12-16 |
| Phase 4 | Player Experience | 8-12 |
| Phase 5 | Invitation System | 4-6 |
| Phase 5A | **Admin User Management** | 3-4 |
| Phase 6 | Polish & Extras | 6-8 |
| Phase 6A | **Admin Platform Management** | 3-5 |

### **Breakdown by Role**
- **Developer**: 48-66 hours (core + admin implementation)
- **Testing/QA**: 4-6 hours
- **Design/UX**: 2-4 hours (refinement)
- **Documentation**: 2-4 hours

---

## 🚀 Recommended Approach (Revised)

### **Sprint 1: MVP Foundation with Admin (20-26 hours)**
Focus on minimum viable product with essential admin tools:
- ✅ Phase 1: Game creation + joining
- ✅ **Phase 1A: Basic admin panel (overview, user list, game list)**
- ✅ Phase 2: Clue libraries
- ✅ **Phase 2A: Admin can view/moderate all libraries**
- 🔄 Basic game master view (simplified Phase 3)
- 🔄 Basic player view (simplified Phase 4)

**Goal**: Users can create game, add clues, invite players, and complete one full game. Admins can monitor platform health and moderate content.

### **Sprint 2: Full Feature Parity (16-22 hours)**
Complete all legacy features in multi-user context:
- ✅ Full game master dashboard (complete Phase 3)
- ✅ Full player experience (complete Phase 4)
- ✅ Submission review workflow
- ✅ Team management

**Goal**: Feature parity with legacy app

### **Sprint 3: Multi-User Polish + Complete Admin (15-25 hours)**
Add multi-user specific features and complete admin functionality:
- ✅ Invitation system (Phase 5)
- ✅ **Phase 5A: Admin user management (roles, suspension, deletion)**
- ✅ Dashboard enhancements (Phase 6)
- ✅ **Phase 6A: Admin platform settings, logs, analytics**
- ✅ Testing and bug fixes

**Goal**: Production-ready multi-user platform with complete administrative oversight

---

## 🎯 Success Criteria

### **Phase 1 Success**
- [ ] User can create game from dashboard
- [ ] User can add clues from their libraries
- [ ] User can generate shareable game code
- [ ] Another user can join via game code
- [ ] Both users see the game in their dashboard

### **Phase 2 Success**
- [ ] User can create personal clue library
- [ ] User can add all 3 clue types
- [ ] User can import/export clue library
- [ ] User can use library clues when creating games

### **Complete Platform Success**
- [ ] Game master can run full game from creation to completion
- [ ] Players can complete game from start to finish
- [ ] All legacy features working in multi-user context
- [ ] Zero data loss during gameplay
- [ ] Mobile experience is smooth and intuitive
- [ ] Load times < 2 seconds
- [ ] No critical bugs reported in testing

---

## 📝 Notes & Decisions

### **Architectural Decisions**

**1. Keep or Replace Legacy Mode?**
- **Recommendation**: Keep as "Quick Game" option
- **Reasoning**:
  - Valuable for demo/testing
  - Useful for users who want simple, no-login games
  - Can serve as backup if multi-user has issues

**2. Clue Ownership Model**
- **Decision**: Clues belong to libraries, libraries belong to users
- **Reasoning**: Allows for personal + public library ecosystem

**3. Team vs. Individual Players**
- **Decision**: Keep team-based model from legacy
- **Reasoning**: Core mechanic of the platform, changing would be major redesign

**4. Real-time Updates**
- **Decision**: Start with polling, add websockets later if needed
- **Reasoning**: Simpler to implement, good enough for most use cases

---

## 🔄 Migration from Legacy

### **For Existing Games**
```javascript
// Migration script needed:
// 1. Create default "legacy" user
// 2. Assign all existing games to this user as game_master
// 3. Create default "legacy" clue library
// 4. Move all existing clues to this library
// 5. Keep legacy URL working as-is
```

### **User Communication**
- [ ] Announcement: New multi-user mode available
- [ ] Guide: How to migrate from legacy to new mode
- [ ] FAQs: What's different, what stays the same
- [ ] Support: Help users transition smoothly

---

---

## 🆕 NEW PHASES: Advanced Platform Features

### **Phase 7: Platform Administration Panel** (Priority: MEDIUM)
*Estimated: 12-16 hours*

#### Overview
Global administrators need comprehensive tools to manage the platform, monitor usage, moderate content, and support users. This admin panel provides oversight without interfering with individual games.

#### `/admin` Dashboard

**Tab 1: Overview & Analytics**
- [ ] Platform statistics:
  - [ ] Total users (with growth chart)
  - [ ] Total games (active/completed/archived)
  - [ ] Total libraries (public/private)
  - [ ] Total clues in platform
  - [ ] Active sessions/players right now
  - [ ] Storage used (photos/videos)
  - [ ] Monthly active users (MAU)
- [ ] Recent activity timeline:
  - [ ] New user registrations
  - [ ] Games created
  - [ ] Games completed
  - [ ] Libraries published
- [ ] Top content creators (most games, most libraries, most clues)
- [ ] Platform health indicators:
  - [ ] Average game completion rate
  - [ ] Average photos per game
  - [ ] Average clues per game
  - [ ] API response times

**Tab 2: User Management**
- [ ] User list with search/filter:
  - [ ] Email, name, OAuth provider
  - [ ] Global role (admin/user)
  - [ ] Registration date
  - [ ] Last active date
  - [ ] Games created count
  - [ ] Games played count
  - [ ] Storage used
- [ ] User actions:
  - [ ] View user profile
  - [ ] Change global role (promote to admin)
  - [ ] Suspend user account
  - [ ] Delete user account (with data handling options)
  - [ ] Reset user password (if applicable)
  - [ ] View user's games
  - [ ] View user's libraries
- [ ] Bulk actions:
  - [ ] Export user list (CSV)
  - [ ] Send announcement email
  - [ ] Apply role changes

**Tab 3: Content Moderation**
- [ ] Flagged content queue:
  - [ ] Reported games
  - [ ] Reported libraries
  - [ ] Reported photos/submissions
  - [ ] Inappropriate clue content
- [ ] Review interface:
  - [ ] Content preview
  - [ ] Reporter details
  - [ ] Reason for report
  - [ ] Actions: Approve/Remove/Ban Creator
- [ ] Public libraries moderation:
  - [ ] Pending approval queue
  - [ ] Approve/reject public library requests
  - [ ] Feature library (show on marketplace)
  - [ ] Unfeature library
  - [ ] Remove from marketplace
- [ ] Photo/content filters:
  - [ ] AI-based inappropriate content detection (optional)
  - [ ] Manual review queue
  - [ ] Bulk delete flagged content

**Tab 4: Game Management**
- [ ] All games list:
  - [ ] Search by name, code, creator
  - [ ] Filter by status (setup/active/completed)
  - [ ] View game details
  - [ ] View game master
  - [ ] View players
  - [ ] Game stats (teams, clues, submissions)
- [ ] Game actions:
  - [ ] View game as observer
  - [ ] Force stop game
  - [ ] Archive game
  - [ ] Delete game (with photo preservation)
  - [ ] Transfer ownership
- [ ] Bulk operations:
  - [ ] Export game data
  - [ ] Archive old completed games
  - [ ] Delete abandoned games

**Tab 5: Library & Marketplace Management**
- [ ] All libraries list:
  - [ ] Owner name
  - [ ] Library name
  - [ ] Clue count
  - [ ] Public/private status
  - [ ] Featured status
  - [ ] Downloads/usage count
  - [ ] Rating (if applicable)
- [ ] Library actions:
  - [ ] Preview library
  - [ ] Feature on marketplace
  - [ ] Remove from marketplace
  - [ ] Transfer ownership
  - [ ] Delete library
- [ ] Curated collections:
  - [ ] Create featured collection
  - [ ] Add libraries to collection
  - [ ] Set collection order
  - [ ] Publish collection

**Tab 6: System Settings**
- [ ] Platform configuration:
  - [ ] Site name and branding
  - [ ] Maintenance mode toggle
  - [ ] Feature flags management
  - [ ] OAuth provider settings
  - [ ] Storage limits per user
  - [ ] Max photos per submission
  - [ ] Max file size limits
- [ ] Email settings:
  - [ ] SMTP configuration
  - [ ] Email templates
  - [ ] Notification settings
- [ ] Security settings:
  - [ ] Rate limiting configuration
  - [ ] Session timeout settings
  - [ ] API key management
  - [ ] Webhook configurations
- [ ] Backup & maintenance:
  - [ ] Trigger database backup
  - [ ] Download backup
  - [ ] View backup history
  - [ ] Database statistics

**Tab 7: Support & Logs**
- [ ] Support tickets/inquiries:
  - [ ] User-submitted feedback
  - [ ] Bug reports
  - [ ] Feature requests
  - [ ] Status tracking (new/in progress/resolved)
- [ ] Activity logs:
  - [ ] Admin actions log
  - [ ] Failed login attempts
  - [ ] API errors
  - [ ] Critical events
- [ ] System health:
  - [ ] Database performance metrics
  - [ ] API endpoint response times
  - [ ] Error rate monitoring
  - [ ] Storage usage trends

#### Access Control
- [ ] Only users with `globalRole='admin'` can access `/admin`
- [ ] Audit log for all admin actions
- [ ] Multi-factor authentication for admin accounts (optional)
- [ ] Admin activity notifications

#### API Endpoints
- [ ] GET `/api/admin/stats` - Platform statistics
- [ ] GET `/api/admin/users` - User management
- [ ] PUT `/api/admin/users/[id]/role` - Change user role
- [ ] DELETE `/api/admin/users/[id]` - Delete user
- [ ] GET `/api/admin/games` - All games
- [ ] GET `/api/admin/libraries` - All libraries
- [ ] POST `/api/admin/libraries/[id]/feature` - Feature library
- [ ] GET `/api/admin/reports` - Flagged content
- [ ] POST `/api/admin/reports/[id]/resolve` - Resolve report
- [ ] GET `/api/admin/logs` - Activity logs
- [ ] POST `/api/admin/settings` - Update platform settings

---

### **Phase 8: Clue Library Marketplace** (Priority: HIGH)
*Estimated: 16-20 hours*

#### Overview
Create a thriving ecosystem where users can discover, share, and play amazing treasure hunts created by the community. Enables content creators to build reputation and helps players find quality experiences.

#### `/marketplace` Main Page

**Hero Section**
- [ ] Featured game packs carousel:
  - [ ] High-quality images
  - [ ] Pack name, creator, rating
  - [ ] "Play Now" button
  - [ ] Category badges
- [ ] Search bar (by location, theme, difficulty)
- [ ] Quick filters: Popular, New, Top Rated, Free

**Browse Categories**
- [ ] Category cards:
  - [ ] 🏛️ Museums & Cultural Sites
  - [ ] 🏙️ City Adventures
  - [ ] 🏫 Educational & Campus
  - [ ] 🏢 Corporate Team Building
  - [ ] 🎉 Party & Events
  - [ ] 🌳 Nature & Parks
  - [ ] 🧩 Puzzle & Mystery
  - [ ] 👨‍👩‍👧‍👦 Family Friendly
  - [ ] 🎭 Themed Adventures
  - [ ] 🌍 Travel & Tourism

**Sorting & Filtering**
- [ ] Sort by:
  - [ ] Most Popular
  - [ ] Highest Rated
  - [ ] Newest
  - [ ] Most Downloaded
  - [ ] Price (if applicable)
- [ ] Filter by:
  - [ ] Duration (30min, 1-2hrs, 2-4hrs, 4+ hrs)
  - [ ] Difficulty (Easy, Medium, Hard)
  - [ ] Team size (2-5, 6-10, 11+ players)
  - [ ] Location (City/Country/Generic)
  - [ ] Language
  - [ ] Creator
  - [ ] Free/Paid

**Library Pack Cards**
- [ ] Display:
  - [ ] Cover image
  - [ ] Pack name
  - [ ] Creator name + avatar
  - [ ] Short description
  - [ ] Category badges
  - [ ] Star rating (average)
  - [ ] Download/usage count
  - [ ] Clue count
  - [ ] Estimated duration
  - [ ] Difficulty indicator
- [ ] Actions:
  - [ ] Preview button
  - [ ] Add to collection button
  - [ ] Download/Install button
  - [ ] Share button

#### `/marketplace/[libraryId]` - Library Detail Page

**Header**
- [ ] Large hero image
- [ ] Library name
- [ ] Creator info (name, avatar, profile link)
- [ ] Star rating with review count
- [ ] Primary CTA: "Use This Pack" / "Download"
- [ ] Secondary actions: Share, Report, Favorite
- [ ] Usage statistics:
  - [ ] Times downloaded
  - [ ] Times played
  - [ ] Average completion rate

**Description**
- [ ] Long-form description
- [ ] What's included (clue count by type)
- [ ] Recommended locations (if location-specific)
- [ ] Equipment needed
- [ ] Ideal group size
- [ ] Difficulty level explanation
- [ ] Estimated completion time
- [ ] Language(s) available
- [ ] Creator notes

**Clue Preview**
- [ ] Sample clues (2-3 clues visible):
  - [ ] Clue type badge
  - [ ] Clue title
  - [ ] Partial content (teaser)
  - [ ] Photo requirements
- [ ] "See all clues" button (after download/install)

**Reviews & Ratings**
- [ ] Overall rating breakdown (5★, 4★, 3★, etc.)
- [ ] Review list:
  - [ ] Reviewer name + avatar
  - [ ] Star rating
  - [ ] Review text
  - [ ] Photos from their playthrough (optional)
  - [ ] Date played
  - [ ] Helpful votes
- [ ] Write a review (if user has played)
- [ ] Sort reviews: Most recent, Highest rated, Most helpful

**Similar Packs**
- [ ] Recommendations based on:
  - [ ] Same category
  - [ ] Same creator
  - [ ] Similar location
  - [ ] Users who downloaded this also downloaded...

**Creator Profile Section**
- [ ] Creator bio
- [ ] Total packs created
- [ ] Total downloads
- [ ] Average rating across all packs
- [ ] Link to creator's profile
- [ ] "More from this creator" carousel

#### `/marketplace/creators` - Creator Directory

**Top Creators**
- [ ] Leaderboard by:
  - [ ] Most popular creators
  - [ ] Highest-rated creators
  - [ ] Most prolific creators
  - [ ] Trending creators
- [ ] Creator cards:
  - [ ] Avatar, name, bio
  - [ ] Pack count
  - [ ] Total downloads
  - [ ] Average rating
  - [ ] Follow button

#### `/profile/[userId]` - Creator Public Profile

**Profile Header**
- [ ] Cover photo
- [ ] Avatar
- [ ] Name
- [ ] Bio/description
- [ ] Location (optional)
- [ ] Social links (optional)
- [ ] Follow button
- [ ] Stats:
  - [ ] Packs created
  - [ ] Total downloads
  - [ ] Average rating
  - [ ] Followers count

**Published Packs**
- [ ] Grid of library pack cards
- [ ] Filter by category
- [ ] Sort by popularity/date

**Reviews Received**
- [ ] Recent reviews on creator's packs
- [ ] Overall creator rating

**About**
- [ ] Creator story
- [ ] Specialties
- [ ] Contact info (if public)

#### Publishing Workflow

**Make Library Public**
1. [ ] User selects "Publish to Marketplace" from library settings
2. [ ] Publishing form:
   - [ ] Cover image upload (required)
   - [ ] Long description (required)
   - [ ] Categories (select up to 3)
   - [ ] Tags (location, theme, etc.)
   - [ ] Difficulty level
   - [ ] Estimated duration
   - [ ] Ideal group size
   - [ ] Location specificity (generic/city/specific)
   - [ ] Language
   - [ ] Terms: Content guidelines, licensing
3. [ ] Preview before publishing
4. [ ] Submit for review (admin approval if needed)
5. [ ] Publish immediately or schedule

**Analytics for Creators**
- [ ] Dashboard showing:
  - [ ] Views per pack
  - [ ] Downloads per pack
  - [ ] Rating trends
  - [ ] Review summary
  - [ ] Top performing packs
  - [ ] Geographic distribution of players
- [ ] Export analytics data

#### Monetization (Future Phase)
*Optional - Foundation for later implementation*
- [ ] Database schema for pricing:
  - [ ] Free/Paid status
  - [ ] Price field
  - [ ] Revenue tracking
- [ ] Payment integration (Stripe/similar):
  - [ ] One-time purchase
  - [ ] Pay-what-you-want
- [ ] Creator payouts:
  - [ ] Payment dashboard
  - [ ] Payout history
  - [ ] Tax information collection
- [ ] Revenue share model (platform fee)

#### Community Features
- [ ] Following system:
  - [ ] Follow creators
  - [ ] Notifications for new packs
- [ ] Collections:
  - [ ] Users create curated collections
  - [ ] "Best of" lists
  - [ ] Seasonal collections
- [ ] Discussions:
  - [ ] Comments on library packs
  - [ ] Questions for creator
  - [ ] Play tips from community

#### Database Schema Additions
```javascript
// Add marketplace-specific fields to clueLibraries table
export const clueLibraries = pgTable('clue_libraries', {
  // ... existing fields
  coverImage: text('cover_image'), // URL to cover image
  longDescription: text('long_description'),
  categories: jsonb('categories').default([]), // Array of category strings
  tags: jsonb('tags').default([]), // Array of tag strings
  difficulty: varchar('difficulty', { length: 20 }), // 'easy', 'medium', 'hard'
  estimatedDuration: integer('estimated_duration'), // minutes
  idealGroupSize: varchar('ideal_group_size', { length: 50 }), // '2-5', '6-10', etc.
  locationSpecificity: varchar('location_specificity', { length: 50 }), // 'generic', 'city', 'specific'
  languages: jsonb('languages').default([]), // Array of language codes
  downloadCount: integer('download_count').default(0),
  usageCount: integer('usage_count').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count').default(0),
  featured: boolean('featured').default(false),
  publishedAt: timestamp('published_at'),
  marketplaceStatus: varchar('marketplace_status', { length: 20 }).default('private'), // 'private', 'pending', 'published', 'archived'
});

// Reviews table
export const libraryReviews = pgTable('library_reviews', {
  id: serial('id').primaryKey(),
  libraryId: integer('library_id').notNull().references(() => clueLibraries.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  reviewText: text('review_text'),
  photos: jsonb('photos').default([]), // Optional photos from playthrough
  helpful_count: integer('helpful_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Following system
export const userFollows = pgTable('user_follows', {
  id: serial('id').primaryKey(),
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User collections (curated lists)
export const userCollections = pgTable('user_collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Collection items
export const collectionItems = pgTable('collection_items', {
  id: serial('id').primaryKey(),
  collectionId: integer('collection_id').notNull().references(() => userCollections.id, { onDelete: 'cascade' }),
  libraryId: integer('library_id').notNull().references(() => clueLibraries.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').default(0),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});
```

#### API Endpoints
- [ ] GET `/api/marketplace` - Browse marketplace
- [ ] GET `/api/marketplace/featured` - Featured packs
- [ ] GET `/api/marketplace/categories` - Category list
- [ ] GET `/api/marketplace/search` - Search packs
- [ ] GET `/api/marketplace/[libraryId]` - Pack details
- [ ] POST `/api/marketplace/[libraryId]/download` - Track download
- [ ] POST `/api/marketplace/[libraryId]/use` - Track usage
- [ ] GET `/api/marketplace/[libraryId]/reviews` - Get reviews
- [ ] POST `/api/marketplace/[libraryId]/reviews` - Submit review
- [ ] POST `/api/marketplace/[libraryId]/report` - Report content
- [ ] GET `/api/marketplace/creators` - Creator directory
- [ ] GET `/api/marketplace/creators/[userId]` - Creator profile
- [ ] POST `/api/marketplace/creators/[userId]/follow` - Follow creator
- [ ] GET `/api/marketplace/my-analytics` - Creator analytics
- [ ] POST `/api/libraries/[id]/publish` - Publish to marketplace
- [ ] POST `/api/libraries/[id]/unpublish` - Remove from marketplace

---

### **Phase 9: AI-Powered Self-Guided Mode** (Priority: FUTURE)
*Estimated: 20-30 hours*

#### Overview
Revolutionary feature that allows players to enjoy treasure hunts without a human game master. An AI agent acts as the game master, reviewing photo submissions, providing feedback, and adapting the experience in real-time using LLM technology.

#### Core Concept

**The Problem It Solves**
- Travelers want to experience curated treasure hunts but don't have a game master
- Users discover great game packs in marketplace but no one to run them
- Families/groups want instant play without setup time
- Solo travelers want guided exploration experiences

**The Solution**
- AI Game Master powered by Claude/GPT-4 Vision
- Automated photo verification using computer vision
- Dynamic hint system
- Natural language feedback
- Adaptive difficulty based on player performance

#### User Flow

**Starting Self-Guided Game**
1. [ ] Player browses marketplace
2. [ ] Sees "AI Self-Guided" badge on compatible packs
3. [ ] Clicks "Play with AI Game Master"
4. [ ] AI introduction:
   - [ ] Greeting message
   - [ ] Explanation of AI features
   - [ ] Difficulty selection (forgiving/standard/strict)
   - [ ] Language preference
5. [ ] Game begins immediately (no teams, no setup)

**During Gameplay**
- [ ] AI presents clues with personality/style
- [ ] Player submits photos
- [ ] AI analyzes photos in real-time:
  - [ ] Computer vision checks for required elements
  - [ ] LLM evaluates context and accuracy
  - [ ] Provides natural language feedback
- [ ] Dynamic hint system:
  - [ ] Player can request hints
  - [ ] AI provides contextual hints
  - [ ] Tracks hint usage for scoring
- [ ] Adaptive difficulty:
  - [ ] If player struggling → easier feedback
  - [ ] If player excelling → more challenging clues
  - [ ] Learns from player's style

**Completion**
- [ ] AI congratulates player
- [ ] Personalized summary:
  - [ ] Completion time
  - [ ] Photos evaluated
  - [ ] Hints used
  - [ ] Fun moments/highlights
  - [ ] Recommendations for next hunt
- [ ] Share completion certificate

#### Technical Implementation

**AI Game Master Core**
- [ ] LLM integration (Claude API / OpenAI API):
  - [ ] System prompt engineering
  - [ ] Context management (clue history)
  - [ ] Personality configuration
  - [ ] Multi-language support
- [ ] Photo analysis pipeline:
  - [ ] Image preprocessing
  - [ ] Computer vision API (Azure/AWS/Google)
  - [ ] Object detection
  - [ ] Scene recognition
  - [ ] Text extraction (OCR)
- [ ] Decision engine:
  - [ ] Approval/rejection logic
  - [ ] Feedback generation
  - [ ] Hint generation
  - [ ] Difficulty adjustment

**Clue Adaptation for AI**
- [ ] AI-compatibility indicators:
  - [ ] Each clue marked as AI-compatible or not
  - [ ] Verification criteria defined
  - [ ] Expected photo elements tagged
- [ ] Enhanced clue metadata:
  - [ ] Visual verification tags (e.g., "red bridge", "clock tower")
  - [ ] Acceptable alternatives
  - [ ] Common mistakes to watch for
  - [ ] Hint hierarchy (3 levels of hints)
- [ ] Creator tools:
  - [ ] AI compatibility checker
  - [ ] Preview AI evaluation
  - [ ] Test with sample photos

**Conversation Interface**
- [ ] Chat-based interaction:
  - [ ] Player can ask questions
  - [ ] AI provides conversational responses
  - [ ] Context-aware answers
  - [ ] Encouragement and enthusiasm
- [ ] Voice interface (optional future):
  - [ ] Speech-to-text for questions
  - [ ] Text-to-speech for AI responses
  - [ ] Multiple voice options

**Cost Management**
- [ ] AI usage tracking:
  - [ ] API calls per game
  - [ ] Image analysis count
  - [ ] Token usage
- [ ] Rate limiting:
  - [ ] Max submissions per hour
  - [ ] Cooldown between requests
- [ ] Pricing tiers:
  - [ ] Free tier: Limited AI games per month
  - [ ] Premium: Unlimited AI games
  - [ ] Pay-per-game option

#### AI Game Master Personalities

**Personality Options**
- [ ] **Friendly Guide**: Encouraging, helpful, patient
- [ ] **Adventure Buddy**: Enthusiastic, energetic, fun
- [ ] **Mysterious Mentor**: Cryptic, intriguing, challenging
- [ ] **Professional Host**: Formal, informative, structured
- [ ] **Playful Companion**: Jokes, puns, lighthearted
- [ ] Custom personality based on game theme

**Personality Configuration**
```javascript
const aiPersonality = {
  name: "Professor Quest",
  style: "friendly-guide",
  tone: "encouraging",
  humor_level: "moderate",
  formality: "casual",
  vocabulary: "accessible",
  encouragement_frequency: "high",
  hint_style: "socratic" // or "direct"
};
```

#### Photo Verification Strategies

**Level 1: Computer Vision Only**
- [ ] Fast and cheap
- [ ] Object detection (e.g., "Does this contain a bridge?")
- [ ] Color analysis
- [ ] Scene classification
- [ ] Good for: Simple waypoint verification

**Level 2: LLM Image Analysis**
- [ ] More sophisticated understanding
- [ ] Context evaluation
- [ ] Detail verification
- [ ] Good for: Complex tasks, specific requirements

**Level 3: Hybrid Approach**
- [ ] CV for initial screening
- [ ] LLM for ambiguous cases
- [ ] Human review for disputes (optional)
- [ ] Good for: Balance between cost and accuracy

**Verification Confidence Levels**
```javascript
// AI returns confidence score
{
  approved: true,
  confidence: 0.85, // 85% confident
  reasoning: "Photo clearly shows the red bridge with the team member visible in frame.",
  detected_objects: ["bridge", "person", "water"],
  missing_elements: [],
  suggestions: null
}
```

**Handling Edge Cases**
- [ ] Low confidence (50-70%):
  - [ ] Ask clarifying question
  - [ ] Request additional photo
  - [ ] Provide specific feedback
- [ ] Very low confidence (<50%):
  - [ ] Politely reject
  - [ ] Explain what's missing
  - [ ] Offer hint
- [ ] Multiple attempts (3+ rejections):
  - [ ] Offer to skip clue
  - [ ] Provide answer
  - [ ] Suggest easier difficulty

#### Hint System

**Hint Levels**
- [ ] **Level 1 - Subtle Nudge**:
  - [ ] Reframe the clue
  - [ ] Point to general area/direction
- [ ] **Level 2 - Clearer Direction**:
  - [ ] More specific location hints
  - [ ] What to look for
- [ ] **Level 3 - Almost There**:
  - [ ] Very specific instructions
  - [ ] Nearly gives it away

**Hint Delivery**
```javascript
// Player: "I need a hint"
// AI analyzes current context and provides appropriate hint

{
  hint_level: 1,
  message: "Think about famous landmarks near the city center. Look for something that tells time and can be seen from far away.",
  follow_up_enabled: true,
  estimated_distance: "200 meters", // if location tracking enabled
}
```

**Adaptive Hints**
- [ ] Time-based hints:
  - [ ] After 10 minutes → offer hint level 1
  - [ ] After 20 minutes → offer hint level 2
  - [ ] After 30 minutes → offer skip option
- [ ] Attempt-based hints:
  - [ ] After 2 failed submissions → offer hint
- [ ] Location-based hints (if GPS enabled):
  - [ ] "You're getting warmer/colder"
  - [ ] Distance to target

#### Safety & Content Moderation

**Photo Content Filtering**
- [ ] Automatic NSFW detection
- [ ] Inappropriate content flagging
- [ ] Privacy protection (faces, license plates)
- [ ] Immediate rejection of flagged content

**AI Response Moderation**
- [ ] Review AI outputs for appropriateness
- [ ] Filter harmful/offensive language
- [ ] Ensure family-friendly responses
- [ ] Log and review edge cases

#### Database Schema Additions

```javascript
// AI game sessions
export const aiGameSessions = pgTable('ai_game_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  libraryId: integer('library_id').notNull().references(() => clueLibraries.id),
  gameId: integer('game_id').references(() => games.id), // Created game instance
  personalityType: varchar('personality_type', { length: 50 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }), // 'forgiving', 'standard', 'strict'
  language: varchar('language', { length: 10 }),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  currentClueIndex: integer('current_clue_index').default(0),
  hintsUsed: integer('hints_used').default(0),
  totalSubmissions: integer('total_submissions').default(0),
  apiCalls: integer('api_calls').default(0), // Cost tracking
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'abandoned'
});

// AI submission evaluations
export const aiEvaluations = pgTable('ai_evaluations', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => aiGameSessions.id, { onDelete: 'cascade' }),
  submissionId: integer('submission_id').notNull().references(() => submissions.id),
  approved: boolean('approved').notNull(),
  confidence: decimal('confidence', { precision: 4, scale: 3 }), // 0.000-1.000
  reasoning: text('reasoning'),
  detectedObjects: jsonb('detected_objects').default([]),
  missingElements: jsonb('missing_elements').default([]),
  aiModel: varchar('ai_model', { length: 50 }), // 'claude-3-sonnet', 'gpt-4-vision', etc.
  apiLatency: integer('api_latency'), // milliseconds
  cost: decimal('cost', { precision: 10, scale: 6 }), // Track API costs
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AI conversation history
export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => aiGameSessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant'
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }), // 'clue', 'feedback', 'hint', 'chat'
  metadata: jsonb('metadata').default({}), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clue AI compatibility
export const clueAIMetadata = pgTable('clue_ai_metadata', {
  id: serial('id').primaryKey(),
  clueId: integer('clue_id').notNull().references(() => clues.id, { onDelete: 'cascade' }),
  aiCompatible: boolean('ai_compatible').default(false),
  verificationTags: jsonb('verification_tags').default([]), // Objects to detect
  visualCriteria: text('visual_criteria'), // What photo must show
  commonMistakes: jsonb('common_mistakes').default([]),
  hintLevel1: text('hint_level_1'),
  hintLevel2: text('hint_level_2'),
  hintLevel3: text('hint_level_3'),
  estimatedDifficulty: varchar('estimated_difficulty', { length: 20 }),
  testPhotoUrls: jsonb('test_photo_urls').default([]), // Sample photos for testing
});
```

#### API Endpoints

- [ ] POST `/api/ai/start-game` - Initialize AI game session
- [ ] POST `/api/ai/sessions/[id]/submit` - Submit photo for AI review
- [ ] POST `/api/ai/sessions/[id]/chat` - Send message to AI
- [ ] POST `/api/ai/sessions/[id]/hint` - Request hint
- [ ] GET `/api/ai/sessions/[id]` - Get session details
- [ ] POST `/api/ai/sessions/[id]/skip-clue` - Skip current clue
- [ ] POST `/api/ai/sessions/[id]/complete` - Complete session
- [ ] GET `/api/ai/sessions/[id]/history` - Get conversation history
- [ ] POST `/api/clues/[id]/ai-test` - Test AI compatibility
- [ ] GET `/api/admin/ai-analytics` - AI usage analytics

#### Creator Tools for AI Compatibility

**AI Compatibility Wizard**
- [ ] Step-by-step guide for making clues AI-friendly
- [ ] Automatic suggestions for verification tags
- [ ] Test AI evaluation with sample photos
- [ ] Preview AI feedback examples
- [ ] AI compatibility score (0-100%)

**Testing Interface**
- [ ] Upload test photos
- [ ] See what AI detects
- [ ] Adjust verification criteria
- [ ] Refine hints
- [ ] Iterate until high success rate

#### Monetization Options

**Freemium Model**
- [ ] Free: 3 AI-guided games per month
- [ ] Premium: Unlimited AI games + priority processing
- [ ] Credits: Purchase AI game credits à la carte

**Creator Revenue Share**
- [ ] Creators earn per AI game played with their pack
- [ ] Higher quality (better AI compatibility) = higher earnings
- [ ] Dashboard showing AI game usage and earnings

#### Rollout Strategy

**Phase 9A: Foundation (10-12 hours)**
- [ ] Basic AI integration (Claude API)
- [ ] Simple photo verification (yes/no)
- [ ] Basic conversational interface
- [ ] Single personality type
- [ ] Limited to waypoint clues only

**Phase 9B: Enhancement (8-10 hours)**
- [ ] Multiple AI personalities
- [ ] Sophisticated verification
- [ ] Multi-level hint system
- [ ] Support all clue types
- [ ] Chat interface improvements

**Phase 9C: Polish (2-8 hours)**
- [ ] Adaptive difficulty
- [ ] Creator AI compatibility tools
- [ ] Advanced analytics
- [ ] Cost optimization
- [ ] Voice interface (optional)

---

## 📈 Updated Effort Estimates

### **Complete Platform: 92-128 hours**

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| Phase 1 | Navigation & Game Creation | 8-12 | CRITICAL |
| Phase 2 | Clue Library System | 6-8 | CRITICAL |
| Phase 3 | Game Master Dashboard | 12-16 | HIGH |
| Phase 4 | Player Experience | 8-12 | HIGH |
| Phase 5 | Invitation System | 4-6 | MEDIUM |
| Phase 6 | Polish & Extras | 6-8 | LOW |
| **Phase 7** | **Platform Admin Panel** | **12-16** | **MEDIUM** |
| **Phase 8** | **Marketplace** | **16-20** | **HIGH** |
| **Phase 9** | **AI Self-Guided Mode** | **20-30** | **FUTURE** |

### **Revised Sprint Plan**

**Sprint 1-3: Core Platform (44-62 hours)**
- Phases 1-6 as previously defined
- Get to feature parity with legacy app

**Sprint 4: Platform Administration (12-16 hours)**
- Phase 7: Admin panel
- Essential for platform management and growth

**Sprint 5: Marketplace & Ecosystem (16-20 hours)**
- Phase 8: Full marketplace implementation
- Enables content creation economy

**Sprint 6: AI Innovation (20-30 hours)**
- Phase 9: AI-powered self-guided mode
- Revolutionary feature for market differentiation

---

## 🎯 Updated Success Criteria

### **Phase 7 Success (Admin Panel)**
- [ ] Admin can view platform statistics and analytics
- [ ] Admin can manage users (roles, suspension, deletion)
- [ ] Admin can moderate public libraries
- [ ] Admin can access system logs and support tickets
- [ ] Admin actions are logged for audit trail

### **Phase 8 Success (Marketplace)**
- [ ] Users can browse and search marketplace
- [ ] Users can publish libraries to marketplace
- [ ] Libraries have ratings and reviews
- [ ] Categories and filtering work smoothly
- [ ] Creator profiles show their published packs
- [ ] Download/usage statistics tracked accurately

### **Phase 9 Success (AI Mode)**
- [ ] Users can start AI-guided game from marketplace
- [ ] AI successfully reviews photo submissions (>80% accuracy)
- [ ] Players can request and receive contextual hints
- [ ] Conversation interface feels natural
- [ ] Game completion flow works end-to-end
- [ ] Cost per game is sustainable (<$0.50)

---

## ✅ Next Immediate Steps (Updated)

1. **Review this expanded plan** with stakeholders
2. **Prioritize phases** - Recommend:
   - Core first (Phases 1-6)
   - Then Marketplace (Phase 8) for ecosystem growth
   - Then Admin Panel (Phase 7) for scaling
   - Finally AI Mode (Phase 9) for differentiation
3. **Set up development roadmap** with realistic timelines
4. **Begin Sprint 1** - Core platform features
5. **Plan marketplace MVP** - Start thinking about UX early
6. **Research AI APIs** - Compare Claude vs GPT-4 Vision capabilities and costs
7. **Design monetization strategy** - How to sustain AI costs and platform growth

---

**Last Updated**: October 14, 2025 (Expanded with Phases 7-9)
**Status**: Comprehensive platform vision documented, ready for phased implementation
**Contact**: Ready to build the future of treasure hunt platforms! 🚀
