/**
 * CameraController.js - Third-person chase camera
 * Follows player with mouse-controlled orbit and smooth movement
 */

class CameraController {
    constructor(camera, inputManager) {
        this.camera = camera;
        this.inputManager = inputManager;

        // Camera orbit angles
        this.azimuthAngle = 0;              // Horizontal rotation
        this.polarAngle = Math.PI / 2;    // Vertical rotation (looking more horizontal now)

        // Camera position and target
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();

        // Target to follow
        this.target = null;

        console.log('CameraController initialized');
    }

    /**
     * Set the target for the camera to follow
     */
    setTarget(target) {
        this.target = target;

        if (target) {
            // Initialize camera position
            this.updateTargetPositions();
            this.currentPosition.copy(this.targetPosition);
            this.currentLookAt.copy(this.targetLookAt);
            this.camera.position.copy(this.currentPosition);
            this.camera.lookAt(this.currentLookAt);
        }
    }

    /**
     * Update camera each frame
     */
    update(deltaTime) {
        if (!this.target) return;

        // Handle mouse input for rotation
        if (this.inputManager.isPointerLocked) {
            this.handleMouseInput();
        }

        // Calculate desired camera position and look-at point
        this.updateTargetPositions();

        // Smoothly interpolate to target
        this.smoothFollow(deltaTime);

        // Apply to camera
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }

    /**
     * Handle mouse input for camera rotation
     */
    handleMouseInput() {
        const mouseDelta = this.inputManager.getMouseDelta();

        // Update azimuth (horizontal rotation)
        this.azimuthAngle -= mouseDelta.x * Config.camera.mouseSensitivity;

        // Update polar (vertical rotation)
        this.polarAngle -= mouseDelta.y * Config.camera.mouseSensitivity;

        // Clamp polar angle to prevent flipping
        this.polarAngle = Utils.clamp(
            this.polarAngle,
            Config.camera.minPolarAngle,
            Config.camera.maxPolarAngle
        );
    }

    /**
     * Calculate target camera position and look-at point
     */
    updateTargetPositions() {
        const playerPosition = this.target.getPosition();

        // Calculate camera offset based on orbit angles
        const offsetDistance = Math.sqrt(
            Config.camera.offset.x * Config.camera.offset.x +
            Config.camera.offset.y * Config.camera.offset.y +
            Config.camera.offset.z * Config.camera.offset.z
        );

        const offset = new THREE.Vector3(
            offsetDistance * Math.sin(this.azimuthAngle) * Math.sin(this.polarAngle),
            offsetDistance * Math.cos(this.polarAngle),
            offsetDistance * Math.cos(this.azimuthAngle) * Math.sin(this.polarAngle)
        );

        // Target camera position
        this.targetPosition.copy(playerPosition).add(offset);

        // Target look-at point (player position + look-at offset)
        const lookAtOffset = new THREE.Vector3(
            Config.camera.lookAtOffset.x,
            Config.camera.lookAtOffset.y,
            Config.camera.lookAtOffset.z
        );
        this.targetLookAt.copy(playerPosition).add(lookAtOffset);
    }

    /**
     * Smoothly follow the target
     */
    smoothFollow(deltaTime) {
        // Interpolation factor (60 FPS independent)
        const t = 1.0 - Math.pow(1.0 - Config.camera.smoothing, deltaTime * 60);

        // Smooth position
        this.currentPosition.lerp(this.targetPosition, t);

        // Smooth look-at
        this.currentLookAt.lerp(this.targetLookAt, t);
    }

    /**
     * Get the camera's forward direction (used by player for movement)
     */
    getForwardDirection() {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        return forward;
    }

    /**
     * Get the camera's right direction
     */
    getRightDirection() {
        const forward = this.getForwardDirection();
        const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
        return right;
    }

    /**
     * Reset camera to default position
     */
    reset() {
        this.azimuthAngle = 0;
        this.polarAngle = Math.PI / 2.5;  // More horizontal view
    }

    /**
     * Get camera position
     */
    getPosition() {
        return this.camera.position.clone();
    }
}
