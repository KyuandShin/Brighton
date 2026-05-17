import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession({
      fetchOptions: { headers: request.headers },
    });
    const isAuthenticated = !!session?.user?.id;

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json({ error: 'tutorId is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { tutorId },
      include: {
        student: {
          include: {
            user: {
              select: {
                // Only expose student names to authenticated users
                name: isAuthenticated,
                image: isAuthenticated,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true },
    });

    if (!user?.studentProfile) {
      return NextResponse.json({ error: 'Only students can post reviews' }, { status: 403 });
    }

    const { tutorId, bookingId, rating, comment } = await request.json();

    if (!tutorId || !rating) {
      return NextResponse.json({ error: 'tutorId and rating are required' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    if (comment && comment.length > 2000) {
      return NextResponse.json({ error: 'Comment must be under 2000 characters' }, { status: 400 });
    }

    // Prevent duplicate reviews for the same booking
    if (bookingId) {
      const existing = await prisma.review.findFirst({
        where: { bookingId },
      });
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this session.' }, { status: 409 });
      }

      // Verify the booking actually belongs to this student
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { studentId: true },
      });
      if (!booking || booking.studentId !== user.studentProfile.id) {
        return NextResponse.json({ error: 'You can only review your own sessions.' }, { status: 403 });
      }
    }

    const review = await prisma.review.create({
      data: {
        studentId: user.studentProfile.id,
        tutorId,
        bookingId: bookingId || null,
        rating,
        comment: comment || null,
      },
    });

    // Update tutor's cached average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { tutorId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.tutor.update({
      where: { id: tutorId },
      data: {
        averageRating: avgRating,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({ ...review, avgRating });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
