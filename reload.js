// reload.js
if (!sessionStorage.getItem('reloaded')) {
    sessionStorage.setItem('reloaded', 'true');
    
    // Wait for DOMContentLoaded first
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, waiting for full initialization...");
        
        // Create a promise that resolves when the scene is ready
        const sceneReady = new Promise((resolve) => {
            const scene = document.querySelector('a-scene');
            if (scene) {
                if (scene.hasLoaded) {
                    console.log("Scene already loaded");
                    resolve();
                } else {
                    scene.addEventListener('loaded', () => {
                        console.log("Scene loaded event fired");
                        resolve();
                    });
                }
            } else {
                // If no scene is found, resolve after a timeout
                setTimeout(resolve, 2000);
            }
        });
        
        // Wait for MindAR to initialize
        const arReady = new Promise((resolve) => {
            const checkMindAR = () => {
                const scene = document.querySelector('a-scene');
                if (scene && scene.components && scene.components['mindar-image']) {
                    console.log("MindAR component found");
                    resolve();
                } else {
                    setTimeout(checkMindAR, 500);
                }
            };
            checkMindAR();
            
            // Fallback if MindAR never initializes
            setTimeout(resolve, 3000);
        });
        
        // Wait for both scene and AR to be ready, then reload
        Promise.all([sceneReady, arReady])
            .then(() => {
                console.log("All components initialized, reloading page...");
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            })
            .catch(() => {
                // If there's an error, reload anyway after 5 seconds
                console.log("Error during initialization, forcing reload");
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            });
    });
}
