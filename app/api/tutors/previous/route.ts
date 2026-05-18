import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET /api/tutors/previous — returns tutors the current student has booked before, with booking count
export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Only for students
    if (user.role !== 'STUDENT' || !user.studentProfile) {
      return NextResponse.json([]);
    }

    // Group bookings by tutorId, count them, and get last booked date
    const bookings = await prisma.booking.findMany({
      where: {
        studentId: user.studentProfile.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: {
        tutorId: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate by tutor
    const tutorCountMap = new Map<string, { count: number; lastBooked: Date }>();
    for (const b of bookings) {
      const existing = tutorCountMap.get(b.tutorId);
      if (existing) {
        existing.count++;
      } else {
        tutorCountMap.set(b.tutorId, { count: 1, lastBooked: b.date });
      }
    }

    if (tutorCountMap.size === 0) {
      return NextResponse.json([]);
    }

    // Fetch tutor details for all booked tutors
    const tutorIds = Array.from(tutorCountMap.keys());
    const tutors = await prisma.tutor.findMany({
      where: { id: { in: tutorIds }, verificationStatus: 'APPROVED' },
      include: {
        user: { select: { name: true, image: true } },
        subjects: { include: { subject: true } },
      },
    });

    // Build response sorted by booking count desc, then last booked desc
    const result = tutors
      .map((t) => {
        const stats = tutorCountMap.get(t.id)!;
        return {
          tutor: {
            id: t.id,
            name: t.user.name ?? 'Unknown Tutor',
            image: t.user.image,
            headline: t.headline,
            subjects: t.subjects.map((s) => s.subject.name),
            rating: t.averageRating ? Math.round(t.averageRating * 10) / 10 : null,
            reviewCount: t.reviewCount,
          },
          bookingCount: stats.count,
          lastBooked: stats.lastBooked.toISOString(),
        };
      })
      .sort((a, b) => {
        if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
        return new Date(b.lastBooked).getTime() - new Date(a.lastBooked).getTime();
      });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('[GET /api/tutors/previous]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}