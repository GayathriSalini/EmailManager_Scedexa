import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISentEmail extends Document {
  _id: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  resendId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SentEmailSchema = new Schema<ISentEmail>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailAccount',
      required: true,
      index: true,
    },
    resendId: {
      type: String,
      required: true,
      unique: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: [String],
      required: true,
    },
    cc: {
      type: [String],
    },
    bcc: {
      type: [String],
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    html: {
      type: String,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'bounced', 'failed'],
      default: 'sent',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SentEmailSchema.index({ accountId: 1, sentAt: -1 });

const SentEmail: Model<ISentEmail> =
  mongoose.models.SentEmail || mongoose.model<ISentEmail>('SentEmail', SentEmailSchema);

export default SentEmail;
