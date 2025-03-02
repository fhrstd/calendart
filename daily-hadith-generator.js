import fs from 'fs';
import fetch from 'node-fetch';

const books = ['bukhari', 'muslim', 'abu-daud', 'tirmidzi', 'nasai', 'ibnu-majah'];
const TOTAL_HADITHS = 500;

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
    const hadithList = [];
    let bookIndex = 0;

    while (hadithList.length < TOTAL_HADITHS) {
        const book = books[bookIndex % books.length];
        const number = Math.floor(Math.random() * 300) + 1;

        const hadith = await fetchHadith(book, number);
        bookIndex++;
        if (hadith) {
            hadithList.push(hadith);
        }
    }

    fs.writeFileSync('daily-hadith.json', JSON.stringify(hadithList, null, 2), 'utf8');
    console.log(`✅ Successfully generated daily-hadith.json with ${hadithList.length} hadiths`);
}

generateDailyHadith().catch(console.error);
