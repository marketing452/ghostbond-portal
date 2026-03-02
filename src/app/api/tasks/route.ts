import { NextResponse } from 'next/server';
import { getNotionClient, getDatabaseId } from '@/lib/notion';
import { isManager, isAuthorizedDomain } from '@/lib/auth';
import type { Task } from '@/types/task';

function mapNotionPropertiesToTask(pageId: string, properties: any): Task {
  return {
    id: pageId,
    name: properties['Task Name']?.title?.[0]?.plain_text || 'Untitled',
    status: properties['Status']?.status?.name || 'Requests',
    channel: properties['Channel']?.multi_select?.map((s: any) => s.name) || [],
    creativeType: properties['Creative Type']?.multi_select?.map((s: any) => s.name) || [],
    // Assigned to is people, Requested By is an email text property directly
    assignedTo: properties['Assigned To']?.people?.map((p: any) => p.name || p.person?.email) || [],
    requestedBy: properties['Requested By']?.email ? [properties['Requested By'].email] : [],
    dueDate: properties['Due Date']?.date?.start || null,
    effort: properties['Effort']?.select?.name || null,
    deliverable: properties['Deliverable']?.url || null,
    brief: properties['Brief']?.rich_text?.[0]?.plain_text || null,
    fileLink: properties['Files & media']?.files?.[0]?.external?.url || properties['Files & media']?.files?.[0]?.file?.url || null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain or missing email' }, { status: 403 });
  }

  try {
    const isMgr = isManager(email);
    console.log('[DEBUG] isManager check for', email, ':', isMgr);
    let filter: any = undefined;

    if (!isMgr) {
      // Filter strictly by the Requested By Email property natively in Notion querying
      filter = {
        property: 'Requested By',
        email: {
          equals: email
        }
      };
    } else {
      console.log('[DEBUG] User is Manager, bypassing Notion filter to fetch all tasks.');
    }
    
    const DATABASE_ID = getDatabaseId();
    const queryPayload: any = {
      database_id: DATABASE_ID,
      data_source_id: DATABASE_ID, // added for v5 compat if necessary
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        }
      ],
      page_size: 100,
    };

    if (filter) {
      queryPayload.filter = filter;
    }
    
    console.log('[DEBUG] Querying Notion with email:', email);
    console.log('[DEBUG] Payload:', JSON.stringify(queryPayload));

    // Fetch from Notion
    // Format UUID with hyphens
    const formattedId = DATABASE_ID.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    // Using native fetch because v5.11.0 SDK removed databases.query and notion.request URL validation fails
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${formattedId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: queryPayload.filter,
        sorts: queryPayload.sorts,
        page_size: queryPayload.page_size
      })
    });

    const response = await notionRes.json();

    if (!notionRes.ok) {
      throw new Error(response.message || 'Error fetching from Notion REST API');
    }

    console.log('[DEBUG] Notion returned', response.results?.length || 0, 'results');

    const tasks: Task[] = response.results.map((page: any) => 
      mapNotionPropertiesToTask(page.id, page.properties)
    );

    return NextResponse.json({ tasks, isManager: isMgr });
  } catch (error: any) {
    console.error('Error fetching tasks from Notion:', error?.body || error);
    return NextResponse.json({ error: error?.body?.message || error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, taskName, brief, channel, dueDate, requestedById, fileLink } = body;

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain or missing email' }, { status: 403 });
  }

  try {

    const properties: any = {
      'Task Name': { title: [{ text: { content: taskName || 'New Request' } }] },
      'Status': { status: { name: 'Requests' } },
    };

    if (brief) {
      properties['Brief'] = { rich_text: [{ text: { content: brief } }] };
    }
    if (channel && channel.length > 0) {
      properties['Channel'] = { multi_select: channel.map((c: string) => ({ name: c })) };
    }
    if (dueDate) {
      properties['Due Date'] = { date: { start: dueDate } };
    }
    
    // Natively bind the user's session email to the Notion Email property
    properties['Requested By'] = { email: email.toLowerCase() };
    
    // In next phase we will replace this fileLink setup with Vercel Blob parsing (handled by FormData)
    if (fileLink) {
      properties['Files & media'] = { files: [{ type: "external", name: "Link", external: { url: fileLink } }] };
    }

    const notion = getNotionClient();
    const DATABASE_ID = getDatabaseId();

    const newPage = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties,
    });

    return NextResponse.json({ success: true, task: mapNotionPropertiesToTask(newPage.id, (newPage as any).properties) });
  } catch (error: any) {
    console.error('Error creating task in Notion:', error?.body || error);
    return NextResponse.json({ error: error?.body?.message || error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
