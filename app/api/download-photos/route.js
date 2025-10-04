import { db } from '@/db/index.js';
import { submissions, teams, clues } from '@/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import JSZip from 'jszip';

export async function GET(request) {
  try {
    // Get game ID from query parameters
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return Response.json({ error: 'Game ID is required' }, { status: 400 });
    }

    // Get all submissions with photos for the specific game
    const submissionsWithPhotos = await db
      .select({
        id: submissions.id,
        teamId: submissions.teamId,
        clueId: submissions.clueId,
        gameId: submissions.gameId,
        photos: submissions.photos,
        createdAt: submissions.createdAt,
        teamName: teams.name,
        clueTitle: clues.title,
      })
      .from(submissions)
      .leftJoin(teams, eq(submissions.teamId, teams.id))
      .leftJoin(clues, eq(submissions.clueId, clues.id))
      .where(sql`${submissions.gameId} = ${gameId} AND jsonb_array_length(${submissions.photos}) > 0`);

    // If no photos found
    if (submissionsWithPhotos.length === 0) {
      return Response.json({ error: 'No photos found' }, { status: 404 });
    }

    // Create a ZIP file
    const zip = new JSZip();
    let photoCount = 0;

    // Process each submission
    for (const submission of submissionsWithPhotos) {
      if (!submission.photos || submission.photos.length === 0) continue;

      const teamName = submission.teamName || `Team-${submission.teamId}`;
      const clueTitle = submission.clueTitle || `Clue-${submission.clueId}`;
      const submissionDate = new Date(submission.createdAt).toISOString().split('T')[0];

      // Create folder structure: TeamName/ClueTitle-Date/
      const folderName = `${teamName}/${clueTitle}-${submissionDate}`;

      // Process each photo in the submission
      for (let i = 0; i < submission.photos.length; i++) {
        const photo = submission.photos[i];

        try {
          // Fetch the photo from the URL
          const response = await fetch(photo.url);
          if (!response.ok) continue;

          const photoBuffer = await response.arrayBuffer();
          const fileName = photo.originalName || `photo-${i + 1}.jpg`;

          // Add to ZIP
          zip.file(`${folderName}/${fileName}`, photoBuffer);
          photoCount++;
        } catch (error) {
          console.error(`Failed to download photo ${photo.url}:`, error);
          // Continue with other photos even if one fails
        }
      }
    }

    if (photoCount === 0) {
      return Response.json({ error: 'No photos could be downloaded' }, { status: 404 });
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Return ZIP file
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="race-photos-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Download photos error:', error);
    return Response.json({ error: 'Failed to download photos: ' + error.message }, { status: 500 });
  }
}