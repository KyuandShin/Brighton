import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tutors/[id] — fetch a single tutor by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, createdAt: true } },
        subjects: { include: { subject: true } },
        availability: true,
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    const formatted = {
      id: tutor.id,
      userId: tutor.user.id,
      name: tutor.user.name ?? 'Unknown Tutor',
      image: tutor.user.image,
      headline: tutor.headline,
      bio: tutor.bio,
      introVideoUrl: tutor.introVideoUrl,
      pricingPerHour: tutor.pricingPerHour,
      subjects: tutor.subjects.map((ts) => ts.subject.name),
      rating: tutor.averageRating ? Math.round(tutor.averageRating * 10) / 10 : null,
      reviewCount: tutor.reviewCount,
      availability: tutor.availability,
      createdAt: tutor.user.createdAt.toISOString(),
    };

    return NextResponse.json(formatted, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error(`[GET /api/tutors/${'id'}]:`, err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}