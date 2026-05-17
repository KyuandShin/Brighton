import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { getGradeLabel } from '../../ai/questions/bank';

export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Verify the user is a tutor or admin
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { tutorProfile: true },
    });

    if (!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only tutors and admins can view student assessments' }, { status: 403 });
    }

    // If tutor, verify they have a booking with this student
    if (user.role === 'TUTOR' && user.tutorProfile) {
      const hasBooking = await prisma.booking.findFirst({
        where: {
          tutorId: user.tutorProfile.id,
          studentId: studentId,
        },
      });
      if (!hasBooking) {
        return NextResponse.json({ error: 'You are not this student\'s tutor' }, { status: 403 });
      }
    }

    // Fetch the student's AI assessment attempts
    const attempts = await prisma.attempt.findMany({
      where: {
        studentId: studentId,
        testId: null, // only AI assessments
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Get the student name
    const studentProfile = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true } } },
    });

    const transformed = attempts.map(a => ({
      id: a.id,
      score: a.score,
      total: a.total,
      mastery: a.mastery,
      grade: a.grade,
      grade_label: a.grade ? getGradeLabel(a.grade) : 'Placement Test',
      strengths: a.strengths,
      weaknesses: a.weaknesses,
      studyPlan: a.studyPlan,
      timestamp: a.timestamp,
    }));

    return NextResponse.json({
      studentName: studentProfile?.user?.name ?? 'Student',
      attempts: transformed,
    });
  } catch (error) {
    console.error('Failed to fetch student assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch student assessments' }, { status: 500 });
  }
}