import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET /api/messages?userId=X — get messages for a user (conversation with another user)
// or GET /api/messages?conversationWith=Y — get messages between current user and Y
export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers },
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationWith = searchParams.get('conversationWith');

    if (!conversationWith) {
      // Return all conversations for the current user (distinct users they've messaged with)
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: data.user.id }, { receiverId: data.user.id }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
      });

      // Deduplicate to get latest message per conversation
      const conversations = new Map<string, any>();
      for (const msg of messages) {
        const otherId = msg.senderId === data.user.id ? msg.receiverId : msg.senderId;
        if (!conversations.has(otherId)) {
          conversations.set(otherId, {
            userId: otherId,
            userName: msg.senderId === data.user.id ? msg.receiver.name : msg.sender.name,
            userImage: msg.senderId === data.user.id ? msg.receiver.image : msg.sender.image,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: messages.filter(
              (m) => m.senderId === otherId && m.receiverId === data.user.id && !m.isRead
            ).length,
          });
        }
      }

      return NextResponse.json(Array.from(conversations.values()));
    }

    // Get conversation between current user and another user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: data.user.id, receiverId: conversationWith },
          { senderId: conversationWith, receiverId: data.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: conversationWith,
        receiverId: data.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  } catch (err: unknown) {
    console.error('[GET /api/messages]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers },
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: data.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message 💬',
        message: `You have a new message from ${data.user.name || 'Someone'}`,
        link: `/dashboard/messages?user=${data.user.id}`,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/messages]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}