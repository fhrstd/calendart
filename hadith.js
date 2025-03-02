// hadith.js - Module for fetching and displaying daily hadiths from local file

export class HadithDisplay {
  constructor() {
    this.dailyHadith = null;
    this.currentLanguage = 'id'; // Default language - Indonesian
    this.hadithData = [];
  }

  async initialize() {
    try {
      await this.loadHadithData();
      this.selectDailyHadith();
    } catch (error) {
      console.error("Error initializing Hadith display:", error);
      this.setFallbackHadith();
    }
  }

  async loadHadithData() {
    const response = await fetch('./daily-hadith.json');
    if (!response.ok) {
      throw new Error('Failed to load daily-hadith.json');
    }
    this.hadithData = await response.json();
  }

  selectDailyHadith() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % this.hadithData.length;
    this.dailyHadith = this.hadithData[index];
  }

  setFallbackHadith() {
    this.dailyHadith = {
      id: 'fallback-1',
      book: 'Fallback Book',
      source: 'Fallback Source',
      narrator: 'Unknown',
      text: {
        arab: 'Fallback Arabic Text',
        id: 'Fallback Indonesian Text',
        en: 'Fallback English Text'
      }
    };
  }

  createHadithElement() {
    const hadithDiv = document.createElement('div');
    hadithDiv.className = 'ar-hadith';

    if (this.dailyHadith) {
      const arabicText = document.createElement('div');
      arabicText.className = 'hadith-arabic';
      arabicText.textContent = this.dailyHadith.text.arab;

      const idText = document.createElement('div');
      idText.className = 'hadith-id';
      idText.textContent = this.dailyHadith.text.id;

      const enText = document.createElement('div');
      enText.className = 'hadith-en';
      enText.textContent = this.dailyHadith.text.en;

      const sourceText = document.createElement('div');
      sourceText.className = 'hadith-source';
      sourceText.textContent = `Source: ${this.dailyHadith.source} | Narrator: ${this.dailyHadith.narrator}`;

      const langSelector = document.createElement('div');
      langSelector.className = 'hadith-language-selector';

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

      langSelector.appendChild(arabicButton);
      langSelector.appendChild(indonesianButton);
      langSelector.appendChild(englishButton);
      langSelector.appendChild(allButton);

      hadithDiv.appendChild(arabicText);
      hadithDiv.appendChild(idText);
      hadithDiv.appendChild(enText);
      hadithDiv.appendChild(sourceText);
      hadithDiv.appendChild(langSelector);

      this.setLanguageDisplay('all', arabicText, idText, enText);
    } else {
      const loadingText = document.createElement('div');
      loadingText.textContent = 'Loading hadith...';
      hadithDiv.appendChild(loadingText);
    }

    return hadithDiv;
  }

  setLanguageDisplay(language, arabicElement, idElement, enElement) {
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
