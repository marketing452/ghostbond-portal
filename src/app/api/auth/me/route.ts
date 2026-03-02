import { NextResponse } from 'next/server';
import { isManager } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ isManager: false });
  }
  
  const managerStatus = isManager(email);
  return NextResponse.json({ isManager: managerStatus });
}
