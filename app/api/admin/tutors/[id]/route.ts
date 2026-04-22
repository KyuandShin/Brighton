import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function PATCH(
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

    const body = await request.json();
    const { verificationStatus } = body;

    if (!['APPROVED', 'REJECTED'].includes(verificationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedTutor = await prisma.tutor.update({
      where: { id: params.id },
      data: { verificationStatus },
      include: { user: true }
    });

    // Sync User verification status with tutor status
    await prisma.user.update({
      where: { id: updatedTutor.userId },
      data: { isVerified: verificationStatus === 'APPROVED' }
    });

    // Send approval email
    if (verificationStatus === 'APPROVED') {
      await sendEmail({
        to: updatedTutor.user.email,
        subject: "✅ Your tutor application has been approved!",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; background: white; border-radius: 16px;">
            <h2 style="color: #5c7cfa; font-weight: 900;">Application Approved!</h2>
            <p>Hi ${updatedTutor.user.name},</p>
            <p>Great news! Your tutor application has been reviewed and approved.</p>
            <p>You can now login to your account and start accepting students.</p>
            <p style="margin-top: 32px; font-size: 12px; color: #868e96;">Brighton Academic</p>
          </div>
        `
      });
    }

    return NextResponse.json(updatedTutor);
  } catch (error) {
    console.error('Tutor status update error:', error);
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

    const adminUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First get the tutor to find the associated userId
    const tutor = await prisma.tutor.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // Delete all related records in correct order (respect foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete many-to-many relations first
      await tx.tutorSubject.deleteMany({ where: { tutorId: params.id } });
      
      // Delete dependent records
      await tx.sessionNote.deleteMany({ where: { tutorId: params.id } });
      await tx.review.deleteMany({ where: { tutorId: params.id } });
      await tx.booking.deleteMany({ where: { tutorId: params.id } });
      await tx.certification.deleteMany({ where: { tutorId: params.id } });
      await tx.education.deleteMany({ where: { tutorId: params.id } });
      await tx.availability.deleteMany({ where: { tutorId: params.id } });
      
      // Delete tutor profile
      await tx.tutor.delete({ where: { id: params.id } });
      
      // Delete main user account (this will also clean up user relations)
      await tx.user.delete({ where: { id: tutor.userId } });
    });

    // Neon Auth automatically syncs deletions when User record is removed from database

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tutor delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
