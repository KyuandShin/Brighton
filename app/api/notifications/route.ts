import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications — fetch all notifications for logged-in user
export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: data.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const { data: patchData } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!patchData?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: patchData.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
