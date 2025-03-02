// hijriCalendar.js
export async function fetchHijriCalendar() {
    const response = await fetch('https://api.aladhan.com/v1/gToH');
    const data = await response.json();
    return data.data.hijri;
}

export function displayHijriCalendar(hijriDate) {
    const hijriContainer = document.createElement('div');
    hijriContainer.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.7); color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
            <h3>Hijri Date</h3>
            <p>${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year}</p>
        </div>
    `;
    return hijriContainer;
}
