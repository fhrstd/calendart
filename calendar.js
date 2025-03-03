// calendar.js - Module for Hijri and Gregorian calendar display

export class CalendarDisplay {
  constructor() {
    this.gregorianDate = new Date();
    this.hijriDate = null;
  }

  async initialize() {
    try {
      await this.fetchHijriDate();
    } catch (error) {
      console.error("Error initializing Hijri calendar:", error);
      // Fallback to estimated calculation if API fails
      this.calculateEstimatedHijriDate();
    }
  }

  async fetchHijriDate() {
    // Using the Aladhan API to get accurate Hijri date
    const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${this.formatGregorianDate()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Hijri date');
    }
    
    const data = await response.json();
    if (data.code === 200 && data.data) {
      this.hijriDate = data.data.hijri;
    } else {
      throw new Error('Invalid Hijri date data');
    }
  }

  calculateEstimatedHijriDate() {
    // Simple fallback estimation (not accurate but better than nothing)
    // Hijri year is roughly 354.36 days
    const gregorianTime = this.gregorianDate.getTime();
    const gregorianYear = this.gregorianDate.getFullYear();
    const baseGregorian = new Date(2023, 6, 19).getTime(); // Known date: 19 July 2023
    const baseHijri = { year: 1445, month: { number: 1 }, day: "1" }; // 1 Muharram 1445
    
    const daysDiff = Math.floor((gregorianTime - baseGregorian) / (1000 * 60 * 60 * 24));
    const hijriDaysSinceBase = daysDiff % 354;
    const hijriYearsSinceBase = Math.floor(daysDiff / 354);
    
    // Extremely simplified month and day calculation
    const hijriMonth = Math.floor(hijriDaysSinceBase / 29.5) + 1;
    const hijriDay = Math.floor(hijriDaysSinceBase % 29.5) + 1;
    
    // Calculate weekday (0-6, where 0 is Sunday in Gregorian)
    // Need to convert to Islamic weekday where 1 is Sunday
    const gregorianWeekday = this.gregorianDate.getDay();
    
    this.hijriDate = {
      year: baseHijri.year + hijriYearsSinceBase,
      month: {
        number: hijriMonth,
        en: this.getHijriMonthName(hijriMonth)
      },
      day: hijriDay.toString(),
      weekday: {
        en: this.getIslamicDayName(gregorianWeekday)
      }
    };
  }
  
  getHijriMonthName(monthNumber) {
    const months = [
      "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir",
      "Jumadal Ula", "Jumadal Akhira", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhul Qa'dah", "Dhul Hijjah"
    ];
    return months[monthNumber - 1];
  }
  
  getIslamicDayName(gregorianWeekday) {
    // Islamic days start with Sunday as the first day
    // Convert from Gregorian weekday (0=Sunday) to Islamic day name
    const islamicDays = [
      "Ahad", // Sunday (يوم الأحد)
      "Ithnayn", // Monday (يوم الإثنين)
      "Thulaathaa", // Tuesday (يوم الثلاثاء)
      "Arba'aa", // Wednesday (يوم الأربعاء)
      "Khamees", // Thursday (يوم الخميس)
      "Jumu'ah", // Friday (يوم الجمعة)
      "Sabt" // Saturday (يوم السبت)
    ];
    return islamicDays[gregorianWeekday];
  }
  
  formatGregorianDate() {
    const day = this.gregorianDate.getDate().toString().padStart(2, '0');
    const month = (this.gregorianDate.getMonth() + 1).toString().padStart(2, '0');
    const year = this.gregorianDate.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  getFormattedGregorianDate() {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return this.gregorianDate.toLocaleDateString('en-US', options);
  }
  
  getFormattedHijriDate() {
    if (!this.hijriDate) return "Loading Hijri date...";
    
    // For API-fetched data, this.hijriDate.weekday.en contains the day name
    // For fallback calculation, we need to generate it
    let islamicDayName = "";
    
    if (this.hijriDate.weekday && this.hijriDate.weekday.en) {
      // Use API-provided weekday if available
      islamicDayName = this.hijriDate.weekday.en;
    } else {
      // Calculate based on Gregorian date
      islamicDayName = this.getIslamicDayName(this.gregorianDate.getDay());
    }
    
    return `${islamicDayName}, ${this.hijriDate.day} ${this.hijriDate.month.en} ${this.hijriDate.year} H`;
  }
  
  createCalendarElement() {
    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'ar-calendar';
    calendarDiv.style.cssText = `
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.7);
      color: black;
      text-align: center;
      font-family: Arial, sans-serif;
      border-radius: 5px;
      margin-top: 10px;
      width: 100%;
      display: none;
    `;
    
    const gregorianElement = document.createElement('div');
    gregorianElement.className = 'gregorian-date';
    gregorianElement.textContent = this.getFormattedGregorianDate();
    
    const hijriElement = document.createElement('div');
    hijriElement.className = 'hijri-date';
    hijriElement.textContent = this.getFormattedHijriDate();
    
    calendarDiv.appendChild(hijriElement);
    calendarDiv.appendChild(gregorianElement);
    
    return calendarDiv;
  }
}
