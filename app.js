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
// Replace your current ios-alpha-video component registration with this version
if (!AFRAME.components['ios-alpha-video']) {
    AFRAME.registerComponent('ios-alpha-video', {
        schema: {
            src: {type: 'string'}
        },
        
        init: function() {
            const el = this.el;
            const data = this.data;
            
            // Create video element with better error handling
            this.initializeVideo = () => {
                try {
                    // Create video element - handle selector or direct URL
                    let video;
                    if (data.src.startsWith('#')) {
                        video = document.querySelector(data.src);
                        if (!video) {
                            console.error('Video element not found:', data.src);
                            // Create a fallback
                            video = document.createElement('video');
                            video.setAttribute('muted', 'true');
                            video.setAttribute('playsinline', 'true');
                            video.setAttribute('loop', 'true');
                        }
                    } else {
                        // Direct URL
                        video = document.createElement('video');
                        video.src = data.src;
                        video.setAttribute('muted', 'true');
                        video.setAttribute('playsinline', 'true');
                        video.setAttribute('loop', 'true');
                    }
                    
                    // Create a new canvas element with proper color settings
                    const canvas = document.createElement('canvas');
                    canvas.width = 1024;  // Set appropriate size
                    canvas.height = 1024;
                    
                    // Use try-catch for context creation which might fail
                    let ctx;
                    try {
                        ctx = canvas.getContext('2d', {
                            alpha: true,
                            colorSpace: 'display-p3',  // Use wide color gamut if available
                            willReadFrequently: true
                        });
                    } catch (e) {
                        console.warn('Advanced canvas context failed, using standard context', e);
                        ctx = canvas.getContext('2d', { alpha: true });
                    }
                    
                    if (!ctx) {
                        console.error('Could not create canvas context');
                        return;
                    }
                    
                    // Apply color correction settings to context
                    if (ctx.filter !== undefined) {
                        // Use slight color enhancement if filters are supported
                        ctx.filter = 'saturate(1.05) contrast(1.02)';
                    }
                    
                    // Create a dynamic texture from the canvas with improved settings
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    
                    // Check if encoding is supported
                    if (THREE.sRGBEncoding !== undefined) {
                        texture.encoding = THREE.sRGBEncoding; // Ensure proper color encoding
                    }
                    
                    texture.format = THREE.RGBAFormat;
                    texture.premultiplyAlpha = false; // Prevent alpha multiplication issues
                    
                    // Create material with transparency and proper blending
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        alphaTest: 0.01,
                    });
                    
                    // Use custom blending if available
                    if (THREE.CustomBlending !== undefined) {
                        material.blending = THREE.CustomBlending;
                        material.blendSrc = THREE.SrcAlphaFactor;
                        material.blendDst = THREE.OneMinusSrcAlphaFactor;
                    }
                    
                    // Apply material to the entity - with error handling
                    const mesh = el.getObject3D('mesh');
                    if (mesh) {
                        mesh.material = material;
                    } else {
                        console.warn('No mesh found when applying material');
                        // Create a fallback mesh if needed
                        setTimeout(() => {
                            const newMesh = el.getObject3D('mesh');
                            if (newMesh) {
                                newMesh.material = material;
                            }
                        }, 100);
                    }
                    
                    // Store references
                    this.video = video;
                    this.canvas = canvas;
                    this.ctx = ctx;
                    this.texture = texture;
                    
                    // Force play the video on user interaction
                    this.setupVideoPlay();
                } catch (e) {
                    console.error('Error in ios-alpha-video init:', e);
                }
            };
            
            // Separate function to handle video playback setup
            this.setupVideoPlay = () => {
                if (!this.video) return;
                
                const playVideo = () => {
                    if (this.video && this.video.paused) {
                        this.video.play().catch(e => console.error("Video play error:", e));
                    }
                };
                
                document.addEventListener('click', playVideo, { once: true });
                document.addEventListener('touchstart', playVideo, { once: true });
            };
            
            // Initialize with slight delay to ensure element is properly set up
            setTimeout(this.initializeVideo, 10);
        },
        
        update: function() {
            // Handle updates if the src changes
            this.initializeVideo();
        },
        
        tick: function() {
            if (!this.video || !this.ctx || !this.canvas || !this.texture) return;
            if (this.video.paused || this.video.ended) return;
            
            try {
                // Draw video frame to canvas with improved color handling
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Use proper rendering technique
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Update texture
                this.texture.needsUpdate = true;
            } catch (e) {
                console.warn('Error in ios-alpha-video tick:', e);
            }
        },
        
        remove: function() {
            // Clean up resources when component is removed
            if (this.video) {
                this.video.pause();
                this.video.src = '';
                this.video.load();
            }
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

// Add this to app.js, replacing your DOMContentLoaded event handler

document.addEventListener('DOMContentLoaded', async () => {
    // Create a promise to track when MindAR is ready
    let arReadyResolve;
    const arReadyPromise = new Promise(resolve => {
        arReadyResolve = resolve;
    });
    
    // Get scene reference
    const scene = document.querySelector('a-scene');
    
    // Set up MindAR ready listener first, before anything else
    scene.addEventListener('arReady', () => {
        console.log("MindAR is ready");
        // Resolve the promise
        arReadyResolve();
    });
    
    scene.addEventListener('arError', (event) => {
        console.error("MindAR error:", event);
    });
    
    // Initialize AR extensions
    await arExtensions.initialize();
    
    // Setup video playback triggers
    setupVideoPlayback();
    
    // Wait for either arReady event or a timeout
    const timeout = new Promise(resolve => setTimeout(resolve, 5000)); // 5 second timeout
    
    try {
        // Wait for AR to be ready or timeout
        await Promise.race([arReadyPromise, timeout]);
        
        // Add a small delay to ensure Three.js is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now it's safer to fetch animations and create entities
        await fetchAnimations();
        
        // Force a scene update if needed
        if (scene.renderer) {
            scene.object3D.updateMatrixWorld(true);
            scene.renderer.render(scene.object3D, scene.camera);
        }
    } catch (err) {
        console.error("Error during AR initialization:", err);
    }
    
    // Add error handler for Three.js matrix issues
    const originalMatrixInverse = THREE.Matrix3.prototype.invert || THREE.Matrix3.prototype.getInverse;
    THREE.Matrix3.prototype.invert = function(target) {
        try {
            return originalMatrixInverse.call(this, target);
        } catch (e) {
            console.warn("Matrix inversion failed, using identity matrix as fallback");
            if (target) {
                target.identity();
                return target;
            }
            return new THREE.Matrix3();
        }
    };
});

// Modify your fetchAnimations function to handle errors better
async function fetchAnimations() {
    try {
        const { data: animations, error } = await supabase
            .from('animations')
            .select('target_id, video_url, video_url_mov, name');

        if (error) {
            console.error("Error fetching data:", error);
            return;
        }
        
        if (!animations || animations.length === 0) {
            console.warn("No animations found in database");
            return;
        }

        const assetsContainer = document.querySelector('#assets-container');
        if (!assetsContainer) {
            console.error("Assets container not found");
            return;
        }
        
        const entityContainer = document.querySelector('#entity-container');
        if (!entityContainer) {
            console.error("Entity container not found");
            return;
        }
        
        // For iOS workaround, we need to keep track of video loading
        const videoPromises = [];

        animations.forEach(item => {
            // Check if the item has all required properties
            if (!item.name) {
                console.warn("Animation missing required property: name", item);
                return;
            }
            
            // Create video asset
            const videoAsset = document.createElement('video');
            const videoId = item.name;
            videoAsset.setAttribute('id', videoId);
            
            // Use the correct video source based on device
            const videoSrc = isAppleDevice() ? item.video_url_mov : item.video_url;
            if (!videoSrc) {
                console.warn(`Missing video URL for ${videoId}`);
                return;
            }
            
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
                
                // Add timeout in case the event never fires
                setTimeout(resolve, 5000);
            });
            
            videoPromises.push(videoLoaded);
            assetsContainer.appendChild(videoAsset);
        });

        // Wait for all videos to be ready before creating entities
        await Promise.all(videoPromises);
        console.log("All videos loaded");

        animations.forEach((elm) => {
            if (!elm || elm.target_id === undefined || !elm.name) {
                console.warn("Invalid animation data:", elm);
                return;
            }
            
            try {
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
            } catch (err) {
                console.error("Error creating entity for animation:", elm, err);
            }
        });

        console.log("Entities added:", entityContainer.innerHTML);
        
        // Force play all videos
        document.querySelectorAll('video').forEach(video => {
            video.play().catch(e => console.error("Video play error:", e));
        });
    } catch (err) {
        console.error("Critical error in fetchAnimations:", err);
    }
}
