import { pgTable, serial, text, timestamp, integer, jsonb, varchar, boolean } from 'drizzle-orm/pg-core';

// Games table
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull().unique(),
  clueSequence: jsonb('clue_sequence').notNull().default([]),
  status: varchar('status', { length: 50 }).notNull().default('setup'), // setup, active, completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  currentClueIndex: integer('current_clue_index').notNull().default(0),
  completedClues: jsonb('completed_clues').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clues library table
export const clues = pgTable('clues', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // route-info, detour, road-block
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content'), // Array of strings for route-info
  detourOptionA: jsonb('detour_option_a'), // {title, description}
  detourOptionB: jsonb('detour_option_b'), // {title, description}
  roadblockQuestion: text('roadblock_question'),
  roadblockTask: text('roadblock_task'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Submissions table
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  clueId: integer('clue_id').notNull().references(() => clues.id),
  clueIndex: integer('clue_index').notNull(),
  clueType: varchar('clue_type', { length: 50 }).notNull(),
  detourChoice: varchar('detour_choice', { length: 1 }), // A or B
  roadblockPlayer: varchar('roadblock_player', { length: 255 }),
  textProof: text('text_proof'),
  notes: text('notes'),
  photos: jsonb('photos').notNull().default([]), // Array of photo objects
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