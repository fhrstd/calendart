// ar-extensions.js - Updated to wait for MindAR readiness before initializing extensions
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

    console.log("Waiting for AR readiness before initializing extensions...");

    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error("A-Frame scene not found. AR Extensions will not load.");
      return;
    }

    scene.addEventListener('arReady', async () => {
      console.log("MindAR ready - Initializing AR Extensions...");
      await this.calendarDisplay.initialize();
      await this.hadithDisplay.initialize();

      this.createExtensionsContainer();
      this.isInitialized = true;
      console.log("AR Extensions initialized successfully after AR ready.");
    }, { once: true });
  }

  createExtensionsContainer() {
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

    const calendarElement = this.calendarDisplay.createCalendarElement();
    const hadithElement = this.hadithDisplay.createHadithElement();

    this.extensionsContainer.appendChild(calendarElement);
    this.extensionsContainer.appendChild(hadithElement);

    document.body.appendChild(this.extensionsContainer);
  }

  showExtensions() {
    if (!this.extensionsContainer) return;
    this.extensionsContainer.style.display = 'flex';
  }

  hideExtensions() {
    if (!this.extensionsContainer) return;
    this.extensionsContainer.style.display = 'none';
  }

  onTargetFound(targetIndex) {
    this.visibleTargets.add(targetIndex);
    if (this.visibleTargets.size > 0) {
      this.showExtensions();
    }
  }

  onTargetLost(targetIndex) {
    this.visibleTargets.delete(targetIndex);
    if (this.visibleTargets.size === 0) {
      this.hideExtensions();
    }
  }
}
