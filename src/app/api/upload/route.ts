import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'File body is required' }, { status: 400 });
  }

  // Support both the default env var name and the auto-generated one from Vercel Storage linking
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.blobportal_READ_WRITE_TOKEN;

  if (!token) {
    console.error('Missing Blob token. Expected BLOB_READ_WRITE_TOKEN or blobportal_READ_WRITE_TOKEN.');
    return NextResponse.json({ error: 'Server misconfiguration: missing blob token' }, { status: 500 });
  }

  try {
    // Stream the body directly instead of buffering into memory
    // This avoids the 4.5MB serverless function body size limit
    const blob = await put(filename, request.body, {
      access: 'public',
      token,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
