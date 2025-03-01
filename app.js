// Initialize Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabaseUrl = 'https://fdphjxbjnononpxljrgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGhqeGJqbm9ub25weGxqcmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxOTM1MzMsImV4cCI6MjA1Mjc2OTUzM30.4OAWrb2IOvq0lOOPplBzG-hGYrK5BfP-y9sCR4ac3Vc'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Detect devices
function isAppleDevice() {
    return /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Register the custom shader component for iOS alpha videos
if (!AFRAME.components['ios-alpha-video']) {
    AFRAME.registerComponent('ios-alpha-video', {
        schema: {
            src: {type: 'string'}
        },
        
        init: function() {
            const el = this.el;
            const data = this.data;
            
            // Create video element
            const video = document.querySelector(data.src);
            if (!video) {
                console.error('Video element not found:', data.src);
                return;
            }
            
            // Create a new canvas element with proper color settings
            const canvas = document.createElement('canvas');
            canvas.width = 1024;  // Set appropriate size
            canvas.height = 1024;
            const ctx = canvas.getContext('2d', {
                alpha: true,
                colorSpace: 'display-p3',  // Use wide color gamut if available
                willReadFrequently: true
            });
            
            // Apply color correction settings to context
            if (ctx.filter !== undefined) {
                // Use slight color enhancement if filters are supported
                ctx.filter = 'saturate(1.05) contrast(1.02)';
            }
            
            // Create a dynamic texture from the canvas with improved settings
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.encoding = THREE.sRGBEncoding; // Ensure proper color encoding
            texture.format = THREE.RGBAFormat;
            texture.premultiplyAlpha = false; // Prevent alpha multiplication issues
            
            // Create material with transparency and proper blending
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.01,
                blending: THREE.CustomBlending,
                blendSrc: THREE.SrcAlphaFactor,
                blendDst: THREE.OneMinusSrcAlphaFactor
            });
            
            // Apply material to the entity
            el.getObject3D('mesh').material = material;
            
            // Update canvas with video frames
            this.video = video;
            this.canvas = canvas;
            this.ctx = ctx;
            this.texture = texture;
            
            // Force play the video on user interaction
            document.addEventListener('click', () => {
                video.play().catch(e => console.error("Video play error:", e));
            }, { once: true });
        },
        
        tick: function() {
            if (!this.video || this.video.paused || this.video.ended) return;
            
            // Draw video frame to canvas with improved color handling
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Use proper rendering technique
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Update texture
            this.texture.needsUpdate = true;
        }
    });
}

// Extension to app.js - Add hadith and calendar display

// New function to fetch hadith data from a working API
async function fetchDailyHadith() {
    try {
        // Using a more reliable hadith API
        const response = await fetch('https://api.hadith.sutanlab.id/books/muslim?range=1-300');
        const data = await response.json();
        
        // Get a random hadith from the collection
        const randomIndex = Math.floor(Math.random() * data.data.hadiths.length);
        const hadith = data.data.hadiths[randomIndex];
        
        return {
            text: hadith.id ? hadith.arab : "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم",
            translation: hadith.id ? hadith.translation : "In the name of Allah, the Most Gracious, the Most Merciful",
            author: "Muslim"
        };
    } catch (error) {
        console.error("Error fetching hadith:", error);
        
        // Fallback hadith in case API fails
        return { 
            text: "الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ",
            translation: "The one who guides to goodness is like the one who does it",
            author: "Muslim"
        };
    }
}

// Function to fetch Hijri calendar data
async function fetchHijriCalendar() {
    try {
        // Using aladhan.com API which is reliable for Hijri dates
        const response = await fetch('https://api.aladhan.com/v1/gToH');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching Hijri calendar:", error);
        
        // Create fallback date in case API fails
        const today = new Date();
        return {
            hijri: {
                day: today.getDate(),
                month: { en: "Fallback" },
                year: today.getFullYear()
            }
        };
    }
}

// Create and attach hadith and calendar to AR animation
function createHadithCalendarForTarget(targetEntity, hadithData, hijriData) {
    // Get Gregorian date
    const today = new Date();
    const gregorianDate = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    // Format Hijri date
    const hijriDate = hijriData ? 
        `${hijriData.hijri.day} ${hijriData.hijri.month.en} ${hijriData.hijri.year} H` : 
        "Loading Hijri date...";
    
    // Create text entity for hadith and calendar
    const infoPanel = document.createElement('a-entity');
    
    // Position below the animation
    infoPanel.setAttribute('position', '0 -0.8 0');
    
    // Create a background plane for better readability
    const background = document.createElement('a-plane');
    background.setAttribute('width', '1');
    background.setAttribute('height', '0.5');
    background.setAttribute('color', '#FFFFFF');
    background.setAttribute('opacity', '0.85');
    background.setAttribute('position', '0 0 -0.01');
    infoPanel.appendChild(background);
    
    // Create the text entities
    const hadithText = document.createElement('a-text');
    hadithText.setAttribute('value', hadithData.translation || "Loading hadith...");
    hadithText.setAttribute('width', '0.9');
    hadithText.setAttribute('wrap-count', '30');
    hadithText.setAttribute('color', '#333333');
    hadithText.setAttribute('position', '0 0.1 0');
    hadithText.setAttribute('align', 'center');
    hadithText.setAttribute('font', 'https://cdn.aframe.io/fonts/Exo2Bold.fnt');
    hadithText.setAttribute('scale', '0.5 0.5 0.5');
    infoPanel.appendChild(hadithText);
    
    // Add author
    const authorText = document.createElement('a-text');
    authorText.setAttribute('value', `H.R. ${hadithData.author || "..."}`);
    authorText.setAttribute('color', '#1e88e5');
    authorText.setAttribute('position', '0.3 -0.05 0');
    authorText.setAttribute('align', 'right');
    authorText.setAttribute('scale', '0.4 0.4 0.4');
    infoPanel.appendChild(authorText);
    
    // Add calendar divider
    const divider = document.createElement('a-plane');
    divider.setAttribute('width', '0.9');
    divider.setAttribute('height', '0.005');
    divider.setAttribute('color', '#DDDDDD');
    divider.setAttribute('position', '0 -0.1 0');
    infoPanel.appendChild(divider);
    
    // Add Hijri calendar
    const hijriText = document.createElement('a-text');
    hijriText.setAttribute('value', `Hijri: ${hijriDate}`);
    hijriText.setAttribute('color', '#333333');
    hijriText.setAttribute('position', '-0.4 -0.15 0');
    hijriText.setAttribute('align', 'left');
    hijriText.setAttribute('scale', '0.3 0.3 0.3');
    infoPanel.appendChild(hijriText);
    
    // Add Gregorian calendar
    const gregorianText = document.createElement('a-text');
    gregorianText.setAttribute('value', `Gregorian: ${gregorianDate}`);
    gregorianText.setAttribute('color', '#333333');
    gregorianText.setAttribute('position', '0.4 -0.15 0');
    gregorianText.setAttribute('align', 'right');
    gregorianText.setAttribute('scale', '0.3 0.3 0.3');
    infoPanel.appendChild(gregorianText);
    
    // Attach to target entity
    targetEntity.appendChild(infoPanel);
    
    return infoPanel;
}

// Modified fetchAnimations function to include hadith and calendar with each AR target
async function enhancedFetchAnimations() {
    // Fetch hadith and calendar data first
    const [hadithData, hijriData] = await Promise.all([
        fetchDailyHadith(),
        fetchHijriCalendar()
    ]);
    
    console.log("Fetched hadith and calendar data:", { hadithData, hijriData });
    
    // Now fetch animations
    const { data: animations, error } = await supabase
        .from('animations')
        .select('target_id, video_url, video_url_mov, name');

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    const assetsContainer = document.querySelector('#assets-container');
    const entityContainer = document.querySelector('#entity-container');
    
    // For iOS workaround, we need to keep track of video loading
    const videoPromises = [];

    animations.forEach(item => {
        // Create video asset (unchanged from original)
        const videoAsset = document.createElement('video');
        const videoId = item.name;
        videoAsset.setAttribute('id', videoId);
        
        // Use the correct video source based on device
        const videoSrc = isAppleDevice() ? item.video_url_mov : item.video_url;
        videoAsset.setAttribute('src', videoSrc);
        videoAsset.setAttribute('type', isAppleDevice() ? "video/mp4;codecs=hvc1" : "video/webm");
        
        // Set video attributes for proper playback
        videoAsset.setAttribute('loop', 'true');
        videoAsset.setAttribute('autoplay', 'true');
        videoAsset.setAttribute('muted', 'true');
        videoAsset.setAttribute('playsinline', 'true');
        videoAsset.setAttribute('webkit-playsinline', 'true');
        videoAsset.setAttribute('crossorigin', 'anonymous');
        
        // Additional color management attributes for iOS
        if (isAppleDevice()) {
            if ('colorSpaceUtilities' in window) {
                videoAsset.setAttribute('colorspace', 'display-p3');
            }
        }
        
        videoAsset.style.backgroundColor = 'transparent';
        
        // Wait for video metadata to load
        const videoLoaded = new Promise((resolve) => {
            videoAsset.addEventListener('loadedmetadata', () => {
                console.log(`Video ${videoId} metadata loaded (${videoAsset.videoWidth}x${videoAsset.videoHeight})`);
                resolve();
            });
            
            // Add fallback for video load failure
            videoAsset.addEventListener('error', (e) => {
                console.error(`Error loading video ${videoId}:`, e);
                resolve(); // Resolve anyway to prevent blocking
            });
        });
        
        videoPromises.push(videoLoaded);
        assetsContainer.appendChild(videoAsset);
    });

    // Wait for all videos to be ready before creating entities
    await Promise.all(videoPromises);
    console.log("All videos loaded");

    animations.forEach((elm) => {
        const target = document.createElement('a-entity');
        let targetEntity;
        
        if (isAppleDevice()) {
            // For iOS devices, use our custom canvas-based approach
            target.innerHTML = `
              <a-entity mindar-image-target="targetIndex: ${elm.target_id}">
                <a-plane
                  width="1" 
                  height="1.4"
                  position="0 0 0"
                  ios-alpha-video="src: #${elm.name}"
                ></a-plane>
              </a-entity>
            `;
            targetEntity = target.querySelector('[mindar-image-target]');
        } else {
            // For non-iOS, use the transparent video shader
            target.innerHTML = `
              <a-entity mindar-image-target="targetIndex: ${elm.target_id}">
                <a-video
                  material="shader: transparent-video; src: #${elm.name}"
                  width="1" 
                  height="1.4"
                  position="0 0 0"
                  autoplay
                  loop
                  muted
                  transparent="true"
                  crossorigin="anonymous"
                  playsinline
                ></a-video>
              </a-entity>
            `;
            targetEntity = target.querySelector('[mindar-image-target]');
        }
        
        // Add the target to the container
        entityContainer.appendChild(target);
        
        // Attach hadith and calendar to the AR entity
        if (targetEntity) {
            createHadithCalendarForTarget(targetEntity, hadithData, hijriData);
        }
    });

    console.log("Entities with hadith and calendar added");
    
    // Force play all videos
    document.querySelectorAll('video').forEach(video => {
        video.play().catch(e => console.error("Video play error:", e));
    });
}

// Replace the original fetchAnimations function
const originalFetchAnimations = fetchAnimations;
fetchAnimations = enhancedFetchAnimations;

// Keep the original video playback setup (no changes needed here)
// This will use your existing setupVideoPlayback function
