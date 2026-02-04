import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailAccount from '@/models/EmailAccount';
import ReceivedEmail from '@/models/ReceivedEmail';

// POST: Webhook endpoint for receiving emails from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      // In production, you should verify the signature
      // For now, we'll just check if it exists
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
  from: string;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  created_at?: string;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
    download_url?: string;
  }>;
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

    // Create received email record
    await ReceivedEmail.create({
      accountId: account._id,
      resendId: data.email_id,
      from: fromEmail,
      fromName,
      to: cleanEmail,
      subject: data.subject || '(No Subject)',
      body: data.text || '',
      html: data.html,
      attachments: data.attachments?.map((att) => ({
        filename: att.filename,
        contentType: att.content_type,
        size: att.size,
        url: att.download_url,
      })),
      receivedAt: data.created_at ? new Date(data.created_at) : new Date(),
      isRead: false,
    });

    console.log(`Email received and saved for account: ${account.name}`);
  } catch (error) {
    console.error('Error handling received email:', error);
    throw error;
  }
}

interface EmailStatusData {
  email_id: string;
}

async function handleEmailDelivered(data: EmailStatusData) {
  // Update email status to delivered
  console.log('Email delivered:', data.email_id);
  // You could update SentEmail status here if needed
}

async function handleEmailBounced(data: EmailStatusData) {
  // Update email status to bounced
  console.log('Email bounced:', data.email_id);
  // You could update SentEmail status here if needed
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ message: 'Resend webhook endpoint active' });
}
