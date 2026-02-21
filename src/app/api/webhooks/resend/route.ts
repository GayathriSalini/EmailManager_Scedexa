import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailAccount from '@/models/EmailAccount';
import ReceivedEmail from '@/models/ReceivedEmail';
import SentEmail from '@/models/SentEmail';
import resend from '@/lib/resend';

// POST: Webhook endpoint for receiving emails from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Received webhook event:', body.type);

    // Handle different event types
    if (body.type === 'email.received') {
      await handleEmailReceived(body.data);
    } else if (body.type === 'email.delivered') {
      await handleEmailDelivered(body.data);
    } else if (body.type === 'email.bounced') {
      await handleEmailBounced(body.data);
    } else {
      console.log('Unhandled webhook event type:', body.type);
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

// Webhook payload — metadata only (no body/html/headers per Resend docs)
interface WebhookEmailData {
  email_id: string;
  message_id?: string;
  from: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  created_at?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    content_disposition?: string;
    content_id?: string;
    size?: number;
  }>;
}

// Full email from GET /emails/receiving/:id
interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string | null;
  html?: string | null;
  headers?: Record<string, string>;
  created_at: string;
  message_id?: string;
  reply_to?: string[];
  raw?: {
    download_url: string;
    expires_at: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    content_disposition?: string;
    content_id?: string;
    size?: number;
  }>;
}

// Extract thread subject (removes Re:, Fwd:, etc.)
function extractThreadSubject(subject: string): string {
  return subject.replace(/^(Re:|Fwd:|Fw:|RE:|FWD:|FW:)\s*/gi, '').trim();
}

// Extract clean email address from "Name <email>" or plain email format
function extractCleanEmail(address: string): string {
  const match = address.match(/<(.+)>/);
  return (match ? match[1] : address).toLowerCase().trim();
}

// Fetch the full received email content from Resend's Receiving API
async function fetchReceivedEmail(emailId: string): Promise<ResendReceivedEmail | null> {
  try {
    console.log(`Fetching full received email via resend.emails.receiving.get: ${emailId}`);
    const { data, error } = await resend.emails.receiving.get(emailId);

    if (error) {
      console.error('Resend receiving API error:', error);
      return null;
    }

    if (data) {
      console.log('Full received email keys:', Object.keys(data));
      console.log('Has text:', !!(data as ResendReceivedEmail).text, '| Has html:', !!(data as ResendReceivedEmail).html, '| Has headers:', !!(data as ResendReceivedEmail).headers);
      return data as ResendReceivedEmail;
    }

    return null;
  } catch (error) {
    console.error('Error fetching received email from Resend:', error);
    return null;
  }
}

async function handleEmailReceived(data: WebhookEmailData) {
  try {
    await connectDB();

    const emailId = data.email_id;
    if (!emailId) {
      console.error('No email_id in webhook data');
      return;
    }

    // Normalize to array and check ALL recipients
    const toAddresses = Array.isArray(data.to) ? data.to : [data.to];
    
    // Try each recipient to find a matching account
    let account = null;
    let cleanEmail = '';
    
    for (const toAddress of toAddresses) {
      cleanEmail = extractCleanEmail(toAddress);
      account = await EmailAccount.findOne({
        email: cleanEmail,
        isActive: true,
      });
      if (account) break;
    }

    if (!account) {
      console.log(`No account found for: ${toAddresses.map(extractCleanEmail).join(', ')}`);
      return;
    }

    console.log(`Matched inbound email to account: ${account.name} (${account.email})`);

    // Fetch full email content from Resend Receiving API
    // (Webhooks don't include body/html/headers per Resend docs)
    const fullEmail = await fetchReceivedEmail(emailId);

    const subject = fullEmail?.subject || data.subject || '(No Subject)';
    const fromRaw = fullEmail?.from || data.from;
    const createdAt = fullEmail?.created_at || data.created_at;

    // Extract sender name if available
    const fromMatch = fromRaw.match(/^(.+)<(.+)>$/);
    const fromName = fromMatch ? fromMatch[1].trim() : undefined;
    const fromEmail = fromMatch ? fromMatch[2].trim() : fromRaw;

    // Extract threading information from full email headers (object format from API)
    const headers = fullEmail?.headers;
    const messageId = (headers?.['message-id'] || headers?.['Message-ID'] || headers?.['Message-Id']) || data.message_id;
    const inReplyTo = headers?.['in-reply-to'] || headers?.['In-Reply-To'];
    const referencesHeader = headers?.['references'] || headers?.['References'];
    const references = referencesHeader 
      ? referencesHeader.split(/\s+/).filter(Boolean)
      : [];

    console.log('Threading info:', { messageId, inReplyTo, referencesCount: references.length });

    // Determine thread ID
    let threadId: string | undefined;
    
    if (inReplyTo || references.length > 0) {
      const searchIds = [inReplyTo, ...references].filter((id): id is string => typeof id === 'string' && id.length > 0);
      
      if (searchIds.length > 0) {
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

    // Fallback: match thread by subject if it's a reply
    if (!threadId) {
      const baseSubject = extractThreadSubject(subject);
      const isReply = /^(Re:|Fwd:|Fw:|RE:|FWD:|FW:)\s*/i.test(subject);
      
      if (isReply) {
        const existingSent = await SentEmail.findOne({ accountId: account._id, threadId: baseSubject });
        const existingReceived = await ReceivedEmail.findOne({ accountId: account._id, threadId: baseSubject });
        
        if (existingSent || existingReceived) {
          threadId = baseSubject;
          console.log(`Matched thread by subject: "${baseSubject}"`);
        }
      }
      
      if (!threadId) {
        threadId = baseSubject;
      }
    }

    // Build body from full email content
    let emailBody = fullEmail?.text || '';
    if (!emailBody && fullEmail?.html) {
      emailBody = fullEmail.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    if (!emailBody) {
      emailBody = '(No content)';
    }

    // Create received email record
    await ReceivedEmail.create({
      accountId: account._id,
      resendId: emailId,
      messageId,
      from: fromEmail,
      fromName,
      to: cleanEmail,
      subject,
      body: emailBody,
      html: fullEmail?.html || undefined,
      threadId,
      inReplyTo,
      references,
      attachments: (fullEmail?.attachments || data.attachments)?.map((att) => ({
        filename: att.filename,
        contentType: att.content_type,
        size: att.size || 0,
        url: undefined,
      })),
      receivedAt: createdAt ? new Date(createdAt) : new Date(),
      isRead: false,
    });

    console.log(`Email saved for account: ${account.name}, thread: ${threadId}, body length: ${emailBody.length}`);
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
