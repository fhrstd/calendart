// ar-extensions.js - Integration module for AR content enhancements
import { CalendarDisplay } from './calendar.js';
import { HadithDisplay } from './hadith.js';

export class ARExtensions {
  constructor() {
    this.calendarDisplay = new CalendarDisplay();
    this.hadithDisplay = new HadithDisplay();
    this.extensionsContainer = null;
    this.isInitialized = false;
    this.visibleTargets = new Set();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Initialize each module
    await Promise.all([
      this.calendarDisplay.initialize(),
      this.hadithDisplay.initialize()
    ]);
    
    // Create container for extensions
    this.createExtensionsContainer();
    
    // Set initialization flag
    this.isInitialized = true;
    console.log("AR Extensions initialized successfully");
  }

  createExtensionsContainer() {
    // Create a container to hold all extension content
    this.extensionsContainer = document.createElement('div');
    this.extensionsContainer.className = 'ar-extensions-container';
    this.extensionsContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 15px;
      display: none;
      flex-direction: column;
      z-index: 1000;
      pointer-events: auto;
    `;
    
    // Add calendar and hadith elements
    const calendarElement = this.calendarDisplay.createCalendarElement();
    const hadithElement = this.hadithDisplay.createHadithElement();
    
    this.extensionsContainer.appendChild(calendarElement);
    this.extensionsContainer.appendChild(hadithElement);
    
    // Add to DOM
    document.body.appendChild(this.extensionsContainer);
  }

  showExtensions() {
    if (!this.extensionsContainer) return;
    
    // Show the container
    this.extensionsContainer.style.display = 'flex';
    
    // Show individual elements
    const calendarElement = this.extensionsContainer.querySelector('.ar-calendar');
    const hadithElement = this.extensionsContainer.querySelector('.ar-hadith');
    
    if (calendarElement) calendarElement.style.display = 'block';
    if (hadithElement) hadithElement.style.display = 'block';
  }

  hideExtensions() {
    if (!this.extensionsContainer) return;
    this.extensionsContainer.style.display = 'none';
  }

  // Called when AR target is found
  onTargetFound(targetIndex) {
    this.visibleTargets.add(targetIndex);
    if (this.visibleTargets.size > 0) {
      this.showExtensions();
    }
  }

  // Called when AR target is lost
  onTargetLost(targetIndex) {
    this.visibleTargets.delete(targetIndex);
    if (this.visibleTargets.size === 0) {
      this.hideExtensions();
    }
  }
}
