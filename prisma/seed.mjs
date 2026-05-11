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

// Philippine K-12 subjects
const K12_SUBJECTS = [
  'Filipino', 'English', 'Mathematics', 'Science',
  'Araling Panlipunan', 'Edukasyon sa Pagpapakatao', 'Music', 'Arts',
  'Physical Education', 'Health', 'Home Economics', 'Industrial Arts',
  'ICT', 'Agriculture', 'Algebra', 'Geometry', 'Trigonometry',
  'Statistics', 'Probability', 'Calculus', 'Biology', 'Chemistry',
  'Physics', 'Earth Science', 'General Science', 'Integrated Science',
  'Philippine History', 'Asian Studies', 'World History', 'Economics',
  'Contemporary Issues', 'Media and Information Literacy',
  'Oral Communication', 'Reading and Writing', 'English for Academic Purposes',
  'Filipino sa Piling Larangan', 'Panitikan', 'STEM', 'ABM', 'HUMSS',
  'TVL', 'Disaster Readiness', 'Environmental Science',
];

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
    subjects: ['English', 'Literature', 'Reading and Writing'],
    rating: 5.0,
    price: 22,
    bio: 'Helping students find their voice through the power of language.',
  },
];

async function main() {
  console.log('Seeding K-12 subjects...');

  // Seed all K-12 subjects
  for (const s of K12_SUBJECTS) {
    await prisma.subject.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }
  console.log(`Seeded ${K12_SUBJECTS.length} subjects`);

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