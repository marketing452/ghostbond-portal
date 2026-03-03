import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';
import { isAuthorizedDomain } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const taskId = searchParams.get('taskId');

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  try {
    const notion = getNotionClient();
    const response = await notion.comments.list({ block_id: taskId });

    const comments = response.results.map((c: any) => {
      const fullText = c.rich_text?.map((rt: any) => rt.plain_text).join('') || '';

      // Parse file URLs appended as JSON at the end of the comment text
      // Format: "comment text\n__files__:[\"url1\",\"url2\"]"
      let text = fullText;
      let fileUrls: string[] = [];
      const fileMarker = '\n__files__:';
      const markerIdx = fullText.lastIndexOf(fileMarker);
      if (markerIdx !== -1) {
        text = fullText.slice(0, markerIdx);
        try {
          fileUrls = JSON.parse(fullText.slice(markerIdx + fileMarker.length));
        } catch {
          // ignore parse errors
        }
      }

      return {
        id: c.id,
        text,
        fileUrls,
        createdTime: c.created_time,
        createdBy: c.created_by?.person?.email || c.created_by?.name || 'Unknown',
      };
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments from Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, taskId, text, fileUrls } = body;

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  if (!taskId || (!text && (!fileUrls || fileUrls.length === 0))) {
    return NextResponse.json({ error: 'Missing taskId or content' }, { status: 400 });
  }

  try {
    // Build comment content: prefix with email, append file URLs as encoded JSON
    let commentContent = `[${email}] ${text || ''}`.trim();
    if (fileUrls && fileUrls.length > 0) {
      commentContent += `\n__files__:${JSON.stringify(fileUrls)}`;
    }

    const notion = getNotionClient();
    const newComment = await notion.comments.create({
      parent: { page_id: taskId },
      rich_text: [{ text: { content: commentContent } }],
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment to Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
