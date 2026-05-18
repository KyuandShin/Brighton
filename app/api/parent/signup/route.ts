import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

/**
 * Parent signs up (creates an account) and links to their students.
 * Flow:
 * 1. Create auth user via Neon Auth
 * 2. Create User with PARENT role + ParentProfile
 * 3. Link to students that have this email as parentEmail
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, studentIds } = body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // 1. Register with Neon Auth
    let authUserId: string | null = null;

    try {
      const { data: authData, error: authError } = await auth.signUp.email({
        email: normalizedEmail,
        password,
        name: fullName.trim(),
      });

      if (authError) {
        const msg = authError.message || '';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          authUserId = (authError as any)?.userId || (authError as any)?.user?.id;

          if (!authUserId) {
            const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            authUserId = existingUser?.id || null;
          }

          if (authUserId) {
            // Check if user is already a parent
            const existingUser = await prisma.user.findUnique({
              where: { id: authUserId },
              include: { parentalProfile: true },
            });
            if (existingUser?.role === 'PARENT') {
              // Parent already exists — just link students
              if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
                await prisma.student.updateMany({
                  where: { id: { in: studentIds }, parentEmail: normalizedEmail },
                  data: { parentId: existingUser.parentalProfile?.id ?? null },
                });
              }
              return NextResponse.json({ success: true, message: 'Students linked to your account!' });
            }
            return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
          } else {
            return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: msg || 'Registration failed.' }, { status: 400 });
        }
      } else {
        authUserId = authData?.user?.id ?? (authData as any)?.id;
      }
    } catch (authErr) {
      console.error('[PARENT SIGNUP] Auth error:', authErr);
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        return NextResponse.json({ error: 'Authentication service unavailable. Please try again later.' }, { status: 500 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not retrieve auth user ID' }, { status: 500 });
    }

    // 2. Create User with PARENT role + ParentProfile, link students
    await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name: fullName.trim(),
        role: 'PARENT',
      },
      create: {
        id: authUserId,
        email: normalizedEmail,
        name: fullName.trim(),
        role: 'PARENT',
        isVerified: false,
        parentalProfile: {
          create: {},
        },
      },
    });

    // Ensure ParentProfile exists
    let parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: authUserId },
    });

    if (!parentProfile) {
      parentProfile = await prisma.parentProfile.create({
        data: { userId: authUserId },
      });
    }

    // 3. Link students
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
          parentEmail: normalizedEmail,
        },
        data: { parentId: parentProfile.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Parent account created! You can now monitor your child\'s progress.',
    });
  } catch (err: unknown) {
    console.error('[PARENT SIGNUP]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}