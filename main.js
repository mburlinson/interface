/**
 * Main.js - Application entry point
 * Initializes Three.js, creates the scene, and starts the game loop
 */

class Game {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.sceneManager = null;
        this.isRunning = false;

        // UI elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.canvas = document.getElementById('render-canvas');
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing Urban 3D Environment...');

        try {
            // Create Three.js core
            this.createRenderer();
            this.createScene();
            this.createCamera();

            // Create scene manager
            this.sceneManager = new SceneManager(this.renderer, this.scene, this.camera);
            await this.sceneManager.init();

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());

            // Hide loading screen
            this.hideLoadingScreen();

            // Start game loop
            this.isRunning = true;
            this.animate();

            console.log('Game initialized successfully!');

        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize the 3D environment. Please refresh the page.');
        }
    }

    /**
     * Create WebGL renderer
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: Config.performance.antialias,
        });

        this.renderer.setPixelRatio(Config.performance.pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Enable shadows
        if (Config.performance.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Tone mapping for better colors
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        console.log('Renderer created');
    }

    /**
     * Create scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        console.log('Scene created');
    }

    /**
     * Create camera
     */
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            Config.camera.fov,
            window.innerWidth / window.innerHeight,
            Config.camera.near,
            Config.camera.far
        );

        this.camera.position.set(0, 5, 10);
        console.log('Camera created');
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        console.log('Window resized:', window.innerWidth, 'x', window.innerHeight);
    }

    /**
     * Main game loop
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        // Update all systems
        this.sceneManager.update();

        // Render
        this.sceneManager.render();
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
        }, 500);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.loadingScreen.innerHTML = `
            <div style="color: #e74c3c; text-align: center; padding: 20px;">
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Cleanup and dispose
     */
    dispose() {
        this.isRunning = false;

        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        window.removeEventListener('resize', this.onWindowResize);
    }
}

// ============================================================================
// Entry Point
// ============================================================================

function startGame() {
    console.log('Starting Urban 3D Environment...');
    console.log('THREE available:', typeof THREE !== 'undefined');
    console.log('Config available:', typeof Config !== 'undefined');
    console.log('Utils available:', typeof Utils !== 'undefined');

    // Create and initialize game
    window.game = new Game();
    window.game.init();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    // DOM already loaded, start immediately
    startGame();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.dispose();
    }
});
