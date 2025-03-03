// Initialize Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { ARExtensions } from './ar-extensions.js';

const supabaseUrl = 'https://fdphjxbjnononpxljrgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGhqeGJqbm9ub25weGxqcmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxOTM1MzMsImV4cCI6MjA1Mjc2OTUzM30.4OAWrb2IOvq0lOOPplBzG-hGYrK5BfP-y9sCR4ac3Vc'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create the AR extensions instance
const arExtensions = new ARExtensions();

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

// Register AR target event components
AFRAME.registerComponent('target-found-handler', {
    init: function() {
        this.el.addEventListener('targetFound', () => {
            const targetIndex = this.el.getAttribute('mindar-image-target').targetIndex;
            console.log(`Target found: ${targetIndex}`);
            arExtensions.onTargetFound(targetIndex);
        });
    }
});

AFRAME.registerComponent('target-lost-handler', {
    init: function() {
        this.el.addEventListener('targetLost', () => {
            const targetIndex = this.el.getAttribute('mindar-image-target').targetIndex;
            console.log(`Target lost: ${targetIndex}`);
            arExtensions.onTargetLost(targetIndex);
        });
    }
});

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
              <a-entity mindar-image-target="targetIndex: ${elm.target_id}" target-found-handler target-lost-handler>
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
              <a-entity mindar-image-target="targetIndex: ${elm.target_id}" target-found-handler target-lost-handler>
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AR extensions first
    await arExtensions.initialize();
    
    // Then fetch animations
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
