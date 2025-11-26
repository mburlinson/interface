/**
 * Config.js - Central configuration for the 3D environment
 * All gameplay constants, video URLs, and scene settings
 */

const Config = {
    // Player Movement
    player: {
        moveSpeed: 5.0,              // Units per second
        sprintMultiplier: 1.8,       // Sprint speed multiplier
        turnSpeed: 0.1,              // Rotation smoothing
        height: 1.8,                 // Player height for collision
        radius: 0.4,                 // Player collision radius
        gravity: -20.0,              // Gravity force
        jumpForce: 8.0,              // Jump velocity (if enabled)
    },

    // Camera Settings
    camera: {
        fov: 60,                     // Field of view
        near: 0.1,                   // Near clip plane
        far: 1000,                   // Far clip plane
        offset: { x: 0, y: 3, z: 6 },  // Offset from player (x, y, z)
        lookAtOffset: { x: 0, y: 1.5, z: 0 }, // Look at point offset
        mouseSensitivity: 0.002,     // Mouse rotation sensitivity
        minPolarAngle: 0.3,          // Min vertical rotation - CHANGED to allow looking up more
        maxPolarAngle: Math.PI / 2,  // Max vertical rotation (radians)
        smoothing: 0.1,              // Camera movement smoothing
        collisionRadius: 0.3,        // Camera collision detection radius
    },

    // Interaction System
    interaction: {
        raycastDistance: 5.0,        // Max interaction distance
        raycastInterval: 100,        // Raycast check interval (ms)
        highlightColor: 0x00ffff,    // Highlight color for interactables
        highlightIntensity: 0.5,     // Highlight emission intensity
    },

    // Video Screen Configuration
    videoScreens: [
        {
            id: 'plaza-screen-1',
            position: { x: 0, y: 5, z: -15 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 8, y: 4.5, z: 0.1 },
            videoUrl: 'https://player.vimeo.com/progressive_redirect/playback/941972848/rendition/360p/file.mp4?loc=external&log_user=0&signature=0042979ea677c38bf5d7d358b6b7b1ea392b93491bb11d1be072323984b7173f',
            loop: true,
            autoplay: true,
            volume: 0.5,
            triggerRadius: 15,       // Distance to start playback
        },
        {
            id: 'building-screen-1',
            position: { x: -20, y: 4, z: 0 },
            rotation: { x: 0, y: Math.PI / 2, z: 0 },
            scale: { x: 6, y: 3.4, z: 0.1 },
            videoUrl: 'https://player.vimeo.com/progressive_redirect/playback/619548035/rendition/1080p/file.mp4?loc=external&log_user=0&signature=366af475bc65444d4823867f933729b5e4132a48275cab4453142f156dedacfe',
            loop: true,
            autoplay: true,
            volume: 0.3,
            triggerRadius: 12,
        },
    ],

    // Interactable Objects Configuration
    interactables: [
        {
            id: 'info-kiosk-1',
            type: 'kiosk',
            position: { x: -5, y: 0, z: -5 },
            title: 'Welcome to Interface District',
            content: `This mixed-use development combines residential, commercial, and creative spaces into a vibrant urban ecosystem.

The district features:
• Sustainable architecture with LEED certification
• Walkable streets with mixed-use retail
• Central plaza for community events
• Integrated public transportation
• Green spaces and urban parks

Interface Multimedia has designed this environment to showcase modern urban planning principles.`,
        },
        {
            id: 'info-kiosk-2',
            type: 'kiosk',
            position: { x: 5, y: 0, z: -5 },
            title: 'Residential Tower A',
            content: `The Residential Tower features:

• 200 luxury apartments ranging from studios to 3-bedroom units
• Rooftop amenities including pool, gym, and event space
• Ground-floor retail and dining
• Smart home technology in every unit
• Direct access to transit station

Scheduled completion: Q4 2025`,
        },
        {
            id: 'gateway-1',
            type: 'gateway',
            position: { x: 0, y: 0, z: -25 },
            title: 'Plaza Gateway',
            content: 'This gateway marks the entrance to the central plaza. Beyond lies the heart of the Interface District.',
        },
    ],

    // Scene/Environment Settings
    scene: {
        backgroundColor: 0x87CEEB,   // Sky blue
        fogColor: 0x87CEEB,
        fogNear: 50,
        fogFar: 200,
        ambientLightColor: 0xffffff,
        ambientLightIntensity: 0.6,
        directionalLightColor: 0xffffff,
        directionalLightIntensity: 0.8,
        directionalLightPosition: { x: 50, y: 100, z: 50 },
    },

    // Urban Environment Layout
    environment: {
        // Ground plane
        groundSize: 200,

        // Building definitions (simple box geometry for prototype)
        buildings: [
            // Left side buildings
            { position: { x: -25, y: 7.5, z: -10 }, size: { x: 10, y: 15, z: 20 }, color: 0x808080 },
            { position: { x: -25, y: 10, z: 10 }, size: { x: 10, y: 20, z: 15 }, color: 0x707070 },

            // Right side buildings
            { position: { x: 25, y: 6, z: -10 }, size: { x: 10, y: 12, z: 18 }, color: 0x909090 },
            { position: { x: 25, y: 9, z: 10 }, size: { x: 10, y: 18, z: 16 }, color: 0x757575 },

            // Background buildings
            { position: { x: -10, y: 12, z: -35 }, size: { x: 15, y: 24, z: 12 }, color: 0x606060 },
            { position: { x: 10, y: 10, z: -35 }, size: { x: 15, y: 20, z: 12 }, color: 0x656565 },

            // Plaza surround
            { position: { x: -15, y: 3, z: -15 }, size: { x: 8, y: 6, z: 8 }, color: 0x888888 },
            { position: { x: 15, y: 3, z: -15 }, size: { x: 8, y: 6, z: 8 }, color: 0x888888 },
        ],

        // Street lights / props
        streetLights: [
            { position: { x: -8, y: 0, z: 0 } },
            { position: { x: 8, y: 0, z: 0 } },
            { position: { x: -8, y: 0, z: -10 } },
            { position: { x: 8, y: 0, z: -10 } },
        ],
    },

    // Input Keybinds
    input: {
        forward: ['KeyW', 'ArrowUp'],
        backward: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
        sprint: ['ShiftLeft', 'ShiftRight'],
        interact: ['KeyE'],
        escape: ['Escape'],
    },

    // Performance Settings
    performance: {
        targetFPS: 60,
        enableShadows: true,
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Cap at 2x for performance
    },
};
