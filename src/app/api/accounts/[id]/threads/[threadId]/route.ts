import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SentEmail from '@/models/SentEmail';
import ReceivedEmail from '@/models/ReceivedEmail';
import mongoose from 'mongoose';

// GET: Get all emails in a thread
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    await connectDB();

    const { id, threadId } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const accountObjectId = new mongoose.Types.ObjectId(id);
    const decodedThreadId = decodeURIComponent(threadId);

    // Get all sent emails in this thread
    const sentEmails = await SentEmail.find({
      accountId: accountObjectId,
      threadId: decodedThreadId,
    })
      .sort({ sentAt: 1 })
      .lean();

    // Get all received emails in this thread
    const receivedEmails = await ReceivedEmail.find({
      accountId: accountObjectId,
      threadId: decodedThreadId,
    })
      .sort({ receivedAt: 1 })
      .lean();

    // Combine and sort by date
    const allEmails = [
      ...sentEmails.map((e) => ({
        ...e,
        type: 'sent' as const,
        date: e.sentAt,
      })),
      ...receivedEmails.map((e) => ({
        ...e,
        type: 'received' as const,
        date: e.receivedAt,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        threadId: decodedThreadId,
        emailCount: allEmails.length,
        emails: allEmails,
      },
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
