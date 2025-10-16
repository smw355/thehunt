#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../db/schema.js'
import { readFileSync } from 'fs'

// Parse .env.local manually
let connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  try {
    const envFile = readFileSync('.env.local', 'utf-8')
    const match = envFile.match(/POSTGRES_URL="?([^"\n]+)"?/)
    if (match) {
      connectionString = match[1]
    }
  } catch (e) {
    // Ignore if file doesn't exist
  }
}

if (!connectionString) {
  console.error('❌ POSTGRES_URL environment variable not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function listUsers() {
  try {
    console.log('🔍 Fetching all users from database...\n')

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      globalRole: users.globalRole,
      createdAt: users.createdAt,
      lastActive: users.lastActive
    }).from(users)

    if (allUsers.length === 0) {
      console.log('📭 No users found in database')
      return
    }

    console.log(`👥 Found ${allUsers.length} user(s):\n`)
    console.log('─'.repeat(120))
    console.log(
      'ID'.padEnd(40) +
      'Email'.padEnd(35) +
      'Name'.padEnd(25) +
      'Role'.padEnd(10) +
      'Created'
    )
    console.log('─'.repeat(120))

    allUsers.forEach(user => {
      const roleIcon = user.globalRole === 'admin' ? '🔴' : '🟢'
      console.log(
        String(user.id).padEnd(40) +
        String(user.email || 'N/A').padEnd(35) +
        String(user.name || 'N/A').padEnd(25) +
        `${roleIcon} ${user.globalRole}`.padEnd(10) +
        new Date(user.createdAt).toLocaleDateString()
      )
    })
    console.log('─'.repeat(120))

    const adminCount = allUsers.filter(u => u.globalRole === 'admin').length
    console.log(`\n📊 Stats: ${adminCount} admin(s), ${allUsers.length - adminCount} regular user(s)`)

  } catch (error) {
    console.error('❌ Error fetching users:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

listUsers()
