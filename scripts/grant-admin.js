#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
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

async function grantAdmin(userEmail) {
  try {
    console.log(`🔍 Looking for user with email: ${userEmail}...\n`)

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user) {
      console.error(`❌ User not found with email: ${userEmail}`)
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`)
    console.log(`   Current role: ${user.globalRole}`)

    if (user.globalRole === 'admin') {
      console.log('\n✨ User already has admin privileges!')
      return
    }

    // Update user to admin
    await db
      .update(users)
      .set({ globalRole: 'admin' })
      .where(eq(users.id, user.id))

    console.log('\n🎉 Successfully granted admin privileges!')
    console.log('   New role: admin')
    console.log('\n🔗 You can now access the admin dashboard at:')
    console.log('   https://therace.vercel.app/admin')

  } catch (error) {
    console.error('❌ Error granting admin access:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Get email from command line argument
const userEmail = process.argv[2]

if (!userEmail) {
  console.error('❌ Usage: node scripts/grant-admin.js <email>')
  console.error('   Example: node scripts/grant-admin.js user@example.com')
  process.exit(1)
}

grantAdmin(userEmail)
