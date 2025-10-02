import { db } from '@/db/index.js';
import { clues } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Delete a specific clue by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Convert id to integer (database expects integer)
    const clueId = parseInt(id, 10);
    if (isNaN(clueId)) {
      return Response.json({ error: 'Invalid clue ID' }, { status: 400 });
    }

    // Delete the specific clue
    const [deletedClue] = await db
      .delete(clues)
      .where(eq(clues.id, clueId))
      .returning();

    if (!deletedClue) {
      return Response.json({ error: 'Clue not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Clue deleted successfully',
      deletedClue
    });
  } catch (error) {
    console.error('Error deleting clue:', error);
    return Response.json({ error: 'Failed to delete clue' }, { status: 500 });
  }
}