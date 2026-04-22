import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/profile — update user + student/tutor profile fields
export async function PATCH(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { name, age, schoolName, schoolLevel, headline, bio, pricingPerHour } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update base user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { ...(name ? { name } : {}) },
    });

    if (user.role === 'STUDENT' && user.studentProfile) {
      await prisma.student.update({
        where: { id: user.studentProfile.id },
        data: {
          ...(age !== undefined ? { age: parseInt(age) } : {}),
          ...(schoolName !== undefined ? { schoolName } : {}),
          ...(schoolLevel !== undefined ? { schoolLevel } : {}),
        },
      });
    }

    if (user.role === 'TUTOR' && user.tutorProfile) {
      await prisma.tutor.update({
        where: { id: user.tutorProfile.id },
        data: {
          ...(headline !== undefined ? { headline } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(pricingPerHour !== undefined ? { pricingPerHour: parseFloat(pricingPerHour) } : {}),
        },
      });
    }

    // Return updated user
    const updated = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
        tutorProfile: { include: { subjects: { include: { subject: true } }, availability: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH /api/profile]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
