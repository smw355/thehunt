import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  gameMembers,
  clueLibraries,
  libraryClues,
  gameInvitations
} from '../db/schema.js'

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.')
  process.exit(1)
}

console.log('🔄 Starting database migration for multi-user architecture...')

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

async function migrate() {
  try {
    console.log('📋 Creating users table...')
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        image TEXT,
        email_verified TIMESTAMP,
        global_role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_active TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    console.log('🔑 Creating accounts table (NextAuth)...')
    await client`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        PRIMARY KEY (provider, provider_account_id)
      );
    `

    console.log('🎫 Creating sessions table (NextAuth)...')
    await client`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token VARCHAR(255) NOT NULL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      );
    `

    console.log('✅ Creating verification tokens table (NextAuth)...')
    await client`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `

    console.log('👥 Creating game members table...')
    await client`
      CREATE TABLE IF NOT EXISTS game_members (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active'
      );
    `

    console.log('📚 Creating clue libraries table...')
    await client`
      CREATE TABLE IF NOT EXISTS clue_libraries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    console.log('🔗 Creating library clues table...')
    await client`
      CREATE TABLE IF NOT EXISTS library_clues (
        id SERIAL PRIMARY KEY,
        library_id INTEGER NOT NULL REFERENCES clue_libraries(id) ON DELETE CASCADE,
        clue_id INTEGER NOT NULL REFERENCES clues(id) ON DELETE CASCADE,
        added_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    console.log('📧 Creating game invitations table...')
    await client`
      CREATE TABLE IF NOT EXISTS game_invitations (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_email VARCHAR(255),
        invited_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        invite_token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    console.log('🔍 Creating indexes for performance...')
    await client`CREATE INDEX IF NOT EXISTS idx_game_members_game_id ON game_members(game_id);`
    await client`CREATE INDEX IF NOT EXISTS idx_game_members_user_id ON game_members(user_id);`
    await client`CREATE INDEX IF NOT EXISTS idx_clue_libraries_user_id ON clue_libraries(user_id);`
    await client`CREATE INDEX IF NOT EXISTS idx_library_clues_library_id ON library_clues(library_id);`
    await client`CREATE INDEX IF NOT EXISTS idx_game_invitations_token ON game_invitations(invite_token);`
    await client`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`
    await client`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);`

    console.log('✅ Multi-user database migration completed successfully!')
    console.log('')
    console.log('🎯 Next steps:')
    console.log('1. Set up OAuth providers (Google, GitHub)')
    console.log('2. Configure NEXTAUTH_SECRET environment variable')
    console.log('3. Test authentication flow')
    console.log('')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()