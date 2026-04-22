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
      introduction, experience, motivation,
      photoUrl
    } = body;

    console.log('[TUTOR SIGNUP] Starting signup for:', email);

    // ── 1. Basic validation ────────────────────────────────────────────
    const missing: string[] = [];
    if (!email?.trim())    missing.push('email');
    if (!password)         missing.push('password');
    if (!name?.trim())     missing.push('name');
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    // ── 2. Construct final bio ─────────────────────────────────────────
    // If the user filled out the multi-section description, join them
    let finalBio = bio || '';
    if (introduction || experience || motivation) {
      finalBio = [
        introduction && `Introduction: ${introduction}`,
        experience && `Experience: ${experience}`,
        motivation && `Motivation: ${motivation}`
      ].filter(Boolean).join('\n\n');
    }

    // ── 3. Register with Neon Auth ─────────────────────────────────────
    let authUserId: string | null = null;
    
    try {
      const { data, error } = await auth.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      
      if (error) {
        const msg = error.message || '';
        console.warn('[TUTOR SIGNUP] Auth signUp error:', msg);
        
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          const existingLocalUser = await prisma.user.findUnique({ where: { email: email.trim() } });
          
          if (existingLocalUser) {
            return NextResponse.json(
              { error: 'An account with this email already exists. Please log in instead.' },
              { status: 400 },
            );
          }
          
          authUserId = (error as any)?.userId || (error as any)?.user?.id || (error as any)?.data?.id;
        } else {
          return NextResponse.json({ error: msg || 'Registration failed' }, { status: 400 });
        }
      } else {
        authUserId = data?.user?.id ?? (data as any)?.id ?? (data as any)?.userId;
      }
    } catch (authErr: any) {
      console.error('[TUTOR SIGNUP] Auth service crash:', authErr);
      return NextResponse.json({ error: 'Auth service unavailable' }, { status: 500 });
    }

    if (!authUserId) {
      console.error('[TUTOR SIGNUP] No user ID returned from auth');
      return NextResponse.json({ error: 'Failed to create auth account' }, { status: 500 });
    }

    // ── 4. Create/Update User & Tutor in one transaction ───────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert User
      const user = await tx.user.upsert({
        where: { id: authUserId! },
        update: {
          name: name.trim(),
          role: 'TUTOR',
          image: photoUrl || undefined,
        },
        create: {
          id: authUserId!,
          email: email.trim(),
          name: name.trim(),
          role: 'TUTOR',
          image: photoUrl || null,
          isVerified: false,
        },
      });

      // 2. Upsert Tutor profile
      const tutor = await tx.tutor.upsert({
        where: { userId: authUserId! },
        update: {
          headline: headline?.trim() ?? '',
          bio: finalBio.trim(),
          introVideoUrl: videoUrl?.trim() ?? '',
          pricingPerHour: parseFloat(String(price)) || 20,
          verificationStatus: 'PENDING',
        },
        create: {
          userId: authUserId!,
          headline: headline?.trim() ?? '',
          bio: finalBio.trim(),
          introVideoUrl: videoUrl?.trim() ?? '',
          pricingPerHour: parseFloat(String(price)) || 20,
          verificationStatus: 'PENDING',
        },
      });

      // 3. Handle Education
      if (university?.trim() && degree?.trim()) {
        await tx.education.deleteMany({ where: { tutorId: tutor.id } });
        await tx.education.create({
          data: {
            tutorId: tutor.id,
            university: university.trim(),
            degree: degree.trim(),
            specialization: '',
            yearStart: new Date().getFullYear(),
          },
        });
      }

      // 4. Handle Availability
      const days: number[] = Array.isArray(availability) ? availability : [];
      if (days.length > 0) {
        await tx.availability.deleteMany({ where: { tutorId: tutor.id } });
        await tx.availability.createMany({
          data: days.map((uiDay: number) => ({
            tutorId: tutor.id,
            dayOfWeek: uiDay === 6 ? 0 : uiDay + 1,
            startTime: '09:00',
            endTime: '17:00',
          })),
        });
      }

      // 5. Handle Certifications
      if (Array.isArray(certifications) && certifications.length > 0) {
        await tx.certification.deleteMany({ where: { tutorId: tutor.id } });
        const validCerts = certifications.filter(
          (c: any) => c.certificate?.trim() && c.issuedBy?.trim()
        );
        if (validCerts.length > 0) {
          await tx.certification.createMany({
            data: validCerts.map((c: any) => ({
              tutorId: tutor.id,
              subject: c.subject?.trim() || 'General',
              certificate: c.certificate.trim(),
              issuedBy: c.issuedBy.trim(),
              certificateUrl: c.certificateUrl?.trim() || null,
            })),
          });
        }
      }

      return { user, tutor };
    });

    console.log('[TUTOR SIGNUP] Success for:', email);

    return NextResponse.json({
      success: true,
      message: 'Application submitted. You will be notified once verified.',
    });

  } catch (err: any) {
    console.error('[TUTOR SIGNUP ERROR]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}

