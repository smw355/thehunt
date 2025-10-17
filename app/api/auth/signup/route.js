import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return Response.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        globalRole: 'user',
        createdAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    return Response.json(
      {
        message: 'Account created successfully',
        user: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return Response.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
