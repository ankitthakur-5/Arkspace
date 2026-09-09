# Arkspace V2.1

Mobile-friendly Next.js + Supabase foundation for Arkspace.

## What is included

- Email/password authentication
- Private workspaces
- Workspace membership foundation
- PostgreSQL database
- Row Level Security policies
- Permanent Supabase Storage uploads/downloads
- File search
- Shared tasks
- Shared notes
- Members list
- Responsive mobile UI

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy your Supabase Project URL and anon/public key.
5. Add these variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Redeploy.
7. Open Arkspace and create an account.

## Important

Never put the Supabase `service_role` key in the browser or in `NEXT_PUBLIC_*` variables.

## Next V2 steps

- Workspace invitations
- File folders and previews
- File delete/version history
- Realtime chat
- Activity feed
- Better task board/editor
- Workspace permissions UI
- AI assistant
