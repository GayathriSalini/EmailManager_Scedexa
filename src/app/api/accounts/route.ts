import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailAccount from '@/models/EmailAccount';

// GET: List all email accounts
export async function GET() {
  try {
    await connectDB();
    const accounts = await EmailAccount.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST: Create new email account
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { name, email, description, color } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAccount = await EmailAccount.findOne({ email: email.toLowerCase() });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const account = await EmailAccount.create({
      name,
      email: email.toLowerCase(),
      description,
      color: color || '#6366f1',
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
