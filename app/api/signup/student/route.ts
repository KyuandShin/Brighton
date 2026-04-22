import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, schoolName, age, parentEmail, schoolLevel } = body;

    if (!email || !password || !fullName || !age || !schoolLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 100) {
      return NextResponse.json({ error: 'Invalid age' }, { status: 400 });
    }
    if (parsedAge < 18 && !parentEmail) {
      return NextResponse.json(
        { error: 'Parent/guardian email is required for students under 18' },
        { status: 400 }
      );
    }

    // 1. Register with Neon Auth
    const { data: authData, error: authError } = await auth.signUp.email({
      email,
      password,
      name: fullName,
    });

    if (authError) {
      const msg = authError.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
      }
      return NextResponse.json({ error: msg || 'Registration failed.' }, { status: 400 });
    }

    const authUserId: string = authData?.user?.id ?? (authData as any)?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Could not retrieve auth user ID' }, { status: 500 });
    }

    // 2. Create User + Student profile — save ALL fields including age & schoolName
    await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name: fullName,
        role: 'STUDENT',
        studentProfile: {
          upsert: {
            create: {
              schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
              age: parsedAge,
              schoolName: schoolName ?? null,
              parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
            },
            update: {
              schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
              age: parsedAge,
              schoolName: schoolName ?? null,
              parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
            },
          },
        },
      },
      create: {
        id: authUserId,
        email,
        name: fullName,
        role: 'STUDENT',
        isVerified: true,
        studentProfile: {
          create: {
            schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
            age: parsedAge,
            schoolName: schoolName ?? null,
            parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
          },
        },
      },
      include: { studentProfile: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[STUDENT SIGNUP]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
