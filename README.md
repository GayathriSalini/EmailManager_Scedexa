# MailBox - Email Manager

A complete email inbox application built with Next.js and Resend API. Manage multiple email accounts, send/receive emails, and schedule batch emails to multiple recipients.

![MailBox Dashboard](https://placeholder.com/dashboard.png)

## Features

- 📧 **Multiple Email Accounts** - Add accounts like `outreach@`, `contact@`, `hello@`
- 📥 **Inbox Management** - Receive and view emails via Resend webhooks
- 📤 **Send Emails** - Compose and send emails immediately
- ⏰ **Email Scheduler** - Schedule emails to multiple recipients at a specific time
- 📊 **Dashboard** - Overview of all accounts with stats
- 🌙 **Dark Theme** - Modern, sleek dark UI

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Resend account with verified domain

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd emails-scedexa
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# MongoDB Connection String (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailbox?retryWrites=true&w=majority

# Optional: Webhook Secret for signature verification
RESEND_WEBHOOK_SECRET=
```

### 3. Configure Resend

1. **Verify your domain** at [Resend Domains](https://resend.com/domains)
2. **Create API Key** at [Resend API Keys](https://resend.com/api-keys)
3. **Configure Webhook** (for receiving emails):
   - Go to [Resend Webhooks](https://resend.com/webhooks)
   - Add webhook URL: `https://your-domain.com/api/webhooks/resend`
   - Select event: `email.received`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Email Accounts

1. Click the **+** button next to "Accounts" in the sidebar
2. Enter account name (e.g., "Outreach")
3. Enter email address (e.g., `outreach@yourdomain.com`)
4. Choose a color
5. Click "Add Account"

### Sending Emails

1. Click **Compose** button
2. Select the "From" account
3. Add recipients (press Enter to add each one)
4. Enter subject and message
5. Click **Send Email**

### Scheduling Emails

1. Click **Compose** button
2. Toggle to **Schedule** mode
3. Fill in recipients and message
4. Select date and time
5. Click **Schedule Email**

### Receiving Emails

Emails sent to your verified domain addresses are automatically received via webhooks and appear in the corresponding account's inbox.

## API Endpoints

### Accounts

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| GET    | `/api/accounts`            | List all accounts   |
| POST   | `/api/accounts`            | Create new account  |
| GET    | `/api/accounts/[id]`       | Get account details |
| PATCH  | `/api/accounts/[id]`       | Update account      |
| DELETE | `/api/accounts/[id]`       | Delete account      |
| GET    | `/api/accounts/[id]/inbox` | Get inbox emails    |
| GET    | `/api/accounts/[id]/sent`  | Get sent emails     |

### Emails

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| POST   | `/api/emails/send`           | Send email immediately |
| POST   | `/api/emails/schedule`       | Schedule email         |
| GET    | `/api/emails/schedule`       | List scheduled emails  |
| GET    | `/api/emails/scheduled/[id]` | Get scheduled email    |
| PATCH  | `/api/emails/scheduled/[id]` | Reschedule email       |
| DELETE | `/api/emails/scheduled/[id]` | Cancel scheduled email |

### Webhooks

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| POST   | `/api/webhooks/resend` | Receive Resend webhook events |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── accounts/          # Account CRUD endpoints
│   │   ├── emails/            # Email send/schedule endpoints
│   │   └── webhooks/          # Resend webhook handler
│   ├── accounts/[id]/         # Account inbox/sent pages
│   ├── compose/               # Compose email page
│   ├── scheduled/             # Scheduled emails page
│   ├── layout.tsx
│   ├── page.tsx               # Dashboard
│   └── globals.css
├── components/
│   ├── Sidebar.tsx
│   ├── EmailList.tsx
│   ├── EmailDetail.tsx
│   ├── ComposeForm.tsx
│   └── AccountCard.tsx
├── lib/
│   ├── db.ts                  # MongoDB connection
│   ├── resend.ts              # Resend client
│   └── utils.ts               # Utility functions
└── models/
    ├── EmailAccount.ts
    ├── SentEmail.ts
    ├── ReceivedEmail.ts
    └── ScheduledEmail.ts
```

## Local Development with Webhooks

To test webhook functionality locally:

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy the ngrok URL and add it as a webhook in Resend

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT
