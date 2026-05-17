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

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'TUTOR' },
    include: {
      tutorProfile: {
        include: {
          subjects: { include: { subject: true } },
        },
      },
    },
  });

  console.log('=== ALL TUTOR USERS IN DATABASE ===');
  for (const u of users) {
    const tp = u.tutorProfile;
    console.log(JSON.stringify({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isBanned: u.isBanned,
      status: tp?.verificationStatus ?? 'NO_PROFILE',
      tutorId: tp?.id ?? 'NO_PROFILE',
      subjects: tp?.subjects?.map(s => s.subject.name) ?? [],
      headline: tp?.headline,
    }, null, 2));
  }
  console.log(`\nTotal tutor users: ${users.length}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });