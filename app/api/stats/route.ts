import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalTutors,
      approvedTutors,
      totalStudents,
      completedBookings,
      totalReviews,
    ] = await Promise.all([
      prisma.tutor.count(),
      prisma.tutor.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.student.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.review.count(),
    ]);

    return NextResponse.json({
      tutors: approvedTutors,
      totalTutors,
      students: totalStudents,
      completedSessions: completedBookings,
      reviews: totalReviews,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      tutors: 0,
      totalTutors: 0,
      students: 0,
      completedSessions: 0,
      reviews: 0,
    });
  }
}