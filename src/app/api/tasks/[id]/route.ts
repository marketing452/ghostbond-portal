import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';
import { isManager, isAuthorizedDomain } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const { email, status, dueDate, assignedToEmails } = body;
  const notion = getNotionClient();

  if (!email || !isAuthorizedDomain(email)) {
    return NextResponse.json({ error: 'Unauthorized domain or missing email' }, { status: 403 });
  }

  const isMgr = isManager(email);
  if (!isMgr) {
    return NextResponse.json({ error: 'Manager privileges required to edit tasks' }, { status: 403 });
  }

  const properties: any = {};

  if (status) {
    properties['Status'] = { status: { name: status } };
  }
  if (dueDate !== undefined) {
    // dueDate can be null to clear
    properties['Due Date'] = { date: dueDate ? { start: dueDate } : null };
  }
  if (assignedToEmails && Array.isArray(assignedToEmails)) {
    // Find User UUIDs for assigned emails
    let userIds: string[] = [];
    try {
      const usersResponse = await notion.users.list({});
      userIds = usersResponse.results
        .filter((u: any) => u.type === 'person' && u.person?.email && assignedToEmails.includes(u.person.email.toLowerCase()))
        .map((u: any) => u.id);
    } catch(e) {
      console.error('Error fetching Notion users:', e);
      // Optionally handle this error more gracefully, e.g., return a specific error response
    }
    properties['Assigned To'] = { people: userIds.map(id => ({ id })) };
  }

  try {
    const updatedPage = await notion.pages.update({
      page_id: id,
      properties,
    });
    return NextResponse.json({ success: true, updatedPage });
  } catch (error: any) {
    console.error('Error updating task in Notion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
