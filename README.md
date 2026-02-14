# Medico Planner

AI-powered clinic space planning for Canadian healthcare practices.

## Features

- **12 Clinic Types**: Dental, optometry, veterinary, pharmacy, and more
- **10 Provinces**: Province-specific building code compliance (NBC, OBC, BCBC)
- **Room Programming**: Intelligent room layouts with occupancy calculations
- **Compliance Checklist**: Automatic code compliance analysis
- **Version History**: Iterate on concept packages with full version tracking
- **File Uploads**: Upload existing floor plans for reference

## Tech Stack

- Next.js 15 (App Router, TypeScript, Tailwind CSS)
- shadcn/ui components
- Supabase (Postgres + Auth + Storage)
- Vercel deployment

## Setup

1. Clone and install:
```bash
npm install
```

2. Copy env template and fill in Supabase credentials:
```bash
cp .env.local.example .env.local
```

3. Run the SQL migration in your Supabase dashboard:
```
supabase/migrations/001_initial.sql
```

4. Start dev server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
