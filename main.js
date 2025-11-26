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

        // UI elements - will be set in init
        this.loadingScreen = null;
        this.canvas = null;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing Urban 3D Environment...');

        try {
            // Find UI elements
            this.loadingScreen = document.getElementById('loading-screen');
            this.canvas = document.getElementById('render-canvas');

            if (!this.canvas) {
                throw new Error('Canvas element not found! Make sure #render-canvas exists in the HTML.');
            }

            // Verify it's actually a canvas element
            if (!(this.canvas instanceof HTMLCanvasElement)) {
                console.error('Element found but it is not a canvas:', this.canvas);
                throw new Error('render-canvas is not a canvas element! Found: ' + this.canvas.tagName);
            }

            console.log('Canvas found and verified:', this.canvas);
            console.log('Canvas type:', this.canvas.tagName);
            console.log('Canvas parent:', this.canvas.parentElement);

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
            this.showError('Failed to initialize the 3D environment: ' + error.message);
        }
    }

    /**
     * Create WebGL renderer
     */
    createRenderer() {
        console.log('Creating renderer with canvas:', this.canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: Config.performance.antialias,
        });

        this.renderer.setPixelRatio(Config.performance.pixelRatio);

        // Get container dimensions instead of window
        const container = this.canvas.parentElement;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        this.renderer.setSize(width, height);

        // Enable shadows
        if (Config.performance.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Tone mapping for better colors
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        console.log('Renderer created successfully');
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
        const container = this.canvas.parentElement;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(
            Config.camera.fov,
            width / height,
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
        const container = this.canvas.parentElement;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(width, height);

        console.log('Window resized:', width, 'x', height);
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
        if (this.loadingScreen) {
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.loadingScreen) {
            this.loadingScreen.innerHTML = `
                <div style="color: #e74c3c; text-align: center; padding: 20px;">
                    <h2>Error</h2>
                    <p>${message}</p>
                </div>
            `;
        } else {
            alert('Error: ' + message);
            console.error(message);
        }
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

function waitForCanvas() {
    const canvas = document.getElementById('render-canvas');

    if (canvas && canvas instanceof HTMLCanvasElement) {
        console.log('Valid canvas element found, starting game in 100ms...');
        // Small delay to ensure everything is ready
        setTimeout(startGame, 100);
    } else if (canvas) {
        console.error('Element with id "render-canvas" found but it is not a canvas!', canvas);
        setTimeout(waitForCanvas, 100);
    } else {
        console.log('Waiting for canvas element...');
        setTimeout(waitForCanvas, 100);
    }
}

function startGame() {
    console.log('Starting Urban 3D Environment...');
    console.log('THREE available:', typeof THREE !== 'undefined');
    console.log('Config available:', typeof Config !== 'undefined');
    console.log('Utils available:', typeof Utils !== 'undefined');
    console.log('Document ready state:', document.readyState);

    // Create and initialize game
    window.game = new Game();
    window.game.init();
}

// Wait for DOM to be ready, then wait for canvas
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForCanvas);
} else {
    // DOM already loaded, check for canvas
    waitForCanvas();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.dispose();
    }
});
