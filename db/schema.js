import { pgTable, serial, text, timestamp, integer, jsonb, varchar, boolean, primaryKey } from 'drizzle-orm/pg-core';

// Games table
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull().unique(),
  clueSequence: jsonb('clue_sequence').notNull().default([]),
  status: varchar('status', { length: 50 }).notNull().default('setup'), // setup, active, completed
  victoryPageSettings: jsonb('victory_page_settings'), // Customizable victory page content
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }), // Nullable - no longer required in multi-user system
  currentClueIndex: integer('current_clue_index').notNull().default(0),
  completedClues: jsonb('completed_clues').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clues library table
export const clues = pgTable('clues', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // route-info, detour, road-block, snapshot
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content'), // Array of strings for route-info
  detourOptionA: jsonb('detour_option_a'), // {title, description}
  detourOptionB: jsonb('detour_option_b'), // {title, description}
  roadblockQuestion: text('roadblock_question'),
  roadblockTask: text('roadblock_task'),
  snapshotImageUrl: text('snapshot_image_url'), // Reference photo URL for snapshot clues
  snapshotDescription: text('snapshot_description'), // Description/hints for snapshot clues
  requiredPhotos: integer('required_photos').default(0), // Number of photos required for completion
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Submissions table
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  clueId: integer('clue_id').references(() => clues.id),
  clueIndex: integer('clue_index').notNull(),
  clueTitle: varchar('clue_title', { length: 255 }),
  clueType: varchar('clue_type', { length: 50 }),
  detourChoice: varchar('detour_choice', { length: 1 }), // A or B
  roadblockPlayer: varchar('roadblock_player', { length: 255 }),
  textProof: text('text_proof'),
  notes: text('notes'),
  photos: jsonb('photos').notNull().default([]), // Array of photo objects
  photoUrls: jsonb('photo_urls').notNull().default([]), // Array of photo URLs
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, rejected
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Team states table (for detour choices, roadblock assignments per clue)
export const teamStates = pgTable('team_states', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  clueIndex: integer('clue_index').notNull(),
  detourChoice: varchar('detour_choice', { length: 1 }), // A or B
  roadblockPlayer: varchar('roadblock_player', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===== NEW MULTI-USER ARCHITECTURE TABLES =====

// Users table (OAuth-based authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }), // Hashed password for credentials auth (nullable for OAuth users)
  name: varchar('name', { length: 255 }),
  image: text('image'), // Avatar URL from OAuth provider
  emailVerified: timestamp('email_verified'),
  globalRole: varchar('global_role', { length: 50 }).notNull().default('user'), // 'admin' or 'user'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActive: timestamp('last_active').defaultNow().notNull(),
});

// NextAuth.js required tables for session management
export const accounts = pgTable('accounts', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).notNull().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// Game memberships (links users to games with roles)
export const gameMembers = pgTable('game_members', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'game_master', 'player'
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'set null' }), // nullable for unassigned players
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'), // 'active', 'left', 'removed'
});

// User clue libraries (personal collections)
export const clueLibraries = pgTable('clue_libraries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Link clues to user libraries
export const libraryClues = pgTable('library_clues', {
  id: serial('id').primaryKey(),
  libraryId: integer('library_id').notNull().references(() => clueLibraries.id, { onDelete: 'cascade' }),
  clueId: integer('clue_id').notNull().references(() => clues.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

// Game invitations
export const gameInvitations = pgTable('game_invitations', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  invitedBy: integer('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitedEmail: varchar('invited_email', { length: 255 }),
  invitedUserId: integer('invited_user_id').references(() => users.id, { onDelete: 'set null' }),
  inviteToken: varchar('invite_token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'accepted', 'declined', 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});