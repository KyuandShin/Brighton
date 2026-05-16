import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

const SEED_PASSWORD = 'Test1234!';

const SEED_ACCOUNTS = [
  {
    email: 'admin@brighton.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  {
    email: 'tutor@brighton.com',
    name: 'Demo Tutor',
    role: 'TUTOR' as const,
  },
  {
    email: 'student@brighton.com',
    name: 'Demo Student',
    role: 'STUDENT' as const,
  },
];

export async function POST() {
  try {
    // Verify this is run by the actual admin
    const { data } = await auth.getSession();
    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can seed accounts' }, { status: 403 });
    }

    const results: string[] = [];

    for (const account of SEED_ACCOUNTS) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email: account.email } });
      if (existingUser) {
        results.push(`${account.email} already exists (skipped)`);
        continue;
      }

      try {
        // Register with Neon Auth
        const signupResult = await auth.signUp.email({
          email: account.email,
          password: SEED_PASSWORD,
          name: account.name,
        });

        const authUserId = signupResult.data?.user?.id ?? 
          (signupResult.data as any)?.id ?? 
          (signupResult as any)?.userId;

        if (!authUserId) {
          results.push(`${account.email}: failed to get auth user ID`);
          continue;
        }

        // Create user record
        await prisma.user.create({
          data: {
            id: authUserId,
            email: account.email,
            name: account.name,
            role: account.role,
            isVerified: true,
          },
        });

        // Create role-specific profiles
        if (account.role === 'TUTOR') {
          await prisma.tutor.create({
            data: {
              userId: authUserId,
              headline: 'Experienced Tutor',
              bio: 'I am a demo tutor account for testing purposes.',
              pricingPerHour: 25,
              verificationStatus: 'APPROVED',
            },
          });

          // Add some availability (Mon-Fri)
          for (let day = 0; day <= 4; day++) {
            await prisma.availability.create({
              data: {
                tutorId: authUserId,
                dayOfWeek: day,
                startTime: '09:00',
                endTime: '17:00',
              },
            });
          }

          // Connect to Math subject if it exists
          const mathSubject = await prisma.subject.findFirst({ where: { name: 'Mathematics' } });
          if (mathSubject) {
            await prisma.tutorSubject.create({
              data: { tutorId: authUserId, subjectId: mathSubject.id },
            });
          }
        }

        if (account.role === 'STUDENT') {
          await prisma.student.create({
            data: {
              userId: authUserId,
              schoolLevel: 'HIGH_SCHOOL',
              gradeLevel: 11,
              age: 16,
            },
          });
        }

        results.push(`${account.email} created successfully`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`${account.email}: error - ${msg}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      details: results,
      note: `Default password for all accounts: ${SEED_PASSWORD}`
    });
  } catch (err: unknown) {
    console.error('Seed accounts error:', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}