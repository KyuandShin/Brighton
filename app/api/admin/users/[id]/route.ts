import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers },
    });
    const sessionUserId = data?.user?.id;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === sessionUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Verify user exists
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 1: Delete from Prisma (cascades to Student/Tutor/Bookings/etc. via onDelete: Cascade)
    await prisma.user.delete({ where: { id } });

    // Step 2: Delete from Neon Auth using the Better Auth admin API
    // The user ID in our DB matches the auth user ID (Better Auth uses the same ID)
    const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
    if (neonAuthBaseUrl) {
      try {
        const adminRes = await fetch(`${neonAuthBaseUrl}/admin/remove-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id }),
        });
        if (!adminRes.ok) {
          // Log but don't fail — Prisma delete already succeeded
          console.warn('Neon Auth delete warning:', await adminRes.text());
        }
      } catch (authErr) {
        console.warn('Neon Auth delete error (non-fatal):', authErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
