/**
 * SceneManager.js - Builds and manages the 3D urban environment
 * Creates geometry, lighting, and manages all game systems
 */

class SceneManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Systems
        this.inputManager = null;
        this.playerController = null;
        this.cameraController = null;
        this.interactionSystem = null;
        this.videoScreenSystem = null;

        // Timing
        this.clock = new THREE.Clock();
        this.lastFrameTime = 0;

        console.log('SceneManager initialized');
    }

    /**
     * Initialize the scene
     */
    async init() {
        console.log('Building urban environment...');

        // Setup scene properties
        this.setupScene();

        // Create environment
        this.createGround();
        this.createBuildings();
        this.createLighting();
        this.createStreetLights();

        // Initialize systems
        this.inputManager = new InputManager();
        this.inputManager.init(this.renderer.domElement);

        // Create player
        this.playerController = new PlayerController(
            this.scene,
            this.inputManager,
            new THREE.Vector3(0, 0, 15) // Start position
        );

        // Create camera controller
        this.cameraController = new CameraController(this.camera, this.inputManager);
        this.cameraController.setTarget(this.playerController);

        // Create interaction system
        this.interactionSystem = new InteractionSystem(
            this.scene,
            this.camera,
            this.inputManager
        );
        this.interactionSystem.createInteractablesFromConfig();

        // Create video screen system
        this.videoScreenSystem = new VideoScreenSystem(this.scene);
        this.videoScreenSystem.createScreensFromConfig();

        console.log('Scene initialized successfully');
    }

    /**
     * Setup scene properties
     */
    setupScene() {
        // Background color
        this.scene.background = new THREE.Color(Config.scene.backgroundColor);

        // Fog
        this.scene.fog = new THREE.Fog(
            Config.scene.fogColor,
            Config.scene.fogNear,
            Config.scene.fogFar
        );
    }

    /**
     * Create ground plane
     */
    createGround() {
        const groundSize = Config.environment.groundSize;

        // Ground geometry
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.8,
            metalness: 0.2,
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.userData.collidable = false;

        this.scene.add(ground);

        // Add grid for visual reference
        const gridHelper = new THREE.GridHelper(groundSize, 50, 0x555555, 0x333333);
        gridHelper.position.y = 0.01; // Slightly above ground to prevent z-fighting
        this.scene.add(gridHelper);

        // Create plaza area (lighter colored)
        const plazaGeometry = new THREE.PlaneGeometry(30, 30);
        const plazaMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.7,
            metalness: 0.1,
        });

        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.set(0, 0.02, -10);
        plaza.receiveShadow = true;

        this.scene.add(plaza);
    }

    /**
     * Create buildings from config
     */
    createBuildings() {
        Config.environment.buildings.forEach(buildingData => {
            this.createBuilding(buildingData);
        });
    }

    /**
     * Create a single building
     */
    createBuilding(data) {
        const geometry = new THREE.BoxGeometry(
            data.size.x,
            data.size.y,
            data.size.z
        );

        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.7,
            metalness: 0.3,
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );

        building.castShadow = true;
        building.receiveShadow = true;
        building.userData.collidable = true;

        this.scene.add(building);

        // Add windows
        this.addWindows(building, data);
    }

    /**
     * Add windows to a building
     */
    addWindows(building, buildingData) {
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            emissive: 0x4a90e2,
            emissiveIntensity: 0.3,
            roughness: 0.2,
            metalness: 0.8,
        });

        const windowWidth = 0.8;
        const windowHeight = 1.2;
        const windowDepth = 0.05;
        const spacing = 2;

        const numWindowsX = Math.floor(buildingData.size.x / spacing);
        const numWindowsY = Math.floor(buildingData.size.y / spacing);

        const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);

        for (let y = 0; y < numWindowsY; y++) {
            for (let x = 0; x < numWindowsX; x++) {
                // Front face windows
                const windowFront = new THREE.Mesh(windowGeometry, windowMaterial);
                windowFront.position.set(
                    -buildingData.size.x / 2 + spacing / 2 + x * spacing,
                    -buildingData.size.y / 2 + spacing / 2 + y * spacing,
                    buildingData.size.z / 2 + windowDepth
                );
                building.add(windowFront);

                // Back face windows
                const windowBack = new THREE.Mesh(windowGeometry, windowMaterial);
                windowBack.position.set(
                    -buildingData.size.x / 2 + spacing / 2 + x * spacing,
                    -buildingData.size.y / 2 + spacing / 2 + y * spacing,
                    -buildingData.size.z / 2 - windowDepth
                );
                windowBack.rotation.y = Math.PI;
                building.add(windowBack);
            }
        }

        // Side face windows
        const numWindowsZ = Math.floor(buildingData.size.z / spacing);

        for (let y = 0; y < numWindowsY; y++) {
            for (let z = 0; z < numWindowsZ; z++) {
                // Left face windows
                const windowLeft = new THREE.Mesh(windowGeometry, windowMaterial);
                windowLeft.position.set(
                    -buildingData.size.x / 2 - windowDepth,
                    -buildingData.size.y / 2 + spacing / 2 + y * spacing,
                    -buildingData.size.z / 2 + spacing / 2 + z * spacing
                );
                windowLeft.rotation.y = -Math.PI / 2;
                building.add(windowLeft);

                // Right face windows
                const windowRight = new THREE.Mesh(windowGeometry, windowMaterial);
                windowRight.position.set(
                    buildingData.size.x / 2 + windowDepth,
                    -buildingData.size.y / 2 + spacing / 2 + y * spacing,
                    -buildingData.size.z / 2 + spacing / 2 + z * spacing
                );
                windowRight.rotation.y = Math.PI / 2;
                building.add(windowRight);
            }
        }
    }

    /**
     * Create lighting
     */
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            Config.scene.ambientLightColor,
            Config.scene.ambientLightIntensity
        );
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(
            Config.scene.directionalLightColor,
            Config.scene.directionalLightIntensity
        );

        directionalLight.position.set(
            Config.scene.directionalLightPosition.x,
            Config.scene.directionalLightPosition.y,
            Config.scene.directionalLightPosition.z
        );

        if (Config.performance.enableShadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 200;
            directionalLight.shadow.mapSize.width = Config.performance.shadowMapSize;
            directionalLight.shadow.mapSize.height = Config.performance.shadowMapSize;
        }

        this.scene.add(directionalLight);

        // Hemisphere light for ambient variety
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x404040, 0.4);
        this.scene.add(hemisphereLight);
    }

    /**
     * Create street lights
     */
    createStreetLights() {
        Config.environment.streetLights.forEach(lightData => {
            this.createStreetLight(lightData.position);
        });
    }

    /**
     * Create a single street light
     */
    createStreetLight(position) {
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            metalness: 0.7,
            roughness: 0.3,
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(position.x, 2.5, position.z);
        pole.castShadow = true;
        this.scene.add(pole);

        // Light fixture
        const fixtureGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const fixtureMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5,
        });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.set(position.x, 5, position.z);
        this.scene.add(fixture);

        // Point light
        const pointLight = new THREE.PointLight(0xffffcc, 0.8, 20);
        pointLight.position.set(position.x, 5, position.z);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    /**
     * Update all systems
     */
    update() {
        const deltaTime = this.clock.getDelta();

        // Update player
        const cameraForward = this.cameraController.getForwardDirection();
        this.playerController.update(deltaTime, cameraForward);

        // Update camera
        this.cameraController.update(deltaTime);

        // Update interaction system
        this.interactionSystem.update();

        // Update video screens
        this.videoScreenSystem.update(this.playerController.getPosition());
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.inputManager) this.inputManager.dispose();
        if (this.playerController) this.playerController.dispose();
        if (this.interactionSystem) this.interactionSystem.dispose();
        if (this.videoScreenSystem) this.videoScreenSystem.dispose();

        // Dispose scene objects
        this.scene.traverse((object) => {
            Utils.disposeObject(object);
        });
    }
}
