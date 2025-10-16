import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { db } from '@/db/index.js'
import { clueLibraries, libraryClues, clues } from '@/db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { jsonTypeToDb } from '@/lib/clueTypeHelpers'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const libraryId = parseInt(params.id)

    // Verify library exists and user is owner
    const [library] = await db
      .select()
      .from(clueLibraries)
      .where(eq(clueLibraries.id, libraryId))
      .limit(1)

    if (!library) {
      return Response.json({ error: 'Library not found' }, { status: 404 })
    }

    if (library.userId !== session.user.id) {
      return Response.json({ error: 'Not authorized to import to this library' }, { status: 403 })
    }

    const { clues: importClues } = await request.json()

    if (!Array.isArray(importClues)) {
      return Response.json({ error: 'Invalid format: clues must be an array' }, { status: 400 })
    }

    // Get the current max order to append new clues at the end
    const existingClues = await db
      .select({ order: libraryClues.order })
      .from(libraryClues)
      .where(eq(libraryClues.libraryId, libraryId))
      .orderBy(desc(libraryClues.order))
      .limit(1)

    let nextOrder = existingClues.length > 0 ? existingClues[0].order + 1 : 0

    const results = {
      imported: 0,
      failed: 0,
      errors: []
    }

    for (const [index, jsonClue] of importClues.entries()) {
      try {
        // Validate and convert type
        const dbType = jsonTypeToDb(jsonClue.type)
        if (!['route-info', 'detour', 'road-block'].includes(dbType)) {
          throw new Error(`Invalid type: "${jsonClue.type}". Must be "waypoint", "fork", or "solo"`)
        }

        // Validate title
        if (!jsonClue.title || !jsonClue.title.trim()) {
          throw new Error('Title is required')
        }

        // Build base clue data
        const clueData = {
          type: dbType,
          title: jsonClue.title.trim(),
          requiredPhotos: parseInt(jsonClue.requiredPhotos) || 0
        }

        // Validate requiredPhotos range
        if (clueData.requiredPhotos < 0 || clueData.requiredPhotos > 10) {
          throw new Error('requiredPhotos must be between 0 and 10')
        }

        // Type-specific validation and field mapping
        if (dbType === 'route-info') {
          if (!Array.isArray(jsonClue.content) || jsonClue.content.length === 0) {
            throw new Error('Waypoint clues require a content array with at least one item')
          }
          clueData.content = jsonClue.content.filter(line => line && line.trim())
          if (clueData.content.length === 0) {
            throw new Error('Waypoint clues require at least one non-empty content line')
          }
        } else if (dbType === 'detour') {
          if (!jsonClue.optionA || !jsonClue.optionA.title || !jsonClue.optionA.title.trim()) {
            throw new Error('Fork clues require optionA.title')
          }
          if (!jsonClue.optionB || !jsonClue.optionB.title || !jsonClue.optionB.title.trim()) {
            throw new Error('Fork clues require optionB.title')
          }
          clueData.detourOptionA = {
            title: jsonClue.optionA.title.trim(),
            description: jsonClue.optionA.description?.trim() || ''
          }
          clueData.detourOptionB = {
            title: jsonClue.optionB.title.trim(),
            description: jsonClue.optionB.description?.trim() || ''
          }
        } else if (dbType === 'road-block') {
          if (!jsonClue.question || !jsonClue.question.trim()) {
            throw new Error('Solo clues require a question field')
          }
          clueData.roadblockQuestion = jsonClue.question.trim()
          clueData.roadblockTask = jsonClue.task?.trim() || ''
        }

        // Create clue in database
        const [newClue] = await db
          .insert(clues)
          .values({
            ...clueData,
            createdAt: new Date()
          })
          .returning()

        // Link clue to library with order
        await db
          .insert(libraryClues)
          .values({
            libraryId: library.id,
            clueId: newClue.id,
            order: nextOrder++,
            addedAt: new Date()
          })

        results.imported++
      } catch (error) {
        results.failed++
        results.errors.push({
          clueIndex: index + 1,
          title: jsonClue.title || '(no title)',
          error: error.message
        })
      }
    }

    return Response.json(results, { status: 200 })
  } catch (error) {
    console.error('Error importing clues:', error)
    return Response.json({ error: 'Failed to import clues' }, { status: 500 })
  }
}
