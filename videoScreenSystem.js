/**
 * VideoScreenSystem.js - Manages streaming video screens in the 3D world
 * Proximity-triggered video playback on mesh surfaces
 */

class VideoScreenSystem {
    constructor(scene) {
        this.scene = scene;
        this.screens = [];
        this.playerPosition = new THREE.Vector3();

        console.log('VideoScreenSystem initialized');
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
        console.log('Creating video screen:', data.id);

        // Create HTML5 video element
        const video = document.createElement('video');
        video.id = data.id;
        video.src = data.videoUrl;
        video.loop = data.loop !== undefined ? data.loop : true;
        video.muted = false;
        video.volume = data.volume !== undefined ? data.volume : 0.5;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        // Hide video element (it's just for texture source)
        video.style.display = 'none';
        document.body.appendChild(video);

        // Create video texture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBFormat;

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
        };

        this.screens.push(screenObject);

        // Autoplay if configured and browser allows
        if (data.autoplay) {
            this.attemptAutoplay(screenObject);
        }

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
        const playPromise = screenObject.video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`Video ${screenObject.id} autoplaying`);
                    screenObject.isPlaying = true;
                })
                .catch(error => {
                    console.log(`Video ${screenObject.id} autoplay blocked:`, error.message);
                    // Browser blocked autoplay - will play on user interaction/proximity
                    screenObject.video.muted = true; // Muted videos can usually autoplay
                    screenObject.video.play().then(() => {
                        screenObject.isPlaying = true;
                    });
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
     * Update individual screen based on player proximity
     */
    updateScreen(screen) {
        // Calculate distance to player (XZ plane)
        const distance = Utils.distanceXZ(this.playerPosition, screen.position);

        // Check if player is within trigger radius
        const inRange = distance < screen.triggerRadius;

        if (inRange && !screen.isPlaying) {
            // Player entered range - start playback
            this.playVideo(screen);
        } else if (!inRange && screen.isPlaying && !screen.autoplay) {
            // Player left range - pause playback (if not autoplay)
            this.pauseVideo(screen);
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
        const playPromise = screen.video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`Playing video: ${screen.id}`);
                    screen.isPlaying = true;
                })
                .catch(error => {
                    console.warn(`Failed to play video ${screen.id}:`, error);
                });
        }
    }

    /**
     * Pause video
     */
    pauseVideo(screen) {
        screen.video.pause();
        screen.isPlaying = false;
        console.log(`Paused video: ${screen.id}`);
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
