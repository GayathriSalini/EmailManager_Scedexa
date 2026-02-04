import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import resend from '@/lib/resend';
import ScheduledEmail from '@/models/ScheduledEmail';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get scheduled email details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduled email ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const email = await ScheduledEmail.findById(id).populate('accountId', 'name email color');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Scheduled email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    console.error('Error fetching scheduled email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled email' },
      { status: 500 }
    );
  }
}

// PATCH: Reschedule email
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduled email ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'New scheduledAt time is required' },
        { status: 400 }
      );
    }

    const email = await ScheduledEmail.findById(id);
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Scheduled email not found' },
        { status: 404 }
      );
    }

    if (email.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only reschedule pending emails' },
        { status: 400 }
      );
    }

    const newScheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (newScheduledDate <= now) {
      return NextResponse.json(
        { success: false, error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Update each scheduled email in Resend
    const updatePromises = email.resendIds.map(async (resendId) => {
      try {
        await resend.emails.update({
          id: resendId,
          scheduledAt: newScheduledDate.toISOString(),
        });
        return { success: true, resendId };
      } catch (err) {
        console.error(`Failed to update ${resendId}:`, err);
        return { success: false, resendId };
      }
    });

    await Promise.all(updatePromises);

    // Update in database
    email.scheduledAt = newScheduledDate;
    await email.save();

    return NextResponse.json({
      success: true,
      data: email,
      message: 'Email rescheduled successfully',
    });
  } catch (error) {
    console.error('Error rescheduling email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule email' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel scheduled email
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduled email ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const email = await ScheduledEmail.findById(id);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Scheduled email not found' },
        { status: 404 }
      );
    }

    if (email.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only cancel pending emails' },
        { status: 400 }
      );
    }

    // Cancel each scheduled email in Resend
    const cancelPromises = email.resendIds.map(async (resendId) => {
      try {
        await resend.emails.cancel(resendId);
        return { success: true, resendId };
      } catch (err) {
        console.error(`Failed to cancel ${resendId}:`, err);
        return { success: false, resendId };
      }
    });

    await Promise.all(cancelPromises);

    // Update status in database
    email.status = 'cancelled';
    await email.save();

    return NextResponse.json({
      success: true,
      message: 'Scheduled email cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel scheduled email' },
      { status: 500 }
    );
  }
}
