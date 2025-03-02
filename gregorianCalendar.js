// gregorianCalendar.js
export function getGregorianDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function displayGregorianCalendar(gregorianDate) {
    const gregorianContainer = document.createElement('div');
    gregorianContainer.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.7); color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
            <h3>Gregorian Date</h3>
            <p>${gregorianDate}</p>
        </div>
    `;
    return gregorianContainer;
}
