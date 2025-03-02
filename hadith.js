// hadith.js - Module for fetching and displaying daily hadiths

export class HadithDisplay {
  constructor() {
    this.dailyHadith = null;
    this.currentLanguage = 'id'; // Default language - Indonesian
    this.hadithsData = null;
  }

  async initialize() {
    try {
      await this.fetchDailyHadith();
    } catch (error) {
      console.error("Error initializing Hadith display:", error);
      this.setFallbackHadith();
    }
  }

  async fetchDailyHadith() {
    try {
      // Fetch the entire hadiths collection from the local JSON file
      const response = await fetch('./daily-hadith.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hadith data: ${response.statusText}`);
      }
      
      this.hadithsData = await response.json();
      
      if (!this.hadithsData || !Array.isArray(this.hadithsData) || this.hadithsData.length === 0) {
        throw new Error('Invalid hadith data or empty response');
      }
      
      // Calculate a consistent index based on date to get the same hadith for the whole day
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      // Choose a hadith based on the day
      const hadithIndex = dayOfYear % this.hadithsData.length;
      const selectedHadith = this.hadithsData[hadithIndex];
      
      if (!selectedHadith) {
        throw new Error('Failed to select a daily hadith');
      }
      
      this.dailyHadith = {
        id: selectedHadith.id,
        book: {
          id: selectedHadith.book.toLowerCase(),
          name: selectedHadith.book
        },
        text: {
          arab: selectedHadith.text.arab,
          id: selectedHadith.text.id
        },
        narrator: selectedHadith.narrator || '',
        source: selectedHadith.source
      };
      
      console.log("Successfully loaded daily hadith:", this.dailyHadith.source);
    } catch (error) {
      console.error("Error in fetchDailyHadith:", error);
      throw error;
    }
  }

  setFallbackHadith() {
    // Provide a fallback hadith if API fails
    this.dailyHadith = {
      id: 1,
      book: {
        id: 'bukhari',
        name: 'Sahih Bukhari'
      },
      text: {
        arab: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
        id: 'Sesungguhnya setiap amalan tergantung pada niatnya. Dan sesungguhnya setiap orang akan mendapatkan sesuai dengan yang diniatkannya.'
      },
      narrator: 'Umar bin Al-Khattab',
      source: 'Sahih Bukhari, No. 1'
    };
  }

  // For compatibility with existing code but not used in AR version
  createHadithElement() {
    const hadithDiv = document.createElement('div');
    hadithDiv.className = 'ar-hadith';
    hadithDiv.setAttribute('style', 'display: none;');
    
    return hadithDiv;
  }
}
