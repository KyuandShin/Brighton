import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

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

    const adminUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First get the student to find the associated userId
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Delete all related records in correct order (respect foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete dependent records
      await tx.sessionNote.deleteMany({ where: { booking: { studentId: params.id } } });
      await tx.review.deleteMany({ where: { studentId: params.id } });
      await tx.booking.deleteMany({ where: { studentId: params.id } });
      await tx.attempt.deleteMany({ where: { studentId: params.id } });
      
      // Delete student profile
      await tx.student.delete({ where: { id: params.id } });
      
      // Delete main user account
      await tx.user.delete({ where: { id: student.userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Student delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}