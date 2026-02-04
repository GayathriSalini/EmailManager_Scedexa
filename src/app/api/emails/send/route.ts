import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import resend from '@/lib/resend';
import EmailAccount from '@/models/EmailAccount';
import SentEmail from '@/models/SentEmail';
import ReceivedEmail from '@/models/ReceivedEmail';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Generate a unique Message-ID
function generateMessageId(domain: string): string {
  const id = crypto.randomBytes(16).toString('hex');
  return `<${id}@${domain}>`;
}

// Extract thread ID from subject (removes Re:, Fwd:, etc.)
function extractThreadSubject(subject: string): string {
  return subject.replace(/^(Re:|Fwd:|Fw:|RE:|FWD:|FW:)\s*/gi, '').trim();
}

// POST: Send an email immediately (with threading support)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      accountId,
      to,
      cc,
      bcc,
      subject,
      body: emailBody,
      html,
      // Threading parameters
      replyToEmailId, // ID of the email being replied to (from our DB)
      inReplyTo, // Message-ID header of original email
      references, // Array of Message-IDs in the thread
      threadId: existingThreadId, // Existing thread ID if known
    } = body;

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
    const domain = account.email.split('@')[1];

    // Handle threading
    let threadingHeaders: { replyTo?: string; references?: string[] } = {};
    let threadId = existingThreadId;
    let finalReferences: string[] = references || [];
    let finalInReplyTo: string | undefined = inReplyTo;

    // If replying to an email, look up its threading info
    if (replyToEmailId) {
      // Check both sent and received emails
      const sentOriginal = await SentEmail.findById(replyToEmailId);
      const receivedOriginal = await ReceivedEmail.findById(replyToEmailId);
      const original = sentOriginal || receivedOriginal;

      if (original && original.messageId) {
        finalInReplyTo = original.messageId;
        
        // Build references chain
        if (original.references && original.references.length > 0) {
          finalReferences = [...original.references, original.messageId];
        } else {
          finalReferences = [original.messageId];
        }

        // Use existing thread ID or create one based on subject
        threadId = original.threadId || extractThreadSubject(subject);
      }
    }

    // If no thread ID yet, create one from subject
    if (!threadId) {
      threadId = extractThreadSubject(subject);
    }

    // Generate a new Message-ID for this email
    const messageId = generateMessageId(domain);

    // Prepare Resend headers for threading
    const headers: Record<string, string> = {};
    if (finalInReplyTo) {
      headers['In-Reply-To'] = finalInReplyTo;
    }
    if (finalReferences.length > 0) {
      headers['References'] = finalReferences.join(' ');
    }

    // Send via Resend with threading headers
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html: html || `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      text: emailBody,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Save to database with threading info
    const sentEmail = await SentEmail.create({
      accountId: new mongoose.Types.ObjectId(accountId),
      resendId: data?.id || '',
      messageId, // Store the Message-ID we generated
      from: fromAddress,
      to: recipients,
      cc,
      bcc,
      subject,
      body: emailBody,
      html,
      // Threading fields
      threadId,
      inReplyTo: finalInReplyTo,
      references: finalReferences,
      status: 'sent',
      sentAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: sentEmail._id,
        resendId: data?.id,
        messageId,
        threadId,
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
