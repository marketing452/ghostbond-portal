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

      // Extract email from [email] prefix added during POST
      let rawText = fullText;
      let createdBy = 'Unknown';
      const emailMatch = fullText.match(/^\[([^\]]+)\]\s*/);
      if (emailMatch) {
        createdBy = emailMatch[1];
        rawText = fullText.slice(emailMatch[0].length);
      }

      // Convert email to display name e.g. "madan.haribhat@prohairlabs.com" → "Madan Haribhat"
      const displayName = createdBy.includes('@')
        ? createdBy.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : createdBy;

      // Parse file URLs appended as JSON
      let text = rawText;
      let fileUrls: string[] = [];
      const fileMarker = '\n__files__:';
      const markerIdx = rawText.lastIndexOf(fileMarker);
      if (markerIdx !== -1) {
        text = rawText.slice(0, markerIdx);
        try {
          fileUrls = JSON.parse(rawText.slice(markerIdx + fileMarker.length));
        } catch {}
      }

      return {
        id: c.id,
        text,
        fileUrls,
        createdTime: c.created_time,
        createdBy: displayName,
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
