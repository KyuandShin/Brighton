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
        user: { select: { id: true, name: true, image: true, email: true, createdAt: true } },
        subjects: { include: { subject: true } },
        reviews: { select: { rating: true, createdAt: true } },
        availability: true,
      },
    });

    let formatted = tutors.map((t) => {
      const ratings = t.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;

      // Calculate recent activity for "rising" — reviews in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReviews = t.reviews.filter((r) => r.createdAt >= thirtyDaysAgo);
      const recentRating =
        recentReviews.length > 0
          ? Math.round((recentReviews.reduce((a, b) => a + b.rating, 0) / recentReviews.length) * 10) / 10
          : 0;

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
        createdAt: t.user.createdAt.toISOString(),
        recentRating,
        recentReviewCount: recentReviews.length,
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

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('[GET /api/tutors]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
