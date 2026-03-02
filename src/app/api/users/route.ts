import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export async function GET() {
  try {
    const notion = getNotionClient();
    const response = await notion.users.list({});
    const people = response.results
      .filter((u: any) => u.type === 'person')
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.person?.email || null,
        avatar_url: u.avatar_url || null,
      }));
    return NextResponse.json({ users: people });
  } catch (error: any) {
    console.error('Error fetching notion users:', error.body || error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
