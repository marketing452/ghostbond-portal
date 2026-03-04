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
      const richText: any[] = c.rich_text || [];

      // Full plain text across all blocks
      const fullText = richText.map((rt: any) => rt.plain_text).join('');

      let text = fullText;
      let displayName = 'Unknown';
      let fileUrls: string[] = [];

      // Portal comment — starts with [email]
      const emailMatch = fullText.match(/^\[([^\]]+)\]\s*/);
      if (emailMatch) {
        const senderEmail = emailMatch[1];
        displayName = senderEmail.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        text = fullText.slice(emailMatch[0].length);

        // File URLs stored as linked rich_text blocks after the first
        fileUrls = richText
          .slice(1)
          .filter((rt: any) => rt.href || rt.text?.link?.url)
          .map((rt: any) => rt.href || rt.text?.link?.url);

        // Also handle old __files__: format for backwards compatibility
        const fileMarker = '\n__files__:';
        const markerIdx = text.lastIndexOf(fileMarker);
        if (markerIdx !== -1) {
          try {
            fileUrls = JSON.parse(text.slice(markerIdx + fileMarker.length));
          } catch {}
          text = text.slice(0, markerIdx);
        }
      } else {
        // Native Notion comment — use created_by field
        const person = c.created_by;
        if (person?.name) {
          displayName = person.name;
        } else if (person?.person?.email) {
          displayName = person.person.email.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else if (person?.id) {
          displayName = 'Notion User';
        }
        text = fullText;
      }

      return {
        id: c.id,
        text: text.trim(),
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
    const notion = getNotionClient();

    const richText: any[] = [
      {
        type: 'text',
        text: { content: `[${email}] ${text || ''}`.trim() },
      },
    ];

    if (fileUrls && fileUrls.length > 0) {
      for (const url of fileUrls) {
        const filename = decodeURIComponent(url.split('/').pop() || 'File').split('?')[0];
        richText.push({
          type: 'text',
          text: {
            content: `\n📎 ${filename}`,
            link: { url },
          },
        });
      }
    }

    const newComment = await notion.comments.create({
      parent: { page_id: taskId },
      rich_text: richText,
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment to Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
