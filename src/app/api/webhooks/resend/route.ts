import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailAccount from '@/models/EmailAccount';
import ReceivedEmail from '@/models/ReceivedEmail';
import SentEmail from '@/models/SentEmail';

// POST: Webhook endpoint for receiving emails from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      if (!signature) {
        console.warn('Missing webhook signature');
      }
    }

    console.log('Received webhook event:', body.type);

    // Handle different event types
    if (body.type === 'email.received') {
      await handleEmailReceived(body.data);
    } else if (body.type === 'email.delivered') {
      await handleEmailDelivered(body.data);
    } else if (body.type === 'email.bounced') {
      await handleEmailBounced(body.data);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

interface EmailReceivedData {
  email_id?: string;
  message_id?: string; // Message-ID header
  from: string;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  created_at?: string;
  // Threading headers from Resend
  headers?: {
    'message-id'?: string;
    'in-reply-to'?: string;
    references?: string;
  };
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
    download_url?: string;
  }>;
}

// Extract thread subject (removes Re:, Fwd:, etc.)
function extractThreadSubject(subject: string): string {
  return subject.replace(/^(Re:|Fwd:|Fw:|RE:|FWD:|FW:)\s*/gi, '').trim();
}

async function handleEmailReceived(data: EmailReceivedData) {
  try {
    await connectDB();

    const toAddress = Array.isArray(data.to) ? data.to[0] : data.to;
    
    // Extract email address from "Name <email>" format
    const emailMatch = toAddress.match(/<(.+)>/) || [null, toAddress];
    const cleanEmail = emailMatch[1]?.toLowerCase() || toAddress.toLowerCase();

    // Find matching account
    const account = await EmailAccount.findOne({
      email: cleanEmail,
      isActive: true,
    });

    if (!account) {
      console.log(`No account found for email: ${cleanEmail}`);
      return;
    }

    // Extract sender name if available
    const fromMatch = data.from.match(/^(.+)<(.+)>$/);
    const fromName = fromMatch ? fromMatch[1].trim() : undefined;
    const fromEmail = fromMatch ? fromMatch[2].trim() : data.from;

    // Extract threading information
    const messageId = data.headers?.['message-id'] || data.message_id;
    const inReplyTo = data.headers?.['in-reply-to'];
    const referencesHeader = data.headers?.references;
    const references = referencesHeader 
      ? referencesHeader.split(/\s+/).filter(Boolean)
      : [];

    // Determine thread ID
    let threadId: string | undefined;
    
    if (inReplyTo || references.length > 0) {
      // This is a reply - try to find the thread from existing emails
      const searchIds = [inReplyTo, ...references].filter((id): id is string => typeof id === 'string' && id.length > 0);
      
      if (searchIds.length > 0) {
        // Look for existing thread based on Message-IDs
        const existingSent = await SentEmail.findOne({
          accountId: account._id,
          messageId: { $in: searchIds },
        });
        
        const existingReceived = await ReceivedEmail.findOne({
          accountId: account._id,
          messageId: { $in: searchIds },
        });
        
        const existing = existingSent || existingReceived;
        if (existing?.threadId) {
          threadId = existing.threadId;
        }
      }
    }
    
    // If no thread found, create one from subject
    if (!threadId) {
      threadId = extractThreadSubject(data.subject || '(No Subject)');
    }

    // Create received email record with threading info
    await ReceivedEmail.create({
      accountId: account._id,
      resendId: data.email_id,
      messageId,
      from: fromEmail,
      fromName,
      to: cleanEmail,
      subject: data.subject || '(No Subject)',
      body: data.text || '',
      html: data.html,
      // Threading fields
      threadId,
      inReplyTo,
      references,
      attachments: data.attachments?.map((att) => ({
        filename: att.filename,
        contentType: att.content_type,
        size: att.size,
        url: att.download_url,
      })),
      receivedAt: data.created_at ? new Date(data.created_at) : new Date(),
      isRead: false,
    });

    console.log(`Email received and saved for account: ${account.name}, thread: ${threadId}`);
  } catch (error) {
    console.error('Error handling received email:', error);
    throw error;
  }
}

interface EmailStatusData {
  email_id: string;
  to?: string | string[];
  from?: string;
  subject?: string;
}

async function handleEmailDelivered(data: EmailStatusData) {
  try {
    await connectDB();
    
    // Import ScheduledEmail model dynamically to avoid circular deps
    const ScheduledEmail = (await import('@/models/ScheduledEmail')).default;
    
    // Find scheduled email by resend ID and update status
    const result = await ScheduledEmail.updateOne(
      { resendIds: data.email_id, status: 'pending' },
      { $set: { status: 'sent', sentAt: new Date() } }
    );
    
    if (result.matchedCount > 0) {
      console.log('Scheduled email marked as sent:', data.email_id);
    } else {
      console.log('Email delivered (not from scheduled):', data.email_id);
    }
  } catch (error) {
    console.error('Error handling email delivered:', error);
  }
}

async function handleEmailBounced(data: EmailStatusData) {
  try {
    await connectDB();
    
    const ScheduledEmail = (await import('@/models/ScheduledEmail')).default;
    
    // Mark scheduled email as failed if it bounced
    const result = await ScheduledEmail.updateOne(
      { resendIds: data.email_id },
      { $set: { status: 'failed' }, $push: { failedRecipients: data.to } }
    );
    
    if (result.matchedCount > 0) {
      console.log('Scheduled email marked as failed:', data.email_id);
    } else {
      console.log('Email bounced (not from scheduled):', data.email_id);
    }
  } catch (error) {
    console.error('Error handling email bounced:', error);
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ message: 'Resend webhook endpoint active' });
}
