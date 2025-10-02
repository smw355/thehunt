import { db } from '@/db/index.js';
import { clues, submissions } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Delete a specific clue by ID
export async function DELETE(request, { params }) {
  try {
    // Fix Next.js 15 issue - await params before using
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Convert id to integer (database expects integer)
    const clueId = parseInt(id, 10);
    if (isNaN(clueId)) {
      return Response.json({ error: 'Invalid clue ID' }, { status: 400 });
    }

    // Check if clue exists
    const existingClue = await db.select().from(clues).where(eq(clues.id, clueId)).limit(1);
    if (existingClue.length === 0) {
      return Response.json({ error: 'Clue not found' }, { status: 404 });
    }

    // Check if clue has submissions (foreign key constraint)
    const relatedSubmissions = await db.select().from(submissions).where(eq(submissions.clueId, clueId)).limit(1);
    if (relatedSubmissions.length > 0) {
      return Response.json({
        error: 'Cannot delete clue that has team submissions. Please remove all submissions for this clue first.'
      }, { status: 409 }); // 409 Conflict
    }

    // Delete the specific clue
    const [deletedClue] = await db
      .delete(clues)
      .where(eq(clues.id, clueId))
      .returning();

    return Response.json({
      message: 'Clue deleted successfully',
      deletedClue
    });
  } catch (error) {
    console.error('Error deleting clue:', error);

    // Handle foreign key constraint errors specifically
    if (error.code === '23503') {
      return Response.json({
        error: 'Cannot delete clue that has related submissions. Please remove all submissions first.'
      }, { status: 409 });
    }

    return Response.json({ error: 'Failed to delete clue' }, { status: 500 });
  }
}