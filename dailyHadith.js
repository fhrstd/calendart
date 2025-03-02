// dailyHadith.js
export async function fetchDailyHadith() {
    const response = await fetch('https://api.hadith.sutanlab.id/books/shahih-bukhari?range=1-300');
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.data.hadiths.length);
    return data.data.hadiths[randomIndex];
}

export function displayDailyHadith(hadith) {
    const hadithContainer = document.createElement('div');
    hadithContainer.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.7); color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
            <h3>Daily Hadith</h3>
            <p><strong>Arabic:</strong> ${hadith.arabic}</p>
            <p><strong>English:</strong> ${hadith.english}</p>
            <p><strong>Indonesian:</strong> ${hadith.id}</p>
            <p><strong>Source:</strong> ${hadith.book} (${hadith.number})</p>
        </div>
    `;
    return hadithContainer;
}
