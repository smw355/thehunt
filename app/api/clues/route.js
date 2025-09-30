import { db } from '@/db/index.js';
import { clues } from '@/db/schema.js';

// Get all clues from the library
export async function GET() {
  try {
    const allClues = await db.select().from(clues);
    return Response.json(allClues);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch clues' }, { status: 500 });
  }
}

// Import clues from JSON (bulk insert)
export async function POST(request) {
  try {
    const { clues: clueData, replace = false } = await request.json();

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
  } catch (error) {
    return Response.json({ error: 'Failed to import clues' }, { status: 500 });
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