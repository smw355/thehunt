import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const teamId = formData.get('teamId');
    const clueId = formData.get('clueId');
    const uploadType = formData.get('uploadType'); // 'submission' or 'reference'

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: file' },
        { status: 400 }
      );
    }

    // For team submissions, require teamId and clueId
    if (uploadType !== 'reference' && (!teamId || !clueId)) {
      return NextResponse.json(
        { error: 'Missing required fields: file, teamId, or clueId' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be an image or video' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileId = uuidv4();
    const extension = file.name.split('.').pop() || 'jpg';

    // Use different folder structure for reference images vs team submissions
    const filename = uploadType === 'reference'
      ? `reference-images/${session.user.id}/${fileId}.${extension}`
      : `submissions/${teamId}/${clueId}/${fileId}.${extension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
      fileId: fileId,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}