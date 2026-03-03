import { handleUpload, type HandleUploadBody } from '@vercel/blob/multipart';
import { NextResponse } from 'next/server';
import { isAuthorizedDomain } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const email = clientPayload || '';
        if (!email || !isAuthorizedDomain(email)) throw new Error('Unauthorized');
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf', 'application/zip', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload completed:', blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
