/**
 * Data Fix Script
 * 
 * Fixes two issues:
 * 1. Remove subjects not matching Python backend
 * 2. Clears old test bookings
 */
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

// Only these subjects (matching Python backend)
const KEEP_SUBJECTS = new Set([
  'Filipino', 'English', 'Algebra', 'Geometry', 'Trigonometry', 'Statistics',
  'Integrated Science', 'Biology', 'Chemistry', 'Physics', 'Earth Science',
  'Philippine History', 'Asian Studies', 'World History', 'Economics',
  'MAPEH', 'Edukasyon sa Pagpapakatao',
]);

async function main() {
  console.log('🔧 Starting data fix…\n');

  // ────────────────────────────────────────────────────────────────────
  // 1. Remove subjects NOT in the Python backend list
  // ────────────────────────────────────────────────────────────────────
  console.log('📚 Removing extra subjects…');
  
  const allSubjects = await prisma.subject.findMany();
  let removedCount = 0;

  for (const subject of allSubjects) {
    if (!KEEP_SUBJECTS.has(subject.name)) {
      // Delete TutorSubject links first (foreign key)
      await prisma.tutorSubject.deleteMany({
        where: { subjectId: subject.id },
      });
      await prisma.subject.delete({ where: { id: subject.id } });
      console.log(`  🗑  Removed "${subject.name}"`);
      removedCount++;
    }
  }

  // Ensure all keep subjects exist
  for (const s of KEEP_SUBJECTS) {
    await prisma.subject.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }
  console.log(`  ✅ ${KEEP_SUBJECTS.size} subjects kept/created (removed ${removedCount})`);

  // ────────────────────────────────────────────────────────────────────
  // 2. Delete old completed bookings
  // ────────────────────────────────────────────────────────────────────
  console.log('\n📅 Fixing bookings…');

  const completedBookings = await prisma.booking.findMany({
    where: { status: 'COMPLETED' },
  });

  if (completedBookings.length === 0) {
    console.log('  ⏭  No COMPLETED bookings to fix');
  } else {
    const bookingIds = completedBookings.map(b => b.id);
    await prisma.sessionNote.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { status: 'COMPLETED' } });
    console.log(`  ✅ Deleted ${completedBookings.length} old completed bookings`);
  }

  console.log('\n✅ Data fix complete!');
  console.log(`   Now has ${KEEP_SUBJECTS.size} subjects (matching Python backend)`);
  console.log('   Old completed test bookings cleared');
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });