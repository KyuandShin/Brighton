import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns parent dashboard data:
 * - Linked students with their profiles
 * - Assessment scores per student
 * - Upcoming bookings per student
 * - Session progress
 */
export async function GET(req: NextRequest) {
  try {
    const { data: session, error } = await auth.getSession({
      fetchOptions: { headers: req.headers },
    });

    if (error || !session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get parent profile with students
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            user: {
              select: { name: true, email: true, id: true },
            },
            bookings: {
              include: {
                tutor: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
              orderBy: { date: 'desc' },
              take: 10,
            },
            attempts: {
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    // Format response
    const students = parentProfile.students.map(student => {
      const latestAttempt = student.attempts[0] || null;
      const upcomingBookings = student.bookings.filter(
        b => b.status === 'CONFIRMED' && new Date(b.date) >= new Date()
      );
      const recentBookings = student.bookings.slice(0, 5);

      return {
        id: student.id,
        name: student.user.name || 'Student',
        email: student.user.email,
        schoolLevel: student.schoolLevel,
        gradeLevel: student.gradeLevel,
        age: student.age,
        schoolName: student.schoolName,
        subjects: student.subjects,
        latestAssessment: latestAttempt ? {
          score: latestAttempt.score,
          total: latestAttempt.total,
          mastery: latestAttempt.mastery,
          grade: latestAttempt.grade,
          strengths: latestAttempt.strengths,
          weaknesses: latestAttempt.weaknesses,
          timestamp: latestAttempt.timestamp,
        } : null,
        upcomingBookings: upcomingBookings.map(b => ({
          id: b.id,
          date: b.date,
          status: b.status,
          meetLink: b.meetLink,
          tutorName: b.tutor?.user?.name || 'Tutor',
        })),
        recentBookings: recentBookings.map(b => ({
          id: b.id,
          date: b.date,
          status: b.status,
          tutorName: b.tutor?.user?.name || 'Tutor',
        })),
        sessionCount: student.bookings.filter(b => b.status === 'COMPLETED').length,
      };
    });

    return NextResponse.json({
      students,
      totalStudents: students.length,
    });
  } catch (err: unknown) {
    console.error('[PARENT DASHBOARD]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}