import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      where: { rating: { gte: 4 } },
      include: {
        student: {
          include: { user: { select: { name: true, image: true } } },
        },
        tutor: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(reviews, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Featured reviews API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}