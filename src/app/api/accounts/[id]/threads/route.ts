import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SentEmail from '@/models/SentEmail';
import ReceivedEmail from '@/models/ReceivedEmail';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List all threads for an account
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const accountObjectId = new mongoose.Types.ObjectId(id);

    // Get unique threads from sent emails
    const sentThreads = await SentEmail.aggregate([
      { $match: { accountId: accountObjectId, threadId: { $exists: true, $ne: null } } },
      { $sort: { sentAt: -1 } },
      {
        $group: {
          _id: '$threadId',
          lastEmail: { $first: '$$ROOT' },
          count: { $sum: 1 },
          lastDate: { $max: '$sentAt' },
        },
      },
    ]);

    // Get unique threads from received emails
    const receivedThreads = await ReceivedEmail.aggregate([
      { $match: { accountId: accountObjectId, threadId: { $exists: true, $ne: null } } },
      { $sort: { receivedAt: -1 } },
      {
        $group: {
          _id: '$threadId',
          lastEmail: { $first: '$$ROOT' },
          count: { $sum: 1 },
          lastDate: { $max: '$receivedAt' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
          },
        },
      },
    ]);

    // Combine threads
    const threadMap = new Map<string, {
      threadId: string;
      subject: string;
      lastMessage: string;
      lastDate: Date;
      sentCount: number;
      receivedCount: number;
      unreadCount: number;
      participants: string[];
    }>();

    // Process sent threads
    for (const thread of sentThreads) {
      threadMap.set(thread._id, {
        threadId: thread._id,
        subject: thread.lastEmail.subject,
        lastMessage: thread.lastEmail.body?.substring(0, 100) || '',
        lastDate: thread.lastDate,
        sentCount: thread.count,
        receivedCount: 0,
        unreadCount: 0,
        participants: thread.lastEmail.to || [],
      });
    }

    // Merge received threads
    for (const thread of receivedThreads) {
      const existing = threadMap.get(thread._id);
      if (existing) {
        if (new Date(thread.lastDate) > new Date(existing.lastDate)) {
          existing.lastMessage = thread.lastEmail.body?.substring(0, 100) || '';
          existing.lastDate = thread.lastDate;
          existing.subject = thread.lastEmail.subject;
        }
        existing.receivedCount = thread.count;
        existing.unreadCount = thread.unreadCount;
        if (!existing.participants.includes(thread.lastEmail.from)) {
          existing.participants.push(thread.lastEmail.from);
        }
      } else {
        threadMap.set(thread._id, {
          threadId: thread._id,
          subject: thread.lastEmail.subject,
          lastMessage: thread.lastEmail.body?.substring(0, 100) || '',
          lastDate: thread.lastDate,
          sentCount: 0,
          receivedCount: thread.count,
          unreadCount: thread.unreadCount,
          participants: [thread.lastEmail.from],
        });
      }
    }

    // Convert to array and sort by last date
    const threads = Array.from(threadMap.values())
      .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    return NextResponse.json({
      success: true,
      data: {
        threads,
        total: threads.length,
      },
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
