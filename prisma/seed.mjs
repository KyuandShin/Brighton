import { PrismaClient } from '../app/generated/prisma/index.js';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MOCK_TUTORS = [
  {
    id: 't1',
    name: 'Dr. Aris Smith',
    email: 'aris@example.com',
    headline: 'Mathematics & Physics Specialist',
    subjects: ['Algebra', 'Calculus', 'Physics'],
    rating: 4.9,
    price: 25,
    bio: 'Over 10 years of experience in teaching advanced mathematics and physics.',
  },
  {
    id: 't2',
    name: 'Prof. Maria Clara',
    email: 'maria@example.com',
    headline: 'General Science & Biology Expert',
    subjects: ['Biology', 'Chemistry', 'Earth Science'],
    rating: 4.8,
    price: 20,
    bio: 'Making science fun and accessible for elementary students.',
  },
  {
    id: 't3',
    name: 'Ms. Lea Salonga',
    email: 'lea@example.com',
    headline: 'English & Literature Coach',
    subjects: ['Grammar', 'Literature', 'Writing'],
    rating: 5.0,
    price: 22,
    bio: 'Helping students find their voice through the power of language.',
  },
];

async function main() {
  console.log('Seeding tutors...');

  // First, ensure subjects exist
  const allSubjects = [...new Set(MOCK_TUTORS.flatMap((t) => t.subjects))];
  for (const s of allSubjects) {
    await prisma.subject.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }

  for (const t of MOCK_TUTORS) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, role: 'TUTOR', isVerified: true },
      create: {
        email: t.email,
        name: t.name,
        role: 'TUTOR',
        isVerified: true,
      },
    });

    const tutor = await prisma.tutor.upsert({
      where: { userId: user.id },
      update: {
        headline: t.headline,
        bio: t.bio,
        pricingPerHour: t.price,
        verificationStatus: 'APPROVED',
      },
      create: {
        userId: user.id,
        headline: t.headline,
        bio: t.bio,
        pricingPerHour: t.price,
        verificationStatus: 'APPROVED',
      },
    });

    // Connect subjects
    for (const s of t.subjects) {
      const subjectRecord = await prisma.subject.findUnique({ where: { name: s } });
      if (subjectRecord) {
        await prisma.tutorSubject.upsert({
          where: {
            tutorId_subjectId: {
              tutorId: tutor.id,
              subjectId: subjectRecord.id,
            },
          },
          update: {},
          create: {
            tutorId: tutor.id,
            subjectId: subjectRecord.id,
          },
        });
      }
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
