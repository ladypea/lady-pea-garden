# Lady Pea's Garden Starter

A starter Next.js + Supabase stream mini-game where viewers log in with Twitch, collect seeds, plant flowers, and show rare blooms on an OBS overlay.

## What is included

- Twitch login through Supabase Auth
- Seed balance
- Collect Seeds button with cooldown
- Plant Seed button with rarity roll
- Inventory page
- Leaderboard page
- Transparent OBS overlay page
- Admin page for stream events
- Supabase SQL schema and row-level security policies

## Pages

- `/` landing page
- `/garden` viewer garden
- `/leaderboard` top gardeners
- `/overlay` OBS browser source
- `/admin` streamer controls

## Setup

### 1. Create Supabase project

Go to Supabase and create a new project.

### 2. Add Twitch OAuth

In Supabase:
Authentication → Providers → Twitch

Add your Twitch Client ID and Client Secret.

In Twitch Developer Console, your OAuth redirect URL should be:

`https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`

### 3. Run the SQL schema

Open Supabase SQL Editor and paste the contents of:

`supabase/schema.sql`

Run it.

### 4. Add env variables

Create `.env.local` using `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open:

`http://localhost:3000`

### 6. OBS setup

Add a Browser Source in OBS:

`https://your-site.vercel.app/overlay`

Recommended:
- Width: 1920
- Height: 1080
- Custom CSS not needed
- Background is transparent by default

## Deploy to Vercel

Import the GitHub repo into Vercel and add the same environment variables.

## First things to customize

- Flower names in `lib/game.ts`
- Rarity chances in `lib/game.ts`
- Background/UI style in `app/globals.css`
- OBS overlay style in `app/overlay/page.tsx`
