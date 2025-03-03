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
    
    // Create container entity for all extensions - Positioned below the marker
    const containerEntity = document.createElement('a-entity');
    containerEntity.setAttribute('position', '0 -0.9 0'); 
    containerEntity.setAttribute('scale', '0.8 0.8 0.8'); // Scale down to fit better
    containerEntity.setAttribute('visible', 'true');
    
    // Get formatted calendar content
    const calendarContent = this.calendarDisplay.getFormattedHijriDate() + 
                           "\n" + this.calendarDisplay.getFormattedGregorianDate();
    
    // Calendar entity with improved visibility
    const calendarEntity = document.createElement('a-entity');
    calendarEntity.setAttribute('text', {
      value: calendarContent,
      align: 'center',
      width: 1.2, // Wider text area
      color: '#FFFFFF', // Bright white for visibility
      font: 'exo2bold',
      wrapCount: 20, // Fewer characters per line for better readability
      baseline: 'top' // Align text from top
    });
    calendarEntity.setAttribute('position', '0 0 0.01');
    calendarEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1,
      height: 0.25
    });
    calendarEntity.setAttribute('material', {
      color: '#000000',
      opacity: 0.8,
      transparent: true
    });
    calendarEntity.setAttribute('init-text', '');
    
    // Create separate entities for Arabic and Indonesian text
    // This helps ensure proper rendering of Arabic text
    const arabicTextEntity = document.createElement('a-entity');
    const idTextEntity = document.createElement('a-entity');
    const sourceTextEntity = document.createElement('a-entity');
    
    // Arabic hadith text
    let arabicText = "";
    if (this.hadithDisplay.dailyHadith && this.hadithDisplay.dailyHadith.text.arab) {
      arabicText = this.hadithDisplay.dailyHadith.text.arab;
    } else {
      arabicText = "جاري تحميل الحديث..."; // "Loading hadith..." in Arabic
    }
    
    // Indonesian hadith text
    let idText = "";
    if (this.hadithDisplay.dailyHadith && this.hadithDisplay.dailyHadith.text.id) {
      idText = this.hadithDisplay.dailyHadith.text.id;
    } else {
      idText = "Loading hadith...";
    }
    
    // Source text
    let sourceText = "";
    if (this.hadithDisplay.dailyHadith && this.hadithDisplay.dailyHadith.source) {
      sourceText = "Source: " + this.hadithDisplay.dailyHadith.source;
    }
    
    // Configure Arabic text entity with right-to-left support
    arabicTextEntity.setAttribute('text', {
      value: arabicText,
      align: 'right', // Right alignment for Arabic
      width: 1.2,
      color: '#FFFFFF',
      font: 'exo2bold', // A-Frame has limited font options
      wrapCount: 15, // Fewer characters per line for Arabic
      baseline: 'top',
      direction: 'rtl' // Right-to-left direction for Arabic
    });
    arabicTextEntity.setAttribute('position', '0 -0.35 0.01');
    arabicTextEntity.setAttribute('init-text', '');
    
    // Configure Indonesian text entity
    idTextEntity.setAttribute('text', {
      value: idText,
      align: 'center',
      width: 1.2,
      color: '#FFFFFF',
      font: 'exo2bold',
      wrapCount: 20,
      baseline: 'top'
    });
    idTextEntity.setAttribute('position', '0 -0.55 0.01'); // Position below Arabic text
    idTextEntity.setAttribute('init-text', '');
    
    // Configure source text entity
    sourceTextEntity.setAttribute('text', {
      value: sourceText,
      align: 'center',
      width: 1.2,
      color: '#CCCCCC', // Slightly dimmer color for source
      font: 'exo2bold',
      wrapCount: 25,
      baseline: 'top'
    });
    sourceTextEntity.setAttribute('position', '0 -0.75 0.01'); // Position below Indonesian text
    sourceTextEntity.setAttribute('init-text', '');
    
    // Create background plane for hadith text
    const hadithBackgroundEntity = document.createElement('a-entity');
    hadithBackgroundEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1,
      height: 0.6 // Tall enough to fit all text
    });
    hadithBackgroundEntity.setAttribute('material', {
      color: '#000000',
      opacity: 0.8,
      transparent: true
    });
    hadithBackgroundEntity.setAttribute('position', '0 -0.55 0'); // Position to cover all text entities
    
    // Make sure everything is visible
    calendarEntity.setAttribute('visible', 'true');
    arabicTextEntity.setAttribute('visible', 'true');
    idTextEntity.setAttribute('visible', 'true');
    sourceTextEntity.setAttribute('visible', 'true');
    hadithBackgroundEntity.setAttribute('visible', 'true');

    // Add entities to container
    containerEntity.appendChild(calendarEntity);
    containerEntity.appendChild(hadithBackgroundEntity);
    containerEntity.appendChild(arabicTextEntity);
    containerEntity.appendChild(idTextEntity);
    containerEntity.appendChild(sourceTextEntity);
    
    // Add container to target and ensure it's appended properly
    targetEntity.appendChild(containerEntity);
    console.log("AR Extensions added to target", targetIndex);
    
    // Store reference to container
    this.arEntities[targetIndex] = containerEntity;
    
    // Debug the entity
    setTimeout(() => this.debugAREntities(), 1000);
    
    // Log Arabic text for debugging
    console.log("Arabic text being displayed:", arabicText);
  }

  showAREntities(targetIndex) {
    if (this.arEntities[targetIndex]) {
      this.arEntities[targetIndex].setAttribute('visible', true);
      console.log(`AR Extensions for target ${targetIndex} are now visible`);
    }
  }

  hideAREntities(targetIndex) {
    if (this.arEntities[targetIndex]) {
      this.arEntities[targetIndex].setAttribute('visible', false);
      console.log(`AR Extensions for target ${targetIndex} are now hidden`);
    }
  }

  // Called when AR target is found
  onTargetFound(targetIndex) {
    console.log(`Target found: ${targetIndex}, creating AR extensions`);
    this.visibleTargets.add(targetIndex);
    this.createAREntities(targetIndex);
  }

  // Called when AR target is lost
  onTargetLost(targetIndex) {
    console.log(`Target lost: ${targetIndex}, hiding AR extensions`);
    this.visibleTargets.delete(targetIndex);
    this.hideAREntities(targetIndex);
  }

  // Debug function to help troubleshoot visibility issues
  debugAREntities() {
    console.log("Active AR entities:", Object.keys(this.arEntities));
    console.log("Visible targets:", Array.from(this.visibleTargets));
    
    // Check if entities exist in the DOM
    Object.keys(this.arEntities).forEach(index => {
      const entity = this.arEntities[index];
      console.log(`Entity ${index} visible:`, entity.getAttribute('visible'));
      console.log(`Entity ${index} position:`, entity.getAttribute('position'));
      console.log(`Entity ${index} scale:`, entity.getAttribute('scale'));
      
      // Log children
      const children = entity.children;
      console.log(`Entity ${index} has ${children.length} children`);
      
      // Log child details
      Array.from(children).forEach((child, i) => {
        console.log(`Child ${i} type:`, child.tagName);
        console.log(`Child ${i} visible:`, child.getAttribute('visible'));
        console.log(`Child ${i} position:`, child.getAttribute('position'));
        
        // For text entities, log text attributes
        if (child.getAttribute('text')) {
          const textAttr = child.getAttribute('text');
          console.log(`Child ${i} text:`, textAttr.value?.substring(0, 30) + "...");
          console.log(`Child ${i} text align:`, textAttr.align);
          console.log(`Child ${i} text direction:`, textAttr.direction);
        }
      });
    });
  }
}
