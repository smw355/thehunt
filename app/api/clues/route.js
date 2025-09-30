import { db } from '@/db/index.js';
import { clues } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Get all clues from the library
export async function GET() {
  try {
    const allClues = await db.select().from(clues);
    return Response.json(allClues);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch clues' }, { status: 500 });
  }
}

// Create single clue or import clues from JSON (bulk insert)
export async function POST(request) {
  try {
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
      // Single clue creation
      const clueData = body;
      const [newClue] = await db.insert(clues).values(clueData).returning();

      return Response.json(newClue);
    }
  } catch (error) {
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