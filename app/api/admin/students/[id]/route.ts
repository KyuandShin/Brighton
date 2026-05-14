import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { deleteNeonAuthUser } from '@/lib/neon-auth';

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
