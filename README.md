# Daily Hadith Generator

This tool fetches 500 authentic hadith from Gading.dev and uploads them as `daily-hadith.json` to your Supabase Storage.

## Setup

1. Run:
    ```
    npm install
    ```
2. Set your `.env` file with your Supabase credentials.

3. Run:
    ```
    npm start
    ```

The file will be uploaded to your Supabase bucket and the public URL will be printed.

## Requirements
- Node.js 18+
- Valid Supabase Storage Bucket (ar-content or change in `.env`)
