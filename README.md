# Daily Hadith Generator

This repository automatically generates a new `daily-hadith.json` every day and uploads it to your Supabase storage.

## How It Works

- Runs daily via GitHub Actions.
- Fetches 500 hadith from all 6 books using Gading.dev API.
- Uploads to your Supabase bucket (public URL ready).

## Setup

1. Fork this repo into your account.
2. Set repository **secrets** (under Settings > Secrets and Variables > Actions):

| Name            | Value                              |
|----------------|----------------------------------|
| SUPABASE_URL   | Your Supabase project URL |
| SUPABASE_KEY   | Your Supabase anon key |
| STORAGE_BUCKET | Name of your Supabase bucket (e.g., `ar-content`) |

3. That’s it! It will auto-run daily at midnight (UTC).

---
