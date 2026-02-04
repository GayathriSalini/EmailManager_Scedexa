import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import resend from '@/lib/resend';
import EmailAccount from '@/models/EmailAccount';
import SentEmail from '@/models/SentEmail';
import mongoose from 'mongoose';

// POST: Send an email immediately
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { accountId, to, cc, bcc, subject, body: emailBody, html } = body;

    // Validate required fields
    if (!accountId || !to || !subject || (!emailBody && !html)) {
      return NextResponse.json(
        { success: false, error: 'Account ID, to, subject, and body/html are required' },
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

    // Prepare recipients
    const recipients = Array.isArray(to) ? to : [to];
    const fromAddress = `${account.name} <${account.email}>`;

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html: html || `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      text: emailBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Save to database
    const sentEmail = await SentEmail.create({
      accountId: new mongoose.Types.ObjectId(accountId),
      resendId: data?.id || '',
      from: fromAddress,
      to: recipients,
      cc,
      bcc,
      subject,
      body: emailBody,
      html,
      status: 'sent',
      sentAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: sentEmail._id,
        resendId: data?.id,
        message: 'Email sent successfully',
      },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
