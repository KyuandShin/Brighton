import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/bookings/[bookingId] — backfill meetLink if it's missing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // If meetLink already set, just return it
    if (booking.meetLink) {
      return NextResponse.json(booking);
    }

    // Backfill the meetLink
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { meetLink: `/dashboard/classroom/${bookingId}` },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH /api/bookings/:id]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
