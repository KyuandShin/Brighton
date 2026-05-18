import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';
import { sendEmail, parentNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, schoolName, age, parentEmail, schoolLevel, image, gradeLevel, subjects } = body;

    // Normalize email consistently everywhere
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    console.log('[SIGNUP] Starting student signup for:', normalizedEmail);

    if (!normalizedEmail || !password || !fullName || !age || !schoolLevel) {
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
        email: normalizedEmail,
        password,
        name: fullName.trim(),
      });

      if (authError) {
        const msg = authError.message || '';
        console.warn('[SIGNUP] Neon Auth signUp error:', msg);
        
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          authUserId = (authError as any)?.userId || (authError as any)?.user?.id || (authError as any)?.data?.id;
          
          if (!authUserId) {
            const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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

    const parsedGrade = gradeLevel ?? null;
    
    const parsedSubjects: string[] = Array.isArray(subjects) 
      ? subjects.filter((s: string) => ['Mathematics', 'Science', 'Filipino', 'English'].includes(s))
      : [];

    const normalizedParentEmail = parsedAge < 18 && parentEmail ? parentEmail.trim().toLowerCase() : null;

    // 2. Create User + Student profile — isVerified remains false until OTP confirmed
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
        email: normalizedEmail,
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
    console.log('[SIGNUP] Student account created successfully:', normalizedEmail);

    // 3. Send parent notification email if student is under 18
    if (normalizedParentEmail) {
      const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/join?email=${encodeURIComponent(normalizedParentEmail)}&student=${encodeURIComponent(fullName.trim())}`;
      sendEmail({
        to: normalizedParentEmail,
        subject: `${fullName.trim()} created a Brighton account — Create your parent account`,
        html: parentNotificationEmail({
          parentName: normalizedParentEmail,
          studentName: fullName.trim(),
          signupUrl,
        }),
      });
    }

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
