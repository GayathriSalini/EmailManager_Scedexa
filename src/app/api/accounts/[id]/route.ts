import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailAccount from '@/models/EmailAccount';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get single account details
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
    const account = await EmailAccount.findById(id).lean();

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PATCH: Update account
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();

    const account = await EmailAccount.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete account (set isActive to false)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const account = await EmailAccount.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
