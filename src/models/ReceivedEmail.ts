import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReceivedEmail extends Document {
  _id: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  resendId?: string;
  messageId?: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: {
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }[];
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReceivedEmailSchema = new Schema<IReceivedEmail>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailAccount',
      required: true,
      index: true,
    },
    resendId: {
      type: String,
      sparse: true,
    },
    messageId: {
      type: String,
      sparse: true,
    },
    from: {
      type: String,
      required: true,
    },
    fromName: {
      type: String,
    },
    to: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      default: '(No Subject)',
    },
    body: {
      type: String,
      required: true,
    },
    html: {
      type: String,
    },
    attachments: [
      {
        filename: String,
        contentType: String,
        size: Number,
        url: String,
      },
    ],
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ReceivedEmailSchema.index({ accountId: 1, receivedAt: -1 });
ReceivedEmailSchema.index({ accountId: 1, isRead: 1 });

const ReceivedEmail: Model<IReceivedEmail> =
  mongoose.models.ReceivedEmail || mongoose.model<IReceivedEmail>('ReceivedEmail', ReceivedEmailSchema);

export default ReceivedEmail;
