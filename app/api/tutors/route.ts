import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tutors — list all APPROVED tutors
export async function GET(req: NextRequest) {
  try {
    const tutors = await prisma.tutor.findMany({
      where: { verificationStatus: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        subjects: { include: { subject: true } },
        reviews: { select: { rating: true } },
        availability: true,
      },
    });

    const formatted = tutors.map((t) => {
      const ratings = t.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;

      return {
        id: t.id,
        userId: t.user.id,
        name: t.user.name ?? 'Unknown Tutor',
        email: t.user.email,
        image: t.user.image,
        headline: t.headline,
        bio: t.bio,
        introVideoUrl: t.introVideoUrl,
        pricingPerHour: t.pricingPerHour,
        subjects: t.subjects.map((ts) => ts.subject.name),
        rating: avgRating,
        reviewCount: t.reviews.length,
        availability: t.availability,
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('[GET /api/tutors]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
