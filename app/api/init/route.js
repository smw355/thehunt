import { db } from '@/db/index.js';
import { clues } from '@/db/schema.js';

// Initialize database with sample clue data
export async function POST() {
  try {
    // Check if clues already exist
    const existingClues = await db.select().from(clues).limit(1);

    if (existingClues.length > 0) {
      return Response.json({ message: 'Database already initialized' });
    }

    // Sample clues to seed the database
    const sampleClues = [
      {
        type: 'route-info',
        title: 'Welcome to The Race',
        content: JSON.stringify([
          'Welcome to The Race! Your first challenge awaits.',
          'Navigate to the main entrance of the building.',
          'Take a team photo with the building number clearly visible in the background.'
        ])
      },
      {
        type: 'detour',
        title: 'Choose Your Path',
        detourOptionA: JSON.stringify({
          title: 'Mind Challenge',
          description: 'Solve this puzzle: What has keys but no locks, space but no room, and you can enter but not go inside? Take a photo of the answer.'
        }),
        detourOptionB: JSON.stringify({
          title: 'Physical Challenge',
          description: 'Do 10 jumping jacks as a team and record a video showing everyone participating.'
        })
      },
      {
        type: 'road-block',
        title: 'Solo Mission',
        roadblockQuestion: 'Who on your team has the best memory?',
        roadblockTask: 'Recite the alphabet backwards while being recorded on video. You have 3 attempts.'
      }
    ];

    // Insert sample clues
    const insertedClues = await db.insert(clues).values(sampleClues).returning();

    return Response.json({
      message: 'Database initialized successfully',
      cluesAdded: insertedClues.length
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return Response.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}