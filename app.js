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

async function fetchAnimations() {
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
        // Create video asset
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
        
        // Additional color management attributes
        if (isAppleDevice()) {
            // Set color profile properties when supported
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

// New function to fetch hadith data
async function fetchDailyHadith() {
    try {
        const response = await fetch('https://islamic-api-zhirrr.vercel.app/api/quotes');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching hadith:", error);
        return { 
            arabic: "Error loading hadith",
            text: "Please check your connection"
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
        return null;
    }
}

// Function to create and add the UI overlay for hadith and calendar
async function addHadithCalendarOverlay() {
    // Create container for the overlay
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'hadith-calendar-overlay';
    
    // Style the overlay
    Object.assign(overlayContainer.style, {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '300px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        zIndex: '1000',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        transition: 'opacity 0.5s',
        opacity: '0'
    });
    
    // Fetch hadith data
    const hadith = await fetchDailyHadith();
    
    // Fetch Hijri calendar data
    const hijriData = await fetchHijriCalendar();
    
    // Get Gregorian date
    const today = new Date();
    const gregorianDate = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    // Format Hijri date if available
    let hijriDate = "Loading Hijri date...";
    if (hijriData) {
        hijriDate = `${hijriData.hijri.day} ${hijriData.hijri.month.en} ${hijriData.hijri.year} H`;
    }
    
    // Create content for the overlay
    overlayContainer.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="font-size: 16px; font-weight: bold; color: #1e88e5; margin-bottom: 5px;">Daily Hadith</div>
            <div style="font-size: 14px; line-height: 1.4; margin-bottom: 8px;">${hadith.text || "Loading hadith..."}</div>
            <div style="font-size: 12px; font-style: italic; text-align: right;">H.R. ${hadith.author || "..."}</div>
        </div>
        <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
            <div style="font-size: 16px; font-weight: bold; color: #1e88e5; margin-bottom: 5px;">Calendar</div>
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-size: 14px; font-weight: bold;">Hijri</div>
                    <div style="font-size: 12px;">${hijriDate}</div>
                </div>
                <div>
                    <div style="font-size: 14px; font-weight: bold;">Gregorian</div>
                    <div style="font-size: 12px;">${gregorianDate}</div>
                </div>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(overlayContainer);
    
    // Fade in the overlay
    setTimeout(() => {
        overlayContainer.style.opacity = '1';
    }, 500);
    
    // Add a button to toggle the display
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '≡';
    Object.assign(toggleButton.style, {
        position: 'absolute',
        bottom: '20px',
        left: '10px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#1e88e5',
        color: 'white',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: '1001',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    });
    
    // Hide the overlay initially
    overlayContainer.style.transform = 'translateX(-320px)';
    let isVisible = false;
    
    // Toggle visibility when button is clicked
    toggleButton.addEventListener('click', () => {
        if (isVisible) {
            overlayContainer.style.transform = 'translateX(-320px)';
        } else {
            overlayContainer.style.transform = 'translateX(0)';
        }
        isVisible = !isVisible;
    });
    
    document.body.appendChild(toggleButton);
    
    // Update hadith and calendar daily
    setInterval(async () => {
        const newHadith = await fetchDailyHadith();
        const newHijriData = await fetchHijriCalendar();
        
        // Update hadith text
        const hadithTextElement = overlayContainer.querySelector('div > div:nth-child(2)');
        hadithTextElement.textContent = newHadith.text || "Error loading hadith";
        
        // Update hadith author
        const hadithAuthorElement = overlayContainer.querySelector('div > div:nth-child(3)');
        hadithAuthorElement.textContent = `H.R. ${newHadith.author || "..."}`;
        
        // Update Hijri date
        const hijriDateElement = overlayContainer.querySelector('div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)');
        if (newHijriData) {
            hijriDateElement.textContent = `${newHijriData.hijri.day} ${newHijriData.hijri.month.en} ${newHijriData.hijri.year} H`;
        }
    }, 24 * 60 * 60 * 1000); // Update every 24 hours
}

// Initialize the overlay when the AR scene is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('arReady', () => {
        console.log("AR is ready, adding hadith and calendar overlay");
        addHadithCalendarOverlay();
    });
});

// Modify the original fetchAnimations function to position AR elements to make room for the overlay
const originalFetchAnimations = fetchAnimations;
fetchAnimations = async function() {
    await originalFetchAnimations();
    
    // Adjust position of AR entities to leave space for the hadith and calendar
    const entityContainer = document.querySelector('#entity-container');
    const entities = entityContainer.querySelectorAll('a-entity');
    
    entities.forEach(entity => {
        // Adjust position slightly to the right
        const targetEntity = entity.querySelector('[mindar-image-target]');
        if (targetEntity) {
            const videoElement = targetEntity.querySelector('a-video, a-plane');
            if (videoElement) {
                // Get current position
                const currentPosition = videoElement.getAttribute('position');
                // Shift position to the right a bit
                videoElement.setAttribute('position', `${currentPosition.x + 0.2} ${currentPosition.y} ${currentPosition.z}`);
            }
        }
    });
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimations();
    setupVideoPlayback();
    fetchDailyHadith();
    fetchHijriCalendar();
    
    // Add listener for AR events for debugging
    const scene = document.querySelector('a-scene');
    scene.addEventListener('arReady', () => {
        console.log("MindAR is ready");
    });
    
    scene.addEventListener('arError', (event) => {
        console.error("MindAR error:", event);
    });
});
