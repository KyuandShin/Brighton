import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { data } = await auth.getSession();
    const userId = data?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query Tutor table directly — guarantees all signups appear in the dashboard
    const tutors = await prisma.tutor.findMany({
      include: {
        user: true,
        education: true,
        certifications: true,
        availability: true,
      },
      // Order by the creation date of the tutor profile itself as a fallback
      orderBy: {
        id: 'desc',
      },
    });

    const formatted = tutors
      .filter(t => !!t.user) // Safety check: skip tutors with no user
      .map((tutor) => ({
        id: tutor.id,
        userId: tutor.userId,
        verificationStatus: tutor.verificationStatus,
        headline: tutor.headline,
        bio: tutor.bio,
        pricingPerHour: tutor.pricingPerHour,
        createdAt: tutor.user.createdAt,
        user: {
          id: tutor.user.id,
          name: tutor.user.name ?? 'Unnamed',
          email: tutor.user.email,
          image: tutor.user.image,
          createdAt: tutor.user.createdAt,
        },
      }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Admin tutors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
