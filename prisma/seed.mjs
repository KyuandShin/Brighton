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

// General K-12 subject categories
const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Araling Panlipunan',
  'MAPEH',
  'Edukasyon sa Pagpapakatao',
  'TLE',
  'ICT',
];

const MOCK_TUTORS = [
  {
    id: 't1',
    name: 'Dr. Aris Smith',
    email: 'aris@example.com',
    headline: 'Mathematics & Science Specialist',
    subjects: ['Mathematics', 'Science'],
    rating: 4.9,
    price: 25,
    bio: 'Over 10 years of experience in teaching mathematics and science.',
  },
  {
    id: 't2',
    name: 'Prof. Maria Clara',
    email: 'maria@example.com',
    headline: 'Science & English Expert',
    subjects: ['Science', 'English'],
    rating: 4.8,
    price: 20,
    bio: 'Making science and language learning fun for all students.',
  },
  {
    id: 't3',
    name: 'Ms. Lea Salonga',
    email: 'lea@example.com',
    headline: 'English & Filipino Coach',
    subjects: ['English', 'Filipino', 'Araling Panlipunan'],
    rating: 5.0,
    price: 22,
    bio: 'Helping students find their voice through the power of language and history.',
  },
];

async function main() {
  console.log('Seeding subjects...');

  // Seed subjects matching Python backend
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }
  console.log(`Seeded ${SUBJECTS.length} subjects`);

  console.log('Seeding tutors...');

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