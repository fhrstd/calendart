import fs from 'fs';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET;
const FILE_PATH = 'daily-hadith.json';

const books = ['bukhari', 'muslim', 'abu-daud', 'tirmidzi', 'nasai', 'ibnu-majah'];
const TOTAL_HADITHS = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugConnection() {
    const test = await fetch('https://api.hadith.gading.dev/');
    if (test.ok) {
        console.log('✅ Successfully connected to Gading.dev');
    } else {
        console.error('❌ Failed to connect to Gading.dev:', test.status, test.statusText);
    }
}

async function fetchHadith(book, number) {
    console.log(`📚 Fetching ${book}, Hadith #${number}`);
    const url = `https://api.hadith.gading.dev/books/${book}/${number}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`❌ Failed to fetch ${book} hadith ${number}:`, response.status, response.statusText);
        return null;
    }
    const data = await response.json();
    if (!data.data || !data.data.contents) {
        console.error(`❌ Invalid data for ${book} hadith ${number}`);
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
    await debugConnection();

    const hadithList = [];
    let bookIndex = 0;

    while (hadithList.length < TOTAL_HADITHS) {
        const book = books[bookIndex % books.length];
        const number = Math.floor(Math.random() * 300) + 1;

        const hadith = await fetchHadith(book, number);
        bookIndex++;  // Always rotate book, even if fetch fails
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
        console.log(`✅ Uploaded ${filename} to Supabase`);
        console.log(`🌐 Public URL: ${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(FILE_PATH).data.publicUrl}`);
    }
}

generateDailyHadith().catch(console.error);
