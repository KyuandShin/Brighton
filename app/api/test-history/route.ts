import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { getGradeLabel } from '../ai/questions/bank';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only students can view test history' }, { status: 403 });
    }

    const attempts = await prisma.attempt.findMany({
      where: { studentId: user.studentProfile.id },
      include: {
        test: {
          include: { subject: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Transform attempts to a unified format
    const transformed = attempts.map((a) => {
      // AI assessment attempt (no testId)
      if (!a.testId) {
        return {
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
          type: 'ai_assessment' as const,
          // For display purposes
          subject_name: 'AI Assessment',
          level_label: a.grade ? getGradeLabel(a.grade) : 'Placement Test',
        };
      }
      // Legacy test attempt
      return {
        id: a.id,
        score: a.score,
        total: a.total,
        mastery: a.mastery,
        grade: a.grade,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        studyPlan: a.studyPlan,
        timestamp: a.timestamp,
        type: 'subject_test' as const,
        subject_name: a.test?.subject?.name ?? 'Unknown',
        level_label: a.test?.level ?? '',
        test: a.test,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Failed to fetch test history:', error);
    return NextResponse.json({ error: 'Failed to fetch test history' }, { status: 500 });
  }
}