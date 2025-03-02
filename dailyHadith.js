// hadith.js - Module for fetching and displaying daily hadiths

export class HadithDisplay {
  constructor() {
    this.dailyHadith = null;
    this.currentLanguage = 'id'; // Default language - Indonesian
    this.apiBaseUrl = 'https://api.hadith.gading.dev/';
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
    // Calculate a consistent index based on date to get the same hadith for the whole day
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Choose book randomly but consistently for the day
    const books = ['bukhari', 'muslim', 'abu-dawud', 'tirmidzi', 'nasai', 'ibnu-majah'];
    const bookIndex = dayOfYear % books.length;
    const selectedBook = books[bookIndex];
    
    // Fetch total available hadiths in the book
    const bookResponse = await fetch(`${this.apiBaseUrl}books/${selectedBook}`);
    if (!bookResponse.ok) throw new Error(`Failed to fetch hadith book: ${selectedBook}`);
    
    const bookData = await bookResponse.json();
    if (!bookData.data || !bookData.data.available) {
      throw new Error('Invalid hadith book data');
    }
    
    const totalHadiths = bookData.data.available;
    // Generate a hadith number for today (1-based index)
    const hadithNumber = (dayOfYear % totalHadiths) + 1;
    
    // Fetch the specific hadith
    const hadithResponse = await fetch(`${this.apiBaseUrl}books/${selectedBook}/${hadithNumber}`);
    if (!hadithResponse.ok) throw new Error('Failed to fetch hadith');
    
    const hadithData = await hadithResponse.json();
    if (!hadithData.data) throw new Error('Invalid hadith data');
    
    this.dailyHadith = {
      id: hadithData.data.number,
      book: {
        id: selectedBook,
        name: bookData.data.name
      },
      text: {
        arab: hadithData.data.arab,
        id: hadithData.data.id,
        en: '' // Default empty, will be translated
      },
      narrator: hadithData.data.narrator || '',
      source: `${bookData.data.name}, No. ${hadithData.data.number}`
    };
    
    // Try to get English translation if available
    try {
      await this.fetchEnglishTranslation(selectedBook, hadithNumber);
    } catch (error) {
      console.warn("Couldn't fetch English translation:", error);
    }
  }
  
  async fetchEnglishTranslation(book, number) {
    // English translation might come from a different API or source
    // For now, we'll use machine translation (in a real app, you would use a proper English hadith API)
    try {
      // Use an alternative API for English version if available
      const enResponse = await fetch(`https://sunnah.com/api/v1/hadiths?book=${book}&number=${number}`);
      if (enResponse.ok) {
        const enData = await enResponse.json();
        if (enData && enData.data && enData.data.text) {
          this.dailyHadith.text.en = enData.data.text;
          return;
        }
      }
      
      // Fallback: generate simple English based on Indonesian
      // In a real app, you'd use a proper translation API or database
      this.dailyHadith.text.en = `[Translation not available]`;
    } catch (error) {
      console.warn("Error getting English translation:", error);
      this.dailyHadith.text.en = `[Translation not available]`;
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
      padding: 15px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      text-align: right;
      font-family: Arial, sans-serif;
      border-radius: 5px;
      margin-top: 10px;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    `;
    
    // Create hadith elements if we have data
    if (this.dailyHadith) {
      const arabicText = document.createElement('div');
      arabicText.className = 'hadith-arabic';
      arabicText.style.cssText = `
        font-size: 18px;
        line-height: 1.8;
        margin-bottom: 15px;
        direction: rtl;
        font-family: 'Traditional Arabic', Arial, sans-serif;
      `;
      arabicText.textContent = this.dailyHadith.text.arab;
      
      const idText = document.createElement('div');
      idText.className = 'hadith-id';
      idText.style.cssText = `
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 15px;
        text-align: left;
      `;
      idText.textContent = this.dailyHadith.text.id;
      
      const enText = document.createElement('div');
      enText.className = 'hadith-en';
      enText.style.cssText = `
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 15px;
        text-align: left;
        border-top: 1px solid rgba(255,255,255,0.2);
        padding-top: 10px;
      `;
      enText.textContent = this.dailyHadith.text.en;
      
      const sourceText = document.createElement('div');
      sourceText.className = 'hadith-source';
      sourceText.style.cssText = `
        font-size: 12px;
        font-style: italic;
        color: #ccc;
        text-align: left;
      `;
      sourceText.textContent = `Source: ${this.dailyHadith.source} | Narrator: ${this.dailyHadith.narrator}`;
      
      // Language selector
      const langSelector = document.createElement('div');
      langSelector.className = 'hadith-language-selector';
      langSelector.style.cssText = `
        font-size: 12px;
        margin-top: 10px;
        text-align: left;
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
      
      // Style buttons
      [arabicButton, indonesianButton, englishButton, allButton].forEach(btn => {
        btn.style.cssText = `
          background-color: #444;
          color: white;
          border: none;
          padding: 5px 10px;
          margin: 0 5px 5px 0;
          border-radius: 3px;
          cursor: pointer;
        `;
      });
      
      langSelector.appendChild(arabicButton);
      langSelector.appendChild(indonesianButton);
      langSelector.appendChild(englishButton);
      langSelector.appendChild(allButton);
      
      // Add elements to container
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
      case 'ar':
        arabicElement.style.display = 'block';
        idElement.style.display = 'none';
        enElement.style.display = 'none';
        break;
      case 'id':
        arabicElement.style.display = 'none';
        idElement.style.display = 'block';
        enElement.style.display = 'none';
        break;
      case 'en':
        arabicElement.style.display = 'none';
        idElement.style.display = 'none';
        enElement.style.display = 'block';
        break;
      case 'all':
      default:
        arabicElement.style.display = 'block';
        idElement.style.display = 'block';
        enElement.style.display = 'block';
        break;
    }
    
    this.currentLanguage = language;
  }
}
