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

      // First block contains "[email] comment text"
      const firstBlock = richText[0]?.plain_text || '';
      let text = firstBlock;
      let createdBy = 'Unknown';

      const emailMatch = firstBlock.match(/^\[([^\]]+)\]\s*/);
      if (emailMatch) {
        createdBy = emailMatch[1];
        text = firstBlock.slice(emailMatch[0].length);
      }

      // Convert email to display name
      const displayName = createdBy.includes('@')
        ? createdBy.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : createdBy;

      // Remaining blocks with links are file attachments
      const fileUrls: string[] = richText
        .slice(1)
        .filter((rt: any) => rt.href || rt.text?.link?.url)
        .map((rt: any) => rt.href || rt.text?.link?.url);

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

    // Build rich_text: first block is "[email] comment", then one block per file as a named link
    const richText: any[] = [
      {
        type: 'text',
        text: { content: `[${email}] ${text || ''}`.trim() },
      },
    ];

    if (fileUrls && fileUrls.length > 0) {
      for (const url of fileUrls) {
        // Extract a clean filename from the URL
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
```

In Notion it will now look like:
```
[madan.haribhat@prohairlabs.com] Hi check this out
📎 video.mp4          ← clickable link
📎 brief.pdf          ← clickable link
