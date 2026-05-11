import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');
    const level = searchParams.get('level');

    const where: any = {};
    if (tutorId) where.tutorId = tutorId;
    if (level) where.level = level;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        tutor: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { tutorProfile: true },
    });

    if (!user?.tutorProfile) {
      return NextResponse.json({ error: 'Only tutors can create resources' }, { status: 403 });
    }

    const { title, description, fileUrl, fileType, subject, level } = await request.json();

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'title and fileUrl are required' }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        tutorId: user.tutorProfile.id,
        title,
        description: description || null,
        fileUrl,
        fileType: fileType || 'link',
        subject: subject || null,
        level: level || null,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify the user owns this resource before deleting
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { tutor: true },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.tutor.userId !== data.user.id) {
      return NextResponse.json({ error: 'You can only delete your own resources' }, { status: 403 });
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
