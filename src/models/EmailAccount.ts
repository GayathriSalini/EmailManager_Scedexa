import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailAccount extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAccountSchema = new Schema<IEmailAccount>(
  {
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#6366f1', // Indigo
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmailAccount: Model<IEmailAccount> =
  mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);

export default EmailAccount;
