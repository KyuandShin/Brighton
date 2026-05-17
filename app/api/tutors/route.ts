import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tutors — list all APPROVED tutors
// Query params:
//   sort=best   → sorted by rating (desc) then review count (desc)
//   sort=rising → sorted by newest tutors with decent ratings
//   limit=n     → limit results (default: all)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const tutors = await prisma.tutor.findMany({
      where: { verificationStatus: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, image: true, createdAt: true } },
        subjects: { include: { subject: true } },
        availability: true,
      },
    });

    // Batch-load recent review counts for "rising" sort
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviewCounts = await prisma.review.groupBy({
      by: ['tutorId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _avg: { rating: true },
    });
    const recentMap = new Map(recentReviewCounts.map(r => [r.tutorId, { count: r._count.id, avg: r._avg.rating ?? 0 }]));

    let formatted = tutors.map((t) => {
      const recent = recentMap.get(t.id);
      const recentReviewCount = recent?.count ?? 0;
      const recentRating = recent?.avg ? Math.round(recent.avg * 10) / 10 : 0;

      return {
        id: t.id,
        userId: t.user.id,
        name: t.user.name ?? 'Unknown Tutor',
        image: t.user.image,
        headline: t.headline,
        bio: t.bio,
        introVideoUrl: t.introVideoUrl,
        pricingPerHour: t.pricingPerHour,
        subjects: t.subjects.map((ts) => ts.subject.name),
        rating: t.averageRating ? Math.round(t.averageRating * 10) / 10 : null,
        reviewCount: t.reviewCount,
        availability: t.availability,
        createdAt: t.user.createdAt.toISOString(),
        recentRating,
        recentReviewCount,
      };
    });

    // Apply sorting
    if (sort === 'best') {
      formatted.sort((a, b) => {
        // Sort by rating first (desc), then by review count (desc)
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return b.reviewCount - a.reviewCount;
      });
    } else if (sort === 'rising') {
      formatted.sort((a, b) => {
        // Rising score: combination of recent reviews + overall rating
        // Higher weight for recent activity
        const scoreA = a.recentRating * 2 + a.recentReviewCount + (a.rating ?? 0) * 0.5;
        const scoreB = b.recentRating * 2 + b.recentReviewCount + (b.rating ?? 0) * 0.5;
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Fallback: newer tutors first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    if (limit && limit > 0) {
      formatted = formatted.slice(0, limit);
    }

    return NextResponse.json(formatted, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('[GET /api/tutors]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
