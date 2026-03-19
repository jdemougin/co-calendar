# Services utilisés — co-calendar

## Hébergement
- **Vercel** — https://vercel.com
  - App : https://co-calendar-henna.vercel.app
  - Repo connecté : github.com/jdemougin/co-calendar
  - Plan : Hobby

## Code
- **GitHub** — https://github.com/jdemougin/co-calendar
  - Branche principale : `main`

## Base de données
- **Supabase** — https://supabase.com
  - Organisation : jdemougin' numerica (FREE)
  - Project URL : https://ranwnfwzvcsfmlehsvaf.supabase.co
  - Table : `push_subscriptions` (user_id, subscription, notif_time, last_sent_date, updated_at)
  - Env vars Vercel : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Notifications push
- **cron-job.org** — https://cron-job.org
  - Fréquence : chaque minute
  - URL appelée : https://co-calendar-henna.vercel.app/api/cron/notify
  - Header : `Authorization: Bearer <CRON_SECRET>`
  - Fuseau : Europe/Paris

## Auth Google
- **Google Cloud Console** — https://console.cloud.google.com
  - OAuth2 credentials : GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
  - Redirect URI : https://co-calendar-henna.vercel.app/api/auth/callback

## Variables d'environnement Vercel (toutes)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VITE_VAPID_PUBLIC_KEY`
- `CRON_SECRET`
