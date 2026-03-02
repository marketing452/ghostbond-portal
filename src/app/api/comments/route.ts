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
    const response = await notion.comments.list({
      block_id: taskId,
    });
    
    const comments = response.results.map((c: any) => ({
      id: c.id,
      text: c.rich_text?.map((rt: any) => rt.plain_text).join('') || '',
      createdTime: c.created_time,
      createdBy: c.created_by?.person?.email || c.created_by?.name || 'Unknown',
    }));

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments from Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, taskId, text } = body;

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  if (!taskId || !text) {
    return NextResponse.json({ error: 'Missing taskId or text' }, { status: 400 });
  }

  try {
    // We prefix the comment with the user's email since the actual Notion API comment 
    // is attributed to the integration bot, not the specific user inside the custom portal.
    const commentContent = `[${email}] ${text}`;
    const notion = getNotionClient();

    const newComment = await notion.comments.create({
      parent: { page_id: taskId },
      rich_text: [
        {
          text: {
            content: commentContent,
          },
        },
      ],
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment to Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
