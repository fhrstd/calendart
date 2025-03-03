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
      height: 0.5, // Taller text area
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
    
    // Format hadith text with proper spacing
    let hadithText = "";
    if (this.hadithDisplay.dailyHadith) {
      // Add Arabic text with proper spacing
      hadithText += this.hadithDisplay.dailyHadith.text.arab + "\n\n";
      // Add Indonesian text
      hadithText += this.hadithDisplay.dailyHadith.text.id + "\n\n";
      // Add source
      hadithText += "Source: " + this.hadithDisplay.dailyHadith.source;
    } else {
      hadithText = "Loading hadith...";
    }
    
    // Hadith entity with improved positioning and sizing
    const hadithEntity = document.createElement('a-entity');
    hadithEntity.setAttribute('text', {
      value: hadithText,
      align: 'center',
      width: 1.2, // Match calendar width
      color: '#FFFFFF',
      font: 'exo2bold',
      wrapCount: 20, // Fewer characters per line for readability
      baseline: 'top' // Align text from top
    });
    hadithEntity.setAttribute('position', '0 -0.35 0.01'); // Positioned closer to calendar
    hadithEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1,
      height: 0.6 // Taller to fit more text
    });
    hadithEntity.setAttribute('material', {
      color: '#000000',
      opacity: 0.8,
      transparent: true
    });
    hadithEntity.setAttribute('init-text', '');

    // Make sure everything is visible
    calendarEntity.setAttribute('visible', 'true');
    hadithEntity.setAttribute('visible', 'true');

    // Add entities to container
    containerEntity.appendChild(calendarEntity);
    containerEntity.appendChild(hadithEntity);
    
    // Add container to target and ensure it's appended properly
    targetEntity.appendChild(containerEntity);
    console.log("AR Extensions added to target", targetIndex);
    
    // Store reference to container
    this.arEntities[targetIndex] = containerEntity;
    
    // Debug the entity
    setTimeout(() => this.debugAREntities(), 1000);
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
          console.log(`Child ${i} text:`, child.getAttribute('text').value.substring(0, 30) + "...");
          console.log(`Child ${i} text width:`, child.getAttribute('text').width);
          console.log(`Child ${i} text wrapCount:`, child.getAttribute('text').wrapCount);
        }
      });
    });
  }
}
