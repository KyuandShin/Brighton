import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/profile — update user + student/tutor profile fields
export async function PATCH(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { 
      name, age, schoolName, schoolLevel, 
      headline, bio, pricingPerHour, introVideoUrl,
      university, degree, photoUrl,
      availability, // format: [{ dayOfWeek: number, startTime: string, endTime: string }]
      subjects,     // format: string[] of subject names
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update base user
    const userUpdate: any = {};
    if (name !== undefined) userUpdate.name = name;
    if (photoUrl !== undefined) userUpdate.image = photoUrl;
    
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: data.user.id }, data: userUpdate });
    }

    if (user.role === 'STUDENT' && user.studentProfile) {
      const studentUpdate: any = {};
      if (age !== undefined) studentUpdate.age = parseInt(age);
      if (schoolName !== undefined) studentUpdate.schoolName = schoolName;
      if (schoolLevel !== undefined) studentUpdate.schoolLevel = schoolLevel;
      
      if (Object.keys(studentUpdate).length > 0) {
        await prisma.student.update({
          where: { id: user.studentProfile.id },
          data: studentUpdate,
        });
      }
    }

    if (user.role === 'TUTOR' && user.tutorProfile) {
      const tutorUpdate: any = {};
      if (headline !== undefined) tutorUpdate.headline = headline;
      if (bio !== undefined) tutorUpdate.bio = bio;
      if (pricingPerHour !== undefined) tutorUpdate.pricingPerHour = parseFloat(pricingPerHour);
      if (introVideoUrl !== undefined) tutorUpdate.introVideoUrl = introVideoUrl;
      
      if (Object.keys(tutorUpdate).length > 0) {
        await prisma.tutor.update({
          where: { id: user.tutorProfile.id },
          data: tutorUpdate,
        });
      }

      // Handle Education
      if (university !== undefined && degree !== undefined) {
        const existingEdu = await prisma.education.findFirst({
          where: { tutorId: user.tutorProfile.id },
        });
        if (existingEdu) {
          if (university || degree) {
            await prisma.education.update({
              where: { id: existingEdu.id },
              data: { university: university || '', degree: degree || '' },
            });
          } else {
            await prisma.education.delete({ where: { id: existingEdu.id } });
          }
        } else if (university || degree) {
          await prisma.education.create({
            data: {
              tutorId: user.tutorProfile.id,
              university: university || '',
              degree: degree || '',
              specialization: '',
              yearStart: new Date().getFullYear(),
            },
          });
        }
      }

      const tp = user.tutorProfile;
      // Handle Availability
      if (availability !== undefined && Array.isArray(availability)) {
        await prisma.availability.deleteMany({ where: { tutorId: tp.id } });
        if (availability.length > 0) {
          await prisma.availability.createMany({
            data: availability.map((s: any) => ({
              tutorId: tp.id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime || '09:00',
              endTime: s.endTime || '17:00',
            })),
          });
        }
      }

      // Handle Subjects
      if (subjects !== undefined && Array.isArray(subjects)) {
        await prisma.tutorSubject.deleteMany({ where: { tutorId: tp.id } });
        for (const subjectName of subjects) {
          const subjectRecord = await prisma.subject.upsert({
            where: { name: subjectName.trim() },
            update: {},
            create: { name: subjectName.trim() },
          });
          await prisma.tutorSubject.create({
            data: {
              tutorId: tp.id,
              subjectId: subjectRecord.id,
            },
          });
        }
      }
    }

    // Return updated user
    const updated = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        studentProfile: true,
        tutorProfile: { 
          include: { 
            subjects: { include: { subject: true } }, 
            availability: true,
            education: true,
          } 
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[PATCH /api/profile]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}