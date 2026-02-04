import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SentEmail from '@/models/SentEmail';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get sent emails for an account
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

    const [emails, total] = await Promise.all([
      SentEmail.find({ accountId: new mongoose.Types.ObjectId(id) })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SentEmail.countDocuments({ accountId: new mongoose.Types.ObjectId(id) }),
    ]);

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
      },
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sent emails' },
      { status: 500 }
    );
  }
}
