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
    this.arEntities = {};
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Initialize each module
    await Promise.all([
      this.calendarDisplay.initialize(),
      this.hadithDisplay.initialize()
    ]);
    
    // We'll create AR entities later when targets are found
    
    // Set initialization flag
    this.isInitialized = true;
    console.log("AR Extensions initialized successfully");
  }

  // Create AR entities for calendar and hadith
  createAREntities(targetIndex) {
    // If entities already exist for this target, just show them
    if (this.arEntities[targetIndex]) {
      this.showAREntities(targetIndex);
      return;
    }
    
    // Find the target entity for positioning
    const targetEntity = document.querySelector(`a-entity[mindar-image-target="targetIndex: ${targetIndex}"]`);
    if (!targetEntity) {
      console.error("Target entity not found:", targetIndex);
      return;
    }
    
    // Create container entity for all extensions
    const containerEntity = document.createElement('a-entity');
    containerEntity.setAttribute('position', '0 -1.5 0'); // Position below animation
    
    // Create entities for calendar and hadith
    const calendarContent = this.calendarDisplay.getFormattedHijriDate() + 
                           "\n" + this.calendarDisplay.getFormattedGregorianDate();
    
    // Calendar entity
    const calendarEntity = document.createElement('a-entity');
    calendarEntity.setAttribute('text', {
      value: calendarContent,
      align: 'center',
      width: 1.5,
      color: 'white',
      font: 'exo2bold'
    });
    calendarEntity.setAttribute('position', '0 0 0');
    calendarEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1,
      height: 0.3
    });
    calendarEntity.setAttribute('material', {
      color: '#000',
      opacity: 0.7,
      transparent: true
    });
    
    // Format hadith text
    let hadithText = "";
    if (this.hadithDisplay.dailyHadith) {
      // Add Arabic text
      hadithText += this.hadithDisplay.dailyHadith.text.arab + "\n\n";
      // Add Indonesian text
      hadithText += this.hadithDisplay.dailyHadith.text.id + "\n\n";
      // Add source
      hadithText += "Source: " + this.hadithDisplay.dailyHadith.source;
    } else {
      hadithText = "Loading hadith...";
    }
    
    // Hadith entity
    const hadithEntity = document.createElement('a-entity');
    hadithEntity.setAttribute('text', {
      value: hadithText,
      align: 'center',
      width: 1.5,
      color: 'white',
      font: 'exo2bold'
    });
    hadithEntity.setAttribute('position', '0 -0.5 0');
    hadithEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1,
      height: 0.6
    });
    hadithEntity.setAttribute('material', {
      color: '#000',
      opacity: 0.7,
      transparent: true
    });

    // Add entities to container
    containerEntity.appendChild(calendarEntity);
    containerEntity.appendChild(hadithEntity);
    
    // Add container to target
    targetEntity.appendChild(containerEntity);
    
    // Store reference to container
    this.arEntities[targetIndex] = containerEntity;
  }

  showAREntities(targetIndex) {
    if (this.arEntities[targetIndex]) {
      this.arEntities[targetIndex].setAttribute('visible', true);
    }
  }

  hideAREntities(targetIndex) {
    if (this.arEntities[targetIndex]) {
      this.arEntities[targetIndex].setAttribute('visible', false);
    }
  }

  // Called when AR target is found
  onTargetFound(targetIndex) {
    this.visibleTargets.add(targetIndex);
    this.createAREntities(targetIndex);
  }

  // Called when AR target is lost
  onTargetLost(targetIndex) {
    this.visibleTargets.delete(targetIndex);
    this.hideAREntities(targetIndex);
  }
}
