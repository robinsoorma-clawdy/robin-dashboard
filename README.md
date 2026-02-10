# Robin Dashboard - Next.js + Supabase

Personal mission control dashboard with real-time task sync.

## Features

- 📝 Task board with real-time sync
- 📊 Activity tracking
- 🧠 Memory viewer
- 🌙 Dark theme
- 📱 Mobile responsive
- ⚡ Real-time updates via Supabase

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime)
- **Deployment:** Vercel

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL in `database.sql` to create tables
4. Copy the Project URL and Anon Key

### 2. Deploy to Vercel

1. Push this repo to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Database Schema

See `database.sql` for the full schema.

### Tables

- `tasks` - Task board items
- `activities` - Activity log
- `notes` - Quick notes

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.
