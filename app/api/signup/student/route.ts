import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';
import { sendEmail, emailVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

// Get base URL for verification links
function getBaseUrl(req: NextRequest) {
  // 1. Explicit env var
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  
  // 2. Derive from request (most reliable for production)
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');
  if (host) return `${protocol}://${host}`;
  
  // 3. Fallback
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, schoolName, age, parentEmail, schoolLevel, image, gradeLevel } = body;

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

    // Validate and parse grade level
    const parsedGrade = gradeLevel ? parseInt(gradeLevel) : null;

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
            },
            update: {
              schoolLevel: schoolLevel as 'ELEMENTARY' | 'HIGH_SCHOOL',
              gradeLevel: parsedGrade,
              age: parsedAge,
              schoolName: schoolName ?? null,
              parentEmail: parsedAge < 18 ? (parentEmail ?? null) : null,
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
          },
        },
      },
    });

    // 3. Generate verification token and send email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old tokens for this email to keep it clean
    await prisma.verificationToken.deleteMany({ where: { email: email.trim() } });

    await prisma.verificationToken.create({
      data: {
        email: email.trim(),
        token: verificationToken,
        expiresAt,
      },
    });

    const baseUrl = getBaseUrl(req);
    const verificationUrl = `${baseUrl}/api/verify-email?token=${verificationToken}`;

    const emailSent = await sendEmail({
      to: email.trim(),
      subject: 'Verify your Brighton Academic account',
      html: emailVerificationEmail({
        name: fullName,
        email: email.trim(),
        verificationUrl,
      }),
    });

    if (!emailSent) {
      console.error('[SIGNUP] Failed to send verification email to:', email);
      // We still return success but maybe with a warning in logs
    }

    console.log('[SIGNUP] Verification email sent to:', email, 'URL:', verificationUrl);

    return NextResponse.json({ 
      success: true, 
      requiresVerification: true,
      message: 'Account created! Please check your email to verify your account before logging in.'
    });
  } catch (err: unknown) {
    console.error('[STUDENT SIGNUP]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
