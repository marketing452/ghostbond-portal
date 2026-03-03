import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Edge runtime streams the request body directly to Vercel Blob
// bypassing the 4.5MB serverless function body size limit entirely
export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing blob token' }, { status: 500 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'No file body received' }, { status: 400 });
  }

  try {
    // Stream directly to Vercel Blob — never buffers into memory
    const blob = await put(filename, request.body, {
      access: 'public',
      token,
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
