import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
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

    // ── Core analytics ─────────────────────────────────────────────────
    const [
      totalTutors,
      totalStudents,
      totalBookings,
      pendingTutors,
      approvedTutors,
      rejectedTutors,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalAdmins,
      totalUsers,
      recentBookings,
      recentTutors,
      recentStudents,
    ] = await Promise.all([
      prisma.tutor.count(),
      prisma.student.count(),
      prisma.booking.count(),
      prisma.tutor.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.tutor.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.tutor.count({ where: { verificationStatus: 'REJECTED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          student: { include: { user: { select: { name: true, email: true, image: true } } } },
          tutor: { include: { user: { select: { name: true, email: true, image: true } } } },
        },
      }),
      prisma.tutor.findMany({
        take: 5,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: { select: { name: true, email: true, image: true, createdAt: true } },
        },
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: { select: { name: true, email: true, image: true, createdAt: true } },
        },
      }),
    ]);

    // ── Monthly trends (last 6 months) ─────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await prisma.booking.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });

    const monthlyUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group bookings by month
    const bookingsByMonth: Record<string, { total: number; confirmed: number; pending: number; completed: number; cancelled: number }> = {};
    for (const b of monthlyBookings) {
      const key = b.date.toISOString().slice(0, 7); // YYYY-MM
      if (!bookingsByMonth[key]) bookingsByMonth[key] = { total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
      bookingsByMonth[key].total++;
      const status = b.status.toLowerCase();
      if (bookingsByMonth[key][status as keyof typeof bookingsByMonth[string]] !== undefined) {
        (bookingsByMonth[key] as any)[status]++;
      }
    }

    // Group users by month
    const usersByMonth: Record<string, { total: number; tutors: number; students: number }> = {};
    for (const u of monthlyUsers) {
      const key = u.createdAt.toISOString().slice(0, 7);
      if (!usersByMonth[key]) usersByMonth[key] = { total: 0, tutors: 0, students: 0 };
      usersByMonth[key].total++;
      if (u.role === 'TUTOR') usersByMonth[key].tutors++;
      if (u.role === 'STUDENT') usersByMonth[key].students++;
    }

    return NextResponse.json({
      totals: {
        tutors: totalTutors,
        students: totalStudents,
        bookings: totalBookings,
        users: totalUsers,
        admins: totalAdmins,
      },
      tutorBreakdown: {
        pending: pendingTutors,
        approved: approvedTutors,
        rejected: rejectedTutors,
      },
      bookingBreakdown: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      trends: {
        bookingsByMonth,
        usersByMonth,
      },
      recent: {
        bookings: recentBookings.map(b => ({
          id: b.id,
          date: b.date,
          status: b.status,
          meetLink: b.meetLink,
          student: b.student.user,
          tutor: b.tutor.user,
        })),
        tutors: recentTutors.map(t => ({
          id: t.id,
          status: t.verificationStatus,
          user: t.user,
        })),
        students: recentStudents.map(s => ({
          id: s.id,
          schoolLevel: s.schoolLevel,
          gradeLevel: s.gradeLevel,
          user: s.user,
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}