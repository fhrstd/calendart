import fs from 'fs';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const books = ['bukhari', 'muslim', 'abu-daud', 'tirmidzi', 'nasai', 'ibnu-majah'];
const TOTAL_HADITHS = 100; // Reduced from 500 for faster generation

// Translation using googletrans Python package
async function translateWithPython(text) {
    try {
        // Create a temporary file with the text to translate
        const tempFileName = `temp_translate_${Date.now()}.txt`;
        fs.writeFileSync(tempFileName, text, 'utf8');
        
        // Create a simple Python script that uses googletrans
        const pythonScript = `
import sys
from googletrans import Translator

try:
    # Read text from file
    with open("${tempFileName}", "r", encoding="utf-8") as f:
        text = f.read()
    
    # Initialize translator
    translator = Translator()
    
    # Translate text from Indonesian to English
    result = translator.translate(text, src='id', dest='en')
    
    # Print the translation
    print(result.text)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
        
        const pythonFileName = `translate_script_${Date.now()}.py`;
        fs.writeFileSync(pythonFileName, pythonScript, 'utf8');
        
        // Execute the Python script
        const { stdout, stderr } = await execPromise(`python ${pythonFileName}`);
        
        // Clean up temporary files
        fs.unlinkSync(tempFileName);
        fs.unlinkSync(pythonFileName);
        
        if (stderr) {
            console.error('Python translation error:', stderr);
            return fallbackTranslate(text);
        }
        
        return stdout.trim();
    } catch (error) {
        console.error('Translation execution error:', error.message);
        return fallbackTranslate(text);
    }
}

// Fallback translation with dictionary-based approach
const commonPhrases = {
    'Sesungguhnya setiap amalan tergantung pada niatnya': 'Indeed, actions are judged by intentions',
    'Barangsiapa mengajak kepada kebaikan': 'Whoever calls to goodness',
    // Add more common phrases here
};

function dictionaryTranslate(text) {
    // Look for exact matches
    if (commonPhrases[text]) {
        return commonPhrases[text];
    }
    
    // Try to find partial matches
    for (const [indo, eng] of Object.entries(commonPhrases)) {
        if (text.includes(indo)) {
            return text.replace(indo, eng);
        }
    }
    
    return null; // No match found
}

// Fallback translation function
function fallbackTranslate(text) {
    // Try dictionary approach first
    const dictResult = dictionaryTranslate(text);
    if (dictResult) return dictResult;
    
    // Otherwise mark as needing translation
    return `[Translation needed: ${text.substring(0, 30)}...]`;
}

async function fetchHadith(book, number) {
    console.log(`📚 Fetching ${book}, Hadith #${number}`);
    try {
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
        let englishTranslation;
        
        // Translate the Indonesian text to English
        if (hadith.id) {
            try {
                englishTranslation = await translateWithPython(hadith.id);
                console.log(`✓ Translated hadith ${book}-${number}`);
            } catch (error) {
                console.error(`❌ Translation failed for ${book}-${number}:`, error.message);
                englishTranslation = fallbackTranslate(hadith.id);
            }
        } else {
            englishTranslation = '[No Indonesian text to translate]';
        }
        
        return {
            id: `${book}-${number}`,
            book: capitalize(book),
            source: `${data.data.name}, No. ${number}`,
            narrator: hadith.narrator || 'N/A',
            text: {
                arab: hadith.arab || '',
                id: hadith.id || '',
                en: englishTranslation
            }
        };
    } catch (error) {
        console.error(`❌ Error fetching ${book} hadith ${number}:`, error.message);
        return null;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Fallback hadiths in case API fails
const fallbackHadiths = [
    {
        id: "bukhari-1",
        book: "Bukhari",
        source: "Sahih Bukhari, No. 1",
        narrator: "Umar bin Al-Khattab",
        text: {
            arab: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
            id: "Sesungguhnya setiap amalan tergantung pada niatnya. Dan sesungguhnya setiap orang akan mendapatkan sesuai dengan yang diniatkannya.",
            en: "The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended."
        }
    },
    {
        id: "muslim-1",
        book: "Muslim",
        source: "Sahih Muslim, No. 1",
        narrator: "Abu Hurairah",
        text: {
            arab: "مَنْ دَعَا إِلَى هُدًى كَانَ لَهُ مِنَ الأَجْرِ مِثْلُ أُجُورِ مَنْ تَبِعَهُ",
            id: "Barangsiapa mengajak kepada kebaikan, maka ia akan mendapat pahala seperti pahala orang yang mengikutinya.",
            en: "Whoever calls to guidance will have a reward similar to the rewards of those who follow him."
        }
    }
];

async function generateDailyHadith() {
    const hadithList = [];
    let bookIndex = 0;
    let attempts = 0;
    const maxAttempts = TOTAL_HADITHS * 3; // Allow for some failed fetches

    while (hadithList.length < TOTAL_HADITHS && attempts < maxAttempts) {
        attempts++;
        const book = books[bookIndex % books.length];
        bookIndex++;
        
        // Use a more consistent pattern for hadith numbers to avoid too many misses
        const number = (bookIndex % 100) + 1;

        const hadith = await fetchHadith(book, number);
        if (hadith) {
            hadithList.push(hadith);
            console.log(`✅ Added hadith #${hadithList.length}: ${hadith.source}`);
        }
        
        // Small delay to avoid overwhelming the APIs
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // If we didn't get enough hadiths, add fallbacks
    if (hadithList.length < TOTAL_HADITHS) {
        console.log(`⚠️ Could only fetch ${hadithList.length} hadiths. Adding fallbacks.`);
        
        // Add fallbacks and duplicates to reach the target
        while (hadithList.length < TOTAL_HADITHS) {
            // Add fallbacks first
            for (const fallback of fallbackHadiths) {
                if (hadithList.length < TOTAL_HADITHS) {
                    hadithList.push({...fallback});
                }
            }
            
            // If we still need more, duplicate existing ones with modified IDs
            if (hadithList.length < TOTAL_HADITHS) {
                const baseLength = Math.min(hadithList.length, 10);
                for (let i = 0; i < baseLength && hadithList.length < TOTAL_HADITHS; i++) {
                    const clone = {...hadithList[i]};
                    clone.id = `${clone.id}-dup-${hadithList.length}`;
                    hadithList.push(clone);
                }
            }
        }
    }

    fs.writeFileSync('daily-hadith.json', JSON.stringify(hadithList, null, 2), 'utf8');
    console.log(`✅ Successfully generated daily-hadith.json with ${hadithList.length} hadiths`);
}

// Check if Python and googletrans are installed
async function checkPythonDependencies() {
    try {
        // Check if Python is installed
        await execPromise('python --version');
        
        // Check if googletrans is installed
        try {
            await execPromise('pip show googletrans');
            console.log('✅ Python and googletrans are installed');
            return true;
        } catch (err) {
            console.log('⚠️ googletrans is not installed. Installing now...');
            try {
                await execPromise('pip install googletrans==4.0.0-rc1');
                console.log('✅ googletrans installed successfully');
                return true;
            } catch (pipErr) {
                console.error('❌ Failed to install googletrans:', pipErr.message);
                console.error('Please install it manually with: pip install googletrans==4.0.0-rc1');
                return false;
            }
        }
    } catch (err) {
        console.error('❌ Python is not installed or not in PATH');
        console.error('Please install Python and then install googletrans with: pip install googletrans==4.0.0-rc1');
        return false;
    }
}

// Main function
async function main() {
    const dependenciesOk = await checkPythonDependencies();
    if (dependenciesOk) {
        await generateDailyHadith();
    } else {
        console.error('❌ Cannot proceed without required dependencies');
    }
}

main().catch(console.error);
