import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json({ error: 'tutorId is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { tutorId },
      include: {
        student: {
          include: { user: { select: { name: true, image: true } } },
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

    const review = await prisma.review.create({
      data: {
        studentId: user.studentProfile.id,
        tutorId,
        bookingId: bookingId || null,
        rating,
        comment: comment || null,
      },
    });

    // Update tutor's average rating
    const allReviews = await prisma.review.findMany({
      where: { tutorId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    return NextResponse.json({ ...review, avgRating });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
