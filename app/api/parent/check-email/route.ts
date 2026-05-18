import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Check if a parent email has any linked students.
 * Returns an array of student names/schools so the parent can confirm.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find students with this parent email, excluding already-linked ones
    const students = await prisma.student.findMany({
      where: {
        parentEmail: normalizedEmail,
        parentId: null, // not yet linked
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Check if a parent account already exists with this email
    const existingParent = await prisma.user.findFirst({
      where: { email: normalizedEmail, role: 'PARENT' },
    });

    return NextResponse.json({
      students: students.map(s => ({
        id: s.id,
        name: s.user.name || 'Student',
        schoolLevel: s.schoolLevel,
        gradeLevel: s.gradeLevel,
        age: s.age,
        schoolName: s.schoolName,
      })),
      hasExistingParent: !!existingParent,
    });
  } catch (err: unknown) {
    console.error('[PARENT CHECK EMAIL]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}