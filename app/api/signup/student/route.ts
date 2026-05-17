import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, schoolName, age, parentEmail, schoolLevel, image, gradeLevel, subjects } = body;

    console.log('[SIGNUP] Starting student signup for:', email);

    if (!email || !password || !fullName || !age || !schoolLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 100) {
      return NextResponse.json({ error: 'Invalid age' }, { status: 400 });
    }

    let authUserId: string | null = null;
    
    // 1. Register with Neon Auth
    try {
      const { data: authData, error: authError } = await auth.signUp.email({
        email: email.trim(),
        password,
        name: fullName.trim(),
      });

      if (authError) {
        const msg = authError.message || '';
        console.warn('[SIGNUP] Neon Auth signUp error:', msg);
        
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          // Attempt to continue registration for existing auth user
          authUserId = (authError as any)?.userId || (authError as any)?.user?.id || (authError as any)?.data?.id;
          
          if (!authUserId) {
            // Check if user exists in our DB at least
            const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
            authUserId = existingUser?.id || null;
          }
          
          if (authUserId) {
            console.log('[SIGNUP] Auth user already exists, proceeding with ID:', authUserId);
          } else {
            return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: msg || 'Registration failed.' }, { status: 400 });
        }
      } else {
        authUserId = authData?.user?.id ?? (authData as any)?.id;
        console.log('[SIGNUP] New auth user created:', authUserId);
      }
    } catch (authErr) {
      console.error('[SIGNUP] Neon Auth service error:', authErr);
      // If auth fails, we might still want to check if the user exists in our DB
      const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        return NextResponse.json({ error: 'Authentication service unavailable. Please try again later.' }, { status: 500 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not retrieve auth user ID' }, { status: 500 });
    }

    // Grade level is already a number from the frontend
    const parsedGrade = gradeLevel ?? null;
    
    // Parse subjects — ensure it's a valid string array
    const parsedSubjects: string[] = Array.isArray(subjects) 
      ? subjects.filter((s: string) => ['Mathematics', 'Science', 'Filipino', 'English'].includes(s))
      : [];

    // 2. Create User + Student profile — isVerified remains false
    await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name: fullName.trim(),
        role: 'STUDENT',
        image: image ?? null,
        studentProfile: {
          upsert: {
            create: {
              schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
              gradeLevel: parsedGrade,
              age: parsedAge,
              schoolName: schoolName ?? null,
              parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
              subjects: parsedSubjects.length > 0 ? parsedSubjects : ['Mathematics', 'Science', 'Filipino', 'English'],
            },
            update: {
              schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
              gradeLevel: parsedGrade,
              age: parsedAge,
              schoolName: schoolName ?? null,
              parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
              subjects: parsedSubjects.length > 0 ? parsedSubjects : undefined,
            },
          },
        },
      },
      create: {
        id: authUserId,
        email: email.trim(),
        name: fullName.trim(),
        role: 'STUDENT',
        isVerified: false,
        image: image ?? null,
        studentProfile: {
          create: {
            schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
            gradeLevel: parsedGrade,
            age: parsedAge,
            schoolName: schoolName ?? null,
            parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
            subjects: parsedSubjects.length > 0 ? parsedSubjects : ['Mathematics', 'Science', 'Filipino', 'English'],
          },
        },
      },
    });
    console.log('[SIGNUP] Student account created successfully:', email);

    return NextResponse.json({ 
      success: true, 
      requiresVerification: true,
      message: 'Account created! Please check your email for the verification code to complete signup.'
    });
  } catch (err: unknown) {
    console.error('[STUDENT SIGNUP]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
