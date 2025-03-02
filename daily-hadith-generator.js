
// daily-hadith-generator.js
import fs from 'fs';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// ===== CONFIGURE THESE =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET; // Example: 'ar-content'
const FILE_PATH = 'daily-hadith.json'; // Path inside your Supabase bucket

// List of 6 major books
const books = ['bukhari', 'muslim', 'abu-dawud', 'tirmidzi', 'nasai', 'ibnu-majah'];

// Total hadith count to collect
const TOTAL_HADITHS = 500;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchHadith(book, number) {
    const url = `https://api.hadith.gading.dev/books/${book}/${number}`;
    const response = await fetch(url);

    if (!response.ok) {
        console.error(`❌ Failed to fetch ${book} hadith ${number}`);
        return null;
    }

    const data = await response.json();
    if (!data.data || !data.data.contents) {
        console.error(`❌ No valid data for ${book} hadith ${number}`);
        return null;
    }

    const hadith = data.data.contents;
    return {
        id: `${book}-${number}`,
        book: capitalize(book),
        source: `${data.data.name}, No. ${number}`,
        narrator: hadith.narrator || 'N/A',
        text: {
            arab: hadith.arab || '',
            id: hadith.id || '',
            en: machineTranslate(hadith.id)
        }
    };
}

function machineTranslate(indonesianText) {
    return `EN Translation: ${indonesianText}`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generateDailyHadith() {
    const hadithList = [];

    while (hadithList.length < TOTAL_HADITHS) {
        const book = books[hadithList.length % books.length];
        const number = Math.floor(Math.random() * 300) + 1;

        const hadith = await fetchHadith(book, number);
        if (hadith) {
            hadithList.push(hadith);
        }
    }

    fs.writeFileSync('daily-hadith.json', JSON.stringify(hadithList, null, 2), 'utf8');
    console.log(`✅ Successfully generated daily-hadith.json with ${hadithList.length} hadiths`);

    await uploadToSupabase('daily-hadith.json');
}

async function uploadToSupabase(filename) {
    const fileBuffer = fs.readFileSync(filename);
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(FILE_PATH, fileBuffer, {
        contentType: 'application/json',
        upsert: true
    });

    if (error) {
        console.error('❌ Failed to upload to Supabase:', error.message);
    } else {
        console.log(`✅ Uploaded ${filename} to Supabase at ${data?.path || FILE_PATH}`);
        console.log(`🌐 Public URL: ${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(FILE_PATH).data.publicUrl}`);
    }
}

generateDailyHadith().catch(console.error);
