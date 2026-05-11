import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { theme } = await request.json();
    
    if (!theme) {
      return NextResponse.json({ error: 'theme is required' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: data.user.id },
      data: { theme },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error('Failed to update theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
