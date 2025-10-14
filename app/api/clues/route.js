import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/db/index.js';
import { clues, libraryClues } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Get all clues from the library
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = db.select().from(clues)

    if (type && ['route-info', 'detour', 'road-block'].includes(type)) {
      query = query.where(eq(clues.type, type))
    }

    const allClues = await query.limit(limit)
    return Response.json({ clues: allClues });
  } catch (error) {
    console.error('Error fetching clues:', error)
    return Response.json({ error: 'Failed to fetch clues' }, { status: 500 });
  }
}

// Create single clue or import clues from JSON (bulk insert)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();

    // Check if this is a bulk import (has 'clues' array) or single clue
    if (body.clues) {
      // Bulk import
      const { clues: clueData, replace = false } = body;

      // If replace is true, delete all existing clues first
      if (replace) {
        await db.delete(clues);
      }

      // Insert new clues
      const insertedClues = await db.insert(clues).values(clueData).returning();

      return Response.json({
        message: `Successfully imported ${insertedClues.length} clues`,
        clues: insertedClues
      });
    } else {
      // Single clue creation with validation
      const {
        type,
        title,
        content,
        detourOptionA,
        detourOptionB,
        roadblockQuestion,
        roadblockTask,
        requiredPhotos,
        libraryId,
      } = body

      // Validate required fields
      if (!type || !title) {
        return Response.json({ error: 'Type and title are required' }, { status: 400 })
      }

      if (!['route-info', 'detour', 'road-block'].includes(type)) {
        return Response.json({ error: 'Invalid clue type' }, { status: 400 })
      }

      // Type-specific validation
      if (type === 'route-info' && (!content || !Array.isArray(content) || content.length === 0)) {
        return Response.json({ error: 'Route info clues require content array' }, { status: 400 })
      }

      if (type === 'detour' && (!detourOptionA || !detourOptionB)) {
        return Response.json({ error: 'Detour clues require both options' }, { status: 400 })
      }

      if (type === 'road-block' && !roadblockQuestion) {
        return Response.json({ error: 'Road block clues require a question' }, { status: 400 })
      }

      // Create the clue
      const clueData = {
        type,
        title: title.trim(),
        content: type === 'route-info' ? content : null,
        detourOptionA: type === 'detour' ? detourOptionA : null,
        detourOptionB: type === 'detour' ? detourOptionB : null,
        roadblockQuestion: type === 'road-block' ? roadblockQuestion?.trim() : null,
        roadblockTask: type === 'road-block' ? roadblockTask?.trim() : null,
        requiredPhotos: requiredPhotos || 0,
        createdAt: new Date(),
      }

      const [newClue] = await db.insert(clues).values(clueData).returning();

      // If libraryId is provided, add to library
      if (libraryId) {
        await db.insert(libraryClues).values({
          libraryId: parseInt(libraryId),
          clueId: newClue.id,
          addedAt: new Date(),
        })
      }

      return Response.json(newClue, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating clue:', error)
    return Response.json({ error: 'Failed to create clue(s)' }, { status: 500 });
  }
}

// Update a single clue
export async function PATCH(request) {
  try {
    const { id, ...updateData } = await request.json();

    const [updatedClue] = await db.update(clues)
      .set(updateData)
      .where(eq(clues.id, id))
      .returning();

    return Response.json(updatedClue);
  } catch (error) {
    return Response.json({ error: 'Failed to update clue' }, { status: 500 });
  }
}

// Delete all clues (for clean slate)
export async function DELETE() {
  try {
    await db.delete(clues);
    return Response.json({ message: 'All clues deleted' });
  } catch (error) {
    return Response.json({ error: 'Failed to delete clues' }, { status: 500 });
  }
}