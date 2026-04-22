import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, name, headline, bio,
      university, degree, videoUrl, price,
      availability, certifications,
    } = body;

    // ── 1. Basic validation ────────────────────────────────────────────
    const missing: string[] = [];
    if (!email?.trim())    missing.push('email');
    if (!password)         missing.push('password');
    if (!name?.trim())     missing.push('name');
    if (!headline?.trim()) missing.push('headline');
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // ── 3. Register with Neon Auth ─────────────────────────────────────
    let authData: any;
    let authUserId: string;
    
    try {
      const { data, error } = await auth.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      
      if (error) {
        const msg = error.message || '';
        
        // If auth already has this email, try to get existing user id instead of failing
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          // Check if we already have this user locally first
          const existingLocalUser = await prisma.user.findUnique({ where: { email: email.trim() } });
          
          if (existingLocalUser) {
            return NextResponse.json(
              { error: 'An account with this email already exists. Please log in instead.' },
              { status: 400 },
            );
          }
          
          // IMPORTANT: Auth service has this email but we don't have it locally!
          // This is from previous failed signup attempt. Continue with this auth user.
          // Try to get existing user from auth service
          authUserId = (error as any)?.userId || (error as any)?.user?.id;
          
          if (!authUserId) {
            // If we can't get user id from error, just let them know to login
            return NextResponse.json(
              { error: 'An account with this email already exists. Please log in instead.' },
              { status: 400 },
            );
          }
        } else {
          return NextResponse.json({ error: msg || 'Registration failed' }, { status: 400 });
        }
      } else {
        authData = data;
        authUserId = authData?.user?.id ?? (authData as any)?.id ?? (authData as any)?.userId;
      }
      
    } catch (authErr: any) {
      const msg = authErr.message || '';
      return NextResponse.json({ error: msg || 'Registration failed' }, { status: 400 });
    }

    if (!authUserId) {
      console.error('[TUTOR SIGNUP] No user ID in auth response');
      return NextResponse.json(
        { error: 'Auth service did not return a user ID' },
        { status: 500 },
      );
    }

    // ── 4. Upsert User row ─────────────────────────────────────────────
    let user = await prisma.user.findUnique({ where: { id: authUserId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: authUserId,
          email: email.trim(),
          name: name.trim(),
          role: 'TUTOR',
          isVerified: false,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: authUserId },
        data: { name: name.trim(), role: 'TUTOR', isVerified: false },
      });
    }

    // ── 5. Upsert Tutor profile ────────────────────────────────────────
    let tutor = await prisma.tutor.findUnique({ where: { userId: authUserId } });
    
    // ALWAYS ensure Tutor profile exists - no orphaned User records
    if (!tutor) {
      tutor = await prisma.tutor.create({
        data: {
          userId: authUserId,
          headline: headline?.trim() ?? '',
          bio: bio?.trim() ?? '',
          introVideoUrl: videoUrl?.trim() ?? '',
          pricingPerHour: parseFloat(String(price)) || 20,
          verificationStatus: 'PENDING',
        },
      });
    } else {
      // Update existing tutor if already exists
      tutor = await prisma.tutor.update({
        where: { userId: authUserId },
        data: {
          headline: headline?.trim() ?? '',
          bio: bio?.trim() ?? '',
          introVideoUrl: videoUrl?.trim() ?? '',
          pricingPerHour: parseFloat(String(price)) || 20,
          verificationStatus: 'PENDING',
        },
      });
    }
    
    const tutorId = tutor.id;

    // ── 6. Education ───────────────────────────────────────────────────
    if (university?.trim() && degree?.trim()) {
      const existingEdu = await prisma.education.findFirst({ where: { tutorId } });
      if (!existingEdu) {
        await prisma.education.create({
          data: {
            tutorId,
            university: university.trim(),
            degree: degree.trim(),
            specialization: '',
            yearStart: new Date().getFullYear(),
          },
        });
      }
    }

    // ── 7. Availability ────────────────────────────────────────────────
    // UI sends 0=Mon … 6=Sun; DB stores JS dayOfWeek: 0=Sun, 1=Mon … 6=Sat
    const days: number[] = Array.isArray(availability) ? availability : [];
    if (days.length > 0) {
      const existingAvail = await prisma.availability.findFirst({ where: { tutorId } });
      if (!existingAvail) {
        await prisma.availability.createMany({
          data: days.map((uiDay: number) => ({
            tutorId,
            dayOfWeek: uiDay === 6 ? 0 : uiDay + 1,
            startTime: '09:00',
            endTime: '17:00',
          })),
        });
      }
    }

    // ── 8. Certifications ──────────────────────────────────────────────
    if (Array.isArray(certifications) && certifications.length > 0) {
      const existingCerts = await prisma.certification.findFirst({ where: { tutorId } });
      if (!existingCerts) {
        const validCerts = certifications.filter(
          (c: any) => c.certificate?.trim() && c.issuedBy?.trim(),
        );
        if (validCerts.length > 0) {
          await prisma.certification.createMany({
            data: validCerts.map((c: any) => ({
              tutorId,
              subject: c.subject?.trim() || 'General',
              certificate: c.certificate.trim(),
              issuedBy: c.issuedBy.trim(),
              certificateUrl: c.certificateUrl?.trim() || null,
            })),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted. You will be notified once verified.',
    });

  } catch (err: any) {
    console.error('[TUTOR SIGNUP ERROR]', err);
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
