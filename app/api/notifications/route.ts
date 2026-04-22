import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications — fetch all notifications for logged-in user
export async function GET() {
  try {
    const { data } = await auth.getSession();
    if (!data?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: data.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  try {
    const { data: patchData } = await auth.getSession();
    if (!patchData?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: patchData.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
