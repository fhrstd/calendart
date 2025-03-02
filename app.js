// Updated app.js - Fetch animations only after arReady to avoid race conditions
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { ARExtensions } from './ar-extensions.js';

const supabaseUrl = 'https://fdphjxbjnononpxljrgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGhqeGJqbm9ub25weGxqcmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxOTM1MzMsImV4cCI6MjA1Mjc2OTUzM30.4OAWrb2IOvq0lOOPplBzG-hGYrK5BfP-y9sCR4ac3Vc'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const arExtensions = new ARExtensions();

function isAppleDevice() {
    return /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');

    scene.addEventListener('arReady', async () => {
        await arExtensions.initialize();
        await fetchAnimations();  // Fetch and add animations only after arReady
    }, { once: true });

    setupVideoPlayback();

    scene.addEventListener('arError', (event) => {
        console.error("MindAR error:", event);
    });
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

    const videoPromises = [];

    animations.forEach(item => {
        const videoAsset = document.createElement('video');
        const videoId = item.name;
        videoAsset.setAttribute('id', videoId);
        const videoSrc = isAppleDevice() ? item.video_url_mov : item.video_url;
        videoAsset.setAttribute('src', videoSrc);
        videoAsset.setAttribute('type', isAppleDevice() ? "video/mp4;codecs=hvc1" : "video/webm");
        videoAsset.setAttribute('loop', 'true');
        videoAsset.setAttribute('autoplay', 'true');
        videoAsset.setAttribute('muted', 'true');
        videoAsset.setAttribute('playsinline', 'true');
        videoAsset.setAttribute('webkit-playsinline', 'true');
        videoAsset.setAttribute('crossorigin', 'anonymous');
        videoPromises.push(new Promise((resolve) => {
            videoAsset.addEventListener('loadedmetadata', resolve);
            videoAsset.addEventListener('error', resolve);
        }));
        assetsContainer.appendChild(videoAsset);
    });

    await Promise.all(videoPromises);

    animations.forEach((elm) => {
        const target = document.createElement('a-entity');
        if (isAppleDevice()) {
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

    console.log("All animations injected after AR ready");
}

function setupVideoPlayback() {
    const playVideos = () => {
        document.querySelectorAll('video').forEach(video => {
            if (video.paused) video.play().catch(e => console.error("Couldn't play video:", e));
        });
    };
    document.addEventListener('click', playVideos);
    document.addEventListener('touchstart', playVideos);
}
