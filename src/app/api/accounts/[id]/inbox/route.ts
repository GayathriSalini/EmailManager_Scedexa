import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ReceivedEmail from '@/models/ReceivedEmail';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get inbox emails for an account
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const showArchived = searchParams.get('archived') === 'true';

    const query: Record<string, unknown> = {
      accountId: new mongoose.Types.ObjectId(id),
    };

    if (!showArchived) {
      query.isArchived = false;
    }

    const [emails, total] = await Promise.all([
      ReceivedEmail.find(query)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReceivedEmail.countDocuments(query),
    ]);

    const unreadCount = await ReceivedEmail.countDocuments({
      accountId: new mongoose.Types.ObjectId(id),
      isRead: false,
      isArchived: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}
