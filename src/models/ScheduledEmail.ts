import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledEmail extends Document {
  _id: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  resendIds: string[];
  from: string;
  recipients: string[];
  subject: string;
  body: string;
  html?: string;
  scheduledAt: Date;
  status: 'pending' | 'sent' | 'cancelled' | 'partially_sent' | 'failed';
  sentCount: number;
  failedRecipients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledEmailSchema = new Schema<IScheduledEmail>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailAccount',
      required: true,
      index: true,
    },
    resendIds: {
      type: [String],
      default: [],
    },
    from: {
      type: String,
      required: true,
    },
    recipients: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one recipient is required',
      },
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
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'cancelled', 'partially_sent', 'failed'],
      default: 'pending',
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedRecipients: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding pending scheduled emails
ScheduledEmailSchema.index({ status: 1, scheduledAt: 1 });

const ScheduledEmail: Model<IScheduledEmail> =
  mongoose.models.ScheduledEmail || mongoose.model<IScheduledEmail>('ScheduledEmail', ScheduledEmailSchema);

export default ScheduledEmail;
