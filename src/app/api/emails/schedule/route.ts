import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import resend from '@/lib/resend';
import EmailAccount from '@/models/EmailAccount';
import ScheduledEmail from '@/models/ScheduledEmail';
import mongoose from 'mongoose';

// POST: Schedule an email to multiple recipients
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { accountId, recipients, subject, body: emailBody, html, scheduledAt } = body;

    // Validate required fields
    if (!accountId || !recipients || !subject || (!emailBody && !html) || !scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account ID, recipients, subject, body/html, and scheduledAt are required',
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    // Get account details
    const account = await EmailAccount.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return NextResponse.json(
        { success: false, error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Check if scheduled time is within 30 days (Resend limit)
    const maxScheduleTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (scheduledDate > maxScheduleTime) {
      return NextResponse.json(
        { success: false, error: 'Cannot schedule emails more than 30 days in advance' },
        { status: 400 }
      );
    }

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const fromAddress = `${account.name} <${account.email}>`;
    const resendIds: string[] = [];
    const failedRecipients: string[] = [];

    // Schedule email for each recipient via Resend
    for (const recipient of recipientList) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: [recipient],
          subject,
          html: html || `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
          text: emailBody,
          scheduledAt: scheduledDate.toISOString(),
        });

        if (error) {
          console.error(`Failed to schedule email to ${recipient}:`, error);
          failedRecipients.push(recipient);
        } else if (data?.id) {
          resendIds.push(data.id);
        }
      } catch (err) {
        console.error(`Error scheduling email to ${recipient}:`, err);
        failedRecipients.push(recipient);
      }
    }

    // Save to database
    const scheduledEmail = await ScheduledEmail.create({
      accountId: new mongoose.Types.ObjectId(accountId),
      resendIds,
      from: fromAddress,
      recipients: recipientList,
      subject,
      body: emailBody,
      html,
      scheduledAt: scheduledDate,
      status: failedRecipients.length === recipientList.length
        ? 'failed'
        : failedRecipients.length > 0
        ? 'pending'
        : 'pending',
      failedRecipients,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: scheduledEmail._id,
        scheduledCount: resendIds.length,
        failedCount: failedRecipients.length,
        scheduledAt: scheduledDate,
        message:
          failedRecipients.length > 0
            ? `Scheduled ${resendIds.length} emails, ${failedRecipients.length} failed`
            : `Successfully scheduled ${resendIds.length} emails`,
      },
    });
  } catch (error) {
    console.error('Error scheduling emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule emails' },
      { status: 500 }
    );
  }
}

// GET: Get all scheduled emails
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status !== 'all') {
      query.status = status;
    }

    const [emails, total] = await Promise.all([
      ScheduledEmail.find(query)
        .populate('accountId', 'name email color')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScheduledEmail.countDocuments(query),
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
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled emails' },
      { status: 500 }
    );
  }
}
