import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, name, headline, bio,
      university, degree, videoUrl, price,
      availability, availabilitySlots, certifications,
      introduction, experience, motivation,
      photoUrl, subjects
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

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 },
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 },
      );
    }

    // ── 2. Construct final bio ─────────────────────────────────────────
    // If the user filled out the multi-section description (Step 5), join them;
    // otherwise fall back to the bio written in Step 0 (General Details)
    let finalBio = bio?.trim() || '';
    if (introduction?.trim() || experience?.trim() || motivation?.trim()) {
      finalBio = [
        introduction?.trim() && `${introduction.trim()}`,
        experience?.trim()   && `Experience: ${experience.trim()}`,
        motivation?.trim()   && `${motivation.trim()}`,
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
    } catch (authErr: unknown) {
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
      const parsedPrice = price !== undefined && price !== null && price !== '' 
        ? parseFloat(String(price)) 
        : undefined;
      // Only use default 20 if price was truly not provided (undefined/null), not if it's explicitly 0
      const finalPrice = parsedPrice !== undefined ? parsedPrice : 20;

      const tutor = await tx.tutor.upsert({
        where: { userId: authUserId! },
        update: {
          headline: headline?.trim() || '',
          bio: finalBio.trim(),
          introVideoUrl: videoUrl?.trim() || null,
          pricingPerHour: finalPrice,
          verificationStatus: 'PENDING',
        },
        create: {
          userId: authUserId!,
          headline: headline?.trim() || '',
          bio: finalBio.trim(),
          introVideoUrl: videoUrl?.trim() || null,
          pricingPerHour: finalPrice,
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

      // 4. Handle Availability — use availabilitySlots with time ranges, fallback to defaults
      const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = 
        Array.isArray(availabilitySlots) && availabilitySlots.length > 0
          ? availabilitySlots
          : Array.isArray(availability) 
            ? availability.map((uiDay: number) => ({
                // UI days: 0=Mon ... 6=Sun — store directly as schema dayOfWeek (0=Mon)
                dayOfWeek: uiDay,
                startTime: '09:00',
                endTime: '17:00',
              }))
            : [];

      if (slots.length > 0) {
        await tx.availability.deleteMany({ where: { tutorId: tutor.id } });
        await tx.availability.createMany({
          data: slots.map((s: any) => ({
            tutorId: tutor.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '17:00',
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

      // 6. Handle Subjects — ensure they exist in the Subject table, then connect
      if (Array.isArray(subjects) && subjects.length > 0) {
        // Remove existing subject connections
        await tx.tutorSubject.deleteMany({ where: { tutorId: tutor.id } });

        for (const subjectName of subjects) {
          const subjectRecord = await tx.subject.upsert({
            where: { name: subjectName.trim() },
            update: {},
            create: { name: subjectName.trim() },
          });

          await tx.tutorSubject.create({
            data: {
              tutorId: tutor.id,
              subjectId: subjectRecord.id,
            },
          });
        }
      }

      return { user, tutor };
    });

    console.log('[TUTOR SIGNUP] Success for:', email);

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Please check your email for the verification code to complete signup. You will be notified once a tutor admin approves your application.',
    });

  } catch (err: unknown) {
    console.error('[TUTOR SIGNUP ERROR]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

