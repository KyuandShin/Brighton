import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, schoolName, age, parentEmail, schoolLevel, image } = body;

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

    let authUserId: string | null = null;
    
    // 1. Register with Neon Auth
    const { data: authData, error: authError } = await auth.signUp.email({
      email,
      password,
      name: fullName,
    });

    if (authError) {
      const msg = authError.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        // Attempt to continue registration for existing auth user
        authUserId = (authError as any)?.userId || (authError as any)?.user?.id || (authError as any)?.data?.id;
        
        if (authUserId) {
          // Proceed to create database profile for existing auth user
          console.log('[SIGNUP] Auth user already exists, creating database profile:', authUserId);
        } else {
          return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: msg || 'Registration failed.' }, { status: 400 });
      }
    } else {
      authUserId = authData?.user?.id ?? (authData as any)?.id;
    }
    if (!authUserId) {
      return NextResponse.json({ error: 'Could not retrieve auth user ID' }, { status: 500 });
    }

    // 2. Create User + Student profile — save ALL fields including age & schoolName
    await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name: fullName,
        role: 'STUDENT',
        image: image ?? null,
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
        image: image ?? null,
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

    // Auto sign-in after successful registration
    const signInResult = await auth.signIn.email({
      email,
      password,
    });

    if (signInResult.error) {
      console.warn('[SIGNUP] Registration succeeded but auto sign-in failed', signInResult.error);
      // Still return success but tell frontend to manually login
      return NextResponse.json({ 
        success: true, 
        requiresManualLogin: true 
      });
    }

    // Neon Auth automatically sets session cookies
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[STUDENT SIGNUP]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
