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
          id: selectedHadith.text.id,
          en: selectedHadith.text.en || '[English translation not available]'
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
        id: 'Sesungguhnya setiap amalan tergantung pada niatnya. Dan sesungguhnya setiap orang akan mendapatkan sesuai dengan yang diniatkannya.',
        en: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.'
      },
      narrator: 'Umar bin Al-Khattab',
      source: 'Sahih Bukhari, No. 1'
    };
  }

  createHadithElement() {
    const hadithDiv = document.createElement('div');
    hadithDiv.className = 'ar-hadith';
    hadithDiv.style.cssText = `
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      text-align: center;
      font-family: Arial, sans-serif;
      border-radius: 5px;
      margin-top: 10px;
      width: 100%;
      display: none;
    `;
    
    // Create hadith elements if we have data
    if (this.dailyHadith) {
      const arabicText = document.createElement('div');
      arabicText.className = 'hadith-arabic';
      arabicText.textContent = this.dailyHadith.text.arab;
      arabicText.style.cssText = `
        font-size: 18px;
        direction: rtl;
        margin-bottom: 10px;
        line-height: 1.5;
      `;
      
      const idText = document.createElement('div');
      idText.className = 'hadith-id';
      idText.textContent = this.dailyHadith.text.id;
      idText.style.cssText = `
        font-size: 16px;
        margin-bottom: 10px;
      `;
      
      const enText = document.createElement('div');
      enText.className = 'hadith-en';
      enText.textContent = this.dailyHadith.text.en;
      enText.style.cssText = `
        font-size: 16px;
        margin-bottom: 10px;
      `;
      
      const sourceText = document.createElement('div');
      sourceText.className = 'hadith-source';
      sourceText.textContent = `Source: ${this.dailyHadith.source} | Narrator: ${this.dailyHadith.narrator}`;
      sourceText.style.cssText = `
        font-size: 14px;
        font-style: italic;
        margin-bottom: 10px;
      `;
      
      // Language selector
      const langSelector = document.createElement('div');
      langSelector.className = 'hadith-language-selector';
      langSelector.style.cssText = `
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
      `;
      
      const arabicButton = document.createElement('button');
      arabicButton.textContent = 'Arabic';
      arabicButton.onclick = () => this.setLanguageDisplay('ar', arabicText, idText, enText);
      
      const indonesianButton = document.createElement('button');
      indonesianButton.textContent = 'Indonesian';
      indonesianButton.onclick = () => this.setLanguageDisplay('id', arabicText, idText, enText);
      
      const englishButton = document.createElement('button');
      englishButton.textContent = 'English';
      englishButton.onclick = () => this.setLanguageDisplay('en', arabicText, idText, enText);
      
      const allButton = document.createElement('button');
      allButton.textContent = 'All';
      allButton.onclick = () => this.setLanguageDisplay('all', arabicText, idText, enText);
      
      // Add elements to container
      langSelector.appendChild(arabicButton);
      langSelector.appendChild(indonesianButton);
      langSelector.appendChild(englishButton);
      langSelector.appendChild(allButton);
      
      hadithDiv.appendChild(arabicText);
      hadithDiv.appendChild(idText);
      hadithDiv.appendChild(enText);
      hadithDiv.appendChild(sourceText);
      hadithDiv.appendChild(langSelector);
      
      // Set default language display
      this.setLanguageDisplay('all', arabicText, idText, enText);
    } else {
      const loadingText = document.createElement('div');
      loadingText.textContent = 'Loading hadith...';
      hadithDiv.appendChild(loadingText);
    }
    
    return hadithDiv;
  }

  setLanguageDisplay(language, arabicElement, idElement, enElement) {
    // Set visibility based on selected language
    switch (language) {
      /*case 'ar':
        arabicElement.style.display = 'block';
        idElement.style.display = 'none';
        enElement.style.display = 'none';
        break;*/
      case 'id':
        arabicElement.style.display = 'block';
        idElement.style.display = 'block';
        enElement.style.display = 'none';
        break;
      case 'en':
        default:
        arabicElement.style.display = 'block';
        idElement.style.display = 'none';
        enElement.style.display = 'block';
        break;
      /*case 'all':
        arabicElement.style.display = 'block';
        idElement.style.display = 'block';
        enElement.style.display = 'block';
        break;*/
    }
    
    this.currentLanguage = language;
  }
}
