import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ReceivedEmail from '@/models/ReceivedEmail';
import EmailAccount from '@/models/EmailAccount';

// GET: Get unread email summary across all accounts
export async function GET() {
  try {
    await connectDB();

    // Get all active accounts
    const accounts = await EmailAccount.find({ isActive: true }).lean();
    const accountIds = accounts.map((a) => a._id);

    // Get total unread count
    const totalUnread = await ReceivedEmail.countDocuments({
      accountId: { $in: accountIds },
      isRead: false,
      isArchived: false,
    });

    // Get the 5 most recent unread emails (for notification content)
    const recentUnread = await ReceivedEmail.find({
      accountId: { $in: accountIds },
      isRead: false,
      isArchived: false,
    })
      .sort({ receivedAt: -1 })
      .limit(5)
      .select('_id from fromName subject receivedAt accountId')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalUnread,
        recentUnread,
      },
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unread notifications' },
      { status: 500 }
    );
  }
}
