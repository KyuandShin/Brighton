import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { deleteNeonAuthUser } from '@/lib/neon-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    const userId = data?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: userId } });
    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            isBanned: true,
            isVerified: true,
          }
        },
        bookings: {
          include: {
            tutor: {
              select: {
                user: { select: { name: true } }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Admin student detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    const userId = data?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: userId } });
    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isBanned } = body;

    if (isBanned === undefined) {
      return NextResponse.json({ error: 'isBanned is required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isBanned },
    });

    return NextResponse.json({ success: true, isBanned });
  } catch (error) {
    console.error('Student ban error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { data } = await auth.getSession();
    const userId = data?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: userId } });
    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the student to find the associated userId
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const authUserId = student.userId;

    // Delete all related records in correct order, then the user (Cascade handles most of it)
    await prisma.$transaction(async (tx) => {
      await tx.sessionNote.deleteMany({ where: { booking: { studentId: params.id } } });
      await tx.review.deleteMany({ where: { studentId: params.id } });
      await tx.booking.deleteMany({ where: { studentId: params.id } });
      await tx.attempt.deleteMany({ where: { studentId: params.id } });
      await tx.student.delete({ where: { id: params.id } });
      await tx.user.delete({ where: { id: authUserId } });
    });

    await deleteNeonAuthUser(authUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Student delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}