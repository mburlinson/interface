/**
 * VideoScreenSystem.js - Manages streaming video screens in the 3D world
 * Proximity-triggered video playback on mesh surfaces
 */

class VideoScreenSystem {
    constructor(scene) {
        this.scene = scene;
        this.screens = [];
        this.playerPosition = new THREE.Vector3();
        this.userInteracted = false;

        // Enable videos on first user interaction
        this.setupUserInteractionListener();

        console.log('VideoScreenSystem initialized');
    }

    /**
     * Setup listener for user interaction to enable videos
     */
    setupUserInteractionListener() {
        const enableVideos = () => {
            if (this.userInteracted) return;

            console.log('User interaction detected - enabling videos');
            this.userInteracted = true;

            // Try to play all videos
            this.screens.forEach(screen => {
                if (!screen.isPlaying) {
                    this.playVideo(screen);
                }
            });

            // Remove listeners after first interaction
            document.removeEventListener('click', enableVideos);
            document.removeEventListener('keydown', enableVideos);
        };

        document.addEventListener('click', enableVideos);
        document.addEventListener('keydown', enableVideos);
    }

    /**
     * Create video screens from config
     */
    createScreensFromConfig() {
        Config.videoScreens.forEach(screenData => {
            this.createScreen(screenData);
        });
    }

    /**
     * Create a single video screen
     */
    createScreen(data) {
        console.log('Creating video screen:', data.id, 'at position:', data.position);

        // Create HTML5 video element
        const video = document.createElement('video');
        video.id = data.id;
        video.src = data.videoUrl;
        video.loop = data.loop !== undefined ? data.loop : true;
        video.muted = true; // Start muted to allow autoplay
        video.volume = 0; // Muted
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        // Hide video element (it's just for texture source)
        video.style.display = 'none';
        document.body.appendChild(video);

        console.log('Video element created for:', data.id, 'URL:', data.videoUrl);

        // Create video texture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;

        // Create screen mesh
        const geometry = new THREE.BoxGeometry(
            data.scale.x,
            data.scale.y,
            data.scale.z
        );

        // Materials for screen (front face has video, back is dark)
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), // Right
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), // Left
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), // Top
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), // Bottom
            new THREE.MeshStandardMaterial({
                map: videoTexture,
                emissive: 0xffffff,
                emissiveIntensity: 0.3,
                emissiveMap: videoTexture,
            }), // Front (video)
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), // Back
        ];

        const mesh = new THREE.Mesh(geometry, materials);

        // Set position and rotation
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add frame around screen
        this.addScreenFrame(mesh, data);

        // Add to scene
        this.scene.add(mesh);

        // Store screen data
        const screenObject = {
            id: data.id,
            mesh: mesh,
            video: video,
            videoTexture: videoTexture,
            triggerRadius: data.triggerRadius,
            position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
            isPlaying: false,
            autoplay: data.autoplay !== undefined ? data.autoplay : true,
            targetVolume: data.volume !== undefined ? data.volume : 0.5,
        };

        this.screens.push(screenObject);

        // Try to autoplay (muted)
        this.attemptAutoplay(screenObject);

        console.log('Screen created:', screenObject.id, 'Position:', screenObject.position, 'Trigger radius:', screenObject.triggerRadius);

        return screenObject;
    }

    /**
     * Add decorative frame around screen
     */
    addScreenFrame(screenMesh, data) {
        const frameThickness = 0.2;
        const frameDepth = 0.15;

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            metalness: 0.6,
            roughness: 0.4,
        });

        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(data.scale.x + frameThickness * 2, frameThickness, frameDepth),
            frameMaterial
        );
        topFrame.position.set(0, data.scale.y / 2 + frameThickness / 2, frameDepth / 2);
        screenMesh.add(topFrame);

        // Bottom frame
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(data.scale.x + frameThickness * 2, frameThickness, frameDepth),
            frameMaterial
        );
        bottomFrame.position.set(0, -data.scale.y / 2 - frameThickness / 2, frameDepth / 2);
        screenMesh.add(bottomFrame);

        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, data.scale.y, frameDepth),
            frameMaterial
        );
        leftFrame.position.set(-data.scale.x / 2 - frameThickness / 2, 0, frameDepth / 2);
        screenMesh.add(leftFrame);

        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, data.scale.y, frameDepth),
            frameMaterial
        );
        rightFrame.position.set(data.scale.x / 2 + frameThickness / 2, 0, frameDepth / 2);
        screenMesh.add(rightFrame);
    }

    /**
     * Attempt to autoplay video (may fail due to browser policies)
     */
    attemptAutoplay(screenObject) {
        console.log('Attempting autoplay for:', screenObject.id);

        // Start muted
        screenObject.video.muted = true;
        screenObject.video.volume = 0;

        const playPromise = screenObject.video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`✓ Video ${screenObject.id} autoplaying (muted)`);
                    screenObject.isPlaying = true;
                })
                .catch(error => {
                    console.warn(`✗ Video ${screenObject.id} autoplay blocked:`, error.message);
                    console.log('Click or press any key to enable videos');
                });
        }
    }

    /**
     * Update all screens (check proximity, manage playback)
     */
    update(playerPosition) {
        this.playerPosition.copy(playerPosition);

        this.screens.forEach(screen => {
            this.updateScreen(screen);
        });
    }

    /**
     * Update individual screen - ALWAYS PLAY (no proximity check)
     */
    updateScreen(screen) {
        // Just keep videos playing - no proximity check
        if (!screen.isPlaying) {
            this.playVideo(screen);
        }

        // Gradually increase volume if user interacted
        if (screen.isPlaying && this.userInteracted) {
            const volumeTarget = screen.targetVolume;
            if (screen.video.volume < volumeTarget) {
                screen.video.volume = Math.min(volumeTarget, screen.video.volume + 0.01);
                if (screen.video.muted && screen.video.volume > 0.1) {
                    screen.video.muted = false;
                    console.log(`Unmuting ${screen.id}`);
                }
            }
        }

        // Update texture
        if (screen.video.readyState >= screen.video.HAVE_CURRENT_DATA) {
            screen.videoTexture.needsUpdate = true;
        }
    }

    /**
     * Play video
     */
    playVideo(screen) {
        console.log(`▶ Attempting to play video: ${screen.id}`);

        // Make sure it's muted first for autoplay
        screen.video.muted = true;
        screen.video.volume = 0;

        const playPromise = screen.video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`✓ Successfully playing video: ${screen.id}`);
                    screen.isPlaying = true;
                })
                .catch(error => {
                    console.error(`✗ Failed to play video ${screen.id}:`, error);
                    console.log('Click anywhere or press any key to enable video playback');
                });
        }
    }

    /**
     * Pause video
     */
    pauseVideo(screen) {
        screen.video.pause();
        screen.isPlaying = false;
        console.log(`⏸ Paused video: ${screen.id}`);
    }

    /**
     * Stop video and reset to beginning
     */
    stopVideo(screen) {
        screen.video.pause();
        screen.video.currentTime = 0;
        screen.isPlaying = false;
    }

    /**
     * Set volume for a screen
     */
    setVolume(screenId, volume) {
        const screen = this.screens.find(s => s.id === screenId);
        if (screen) {
            screen.video.volume = Utils.clamp(volume, 0, 1);
            screen.targetVolume = volume;
        }
    }

    /**
     * Mute/unmute a screen
     */
    setMuted(screenId, muted) {
        const screen = this.screens.find(s => s.id === screenId);
        if (screen) {
            screen.video.muted = muted;
        }
    }

    /**
     * Get screen by ID
     */
    getScreen(screenId) {
        return this.screens.find(s => s.id === screenId);
    }

    /**
     * Dispose of all video resources
     */
    dispose() {
        this.screens.forEach(screen => {
            // Stop and remove video element
            screen.video.pause();
            screen.video.src = '';
            screen.video.remove();

            // Dispose texture
            screen.videoTexture.dispose();

            // Dispose mesh
            Utils.disposeObject(screen.mesh);
            this.scene.remove(screen.mesh);
        });

        this.screens = [];
    }
}
