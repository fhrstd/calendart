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

// import another modules
import { fetchHijriCalendar, displayHijriCalendar } from './hijriCalendar.js';
import { getGregorianDate, displayGregorianCalendar } from './gregorianCalendar.js';
import { fetchDailyHadith, displayDailyHadith } from './dailyHadith.js';

async function fetchAnimations() {

    // Wait for all videos to be ready before creating entities
    await Promise.all(videoPromises);
    console.log("All videos loaded");

    // Fetch and display Hijri and Gregorian dates
    const hijriDate = await fetchHijriCalendar();
    const gregorianDate = getGregorianDate();
    const hadith = await fetchDailyHadith();

    const hijriElement = displayHijriCalendar(hijriDate);
    const gregorianElement = displayGregorianCalendar(gregorianDate);
    const hadithElement = displayDailyHadith(hadith);

    animations.forEach((elm) => {
        const target = document.createElement('a-entity');
        
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
        }

        // Append calendar and Hadith below the video
        target.appendChild(hijriElement);
        target.appendChild(gregorianElement);
        target.appendChild(hadithElement);

        entityContainer.appendChild(target);
    });

    console.log("Entities added:", entityContainer.innerHTML);
    
    // Force play all videos
    document.querySelectorAll('video').forEach(video => {
        video.play().catch(e => console.error("Video play error:", e));
    });
}

// Add a listener to force video playback when user interacts
function setupVideoPlayback() {
    const playVideos = () => {
        document.querySelectorAll('video').forEach(video => {
            if (video.paused) {
                video.play().catch(e => console.error("Couldn't play video:", e));
            }
        });
    };
    
    // Handle both touch and click events
    document.addEventListener('click', playVideos);
    document.addEventListener('touchstart', playVideos);
    
    // Also attempt to play videos when AR is ready
    const scene = document.querySelector('a-scene');
    scene.addEventListener('arReady', playVideos);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimations();
    setupVideoPlayback();
    
    // Add listener for AR events for debugging
    const scene = document.querySelector('a-scene');
    scene.addEventListener('arReady', () => {
        console.log("MindAR is ready");
    });
    
    scene.addEventListener('arError', (event) => {
        console.error("MindAR error:", event);
    });
});
