/**
 * PlayerController.js - Third-person character movement
 * Handles WASD movement, sprint, collision, and physics
 */

class PlayerController {
    constructor(scene, inputManager, startPosition = new THREE.Vector3(0, 0, 10)) {
        this.scene = scene;
        this.inputManager = inputManager;

        // Player state
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isGrounded = false;

        // Movement
        this.moveDirection = new THREE.Vector3(0, 0, 0);
        this.targetRotation = 0;
        this.currentRotation = 0;

        // Create player representation (invisible capsule for collision)
        this.createPlayerObject();

        // Raycaster for ground detection
        this.groundRaycaster = new THREE.Raycaster();
        this.groundRaycaster.far = Config.player.height + 0.5;

        console.log('PlayerController initialized at', this.position);
    }

    /**
     * Create the player object (visual representation and collision)
     */
    createPlayerObject() {
        // Visual marker (can be invisible or replaced with character model)
        const geometry = new THREE.CapsuleGeometry(
            Config.player.radius,
            Config.player.height - Config.player.radius * 2,
            4,
            8
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.0, // Invisible in third-person
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.userData.isPlayer = true;

        this.scene.add(this.mesh);
    }

    /**
     * Update player movement and physics
     */
    update(deltaTime, cameraForward) {
        if (!this.inputManager.isPointerLocked) {
            return; // No movement when pointer isn't locked
        }

        // Get input
        const movementInput = this.inputManager.getMovementInput();
        const isSprinting = this.inputManager.isSprinting();

        // Calculate movement direction relative to camera
        this.calculateMovement(movementInput, cameraForward, isSprinting);

        // Apply gravity
        this.applyGravity(deltaTime);

        // Check ground
        this.checkGround();

        // Move player
        this.move(deltaTime);

        // Update rotation
        this.updateRotation(deltaTime);

        // Update mesh position
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.currentRotation;
    }

    /**
     * Calculate movement direction based on input and camera orientation
     */
    calculateMovement(input, cameraForward, isSprinting) {
        if (input.length() === 0) {
            this.moveDirection.set(0, 0, 0);
            return;
        }

        // Get camera's forward direction (flatten to XZ plane)
        const forward = new THREE.Vector3(
            cameraForward.x,
            0,
            cameraForward.z
        ).normalize();

        // Calculate right direction
        const right = new THREE.Vector3(
            -forward.z,
            0,
            forward.x
        ).normalize();

        // Combine forward and right based on input
        this.moveDirection.set(0, 0, 0);
        this.moveDirection.addScaledVector(forward, input.y);
        this.moveDirection.addScaledVector(right, input.x);
        this.moveDirection.normalize();

        // Calculate target rotation (direction player is moving)
        if (this.moveDirection.length() > 0) {
            this.targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
        }

        // Apply speed
        const speed = Config.player.moveSpeed * (isSprinting ? Config.player.sprintMultiplier : 1.0);
        this.moveDirection.multiplyScalar(speed);
    }

    /**
     * Apply gravity to vertical velocity
     */
    applyGravity(deltaTime) {
        if (!this.isGrounded) {
            this.velocity.y += Config.player.gravity * deltaTime;
        } else {
            // Reset vertical velocity when grounded
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
    }

    /**
     * Check if player is on the ground
     */
    checkGround() {
        // Cast ray downward from player center
        const origin = this.position.clone();
        origin.y += 0.1; // Small offset to avoid self-intersection

        this.groundRaycaster.set(origin, new THREE.Vector3(0, -1, 0));

        const intersects = this.groundRaycaster.intersectObjects(this.scene.children, true);

        // Filter out player itself
        const groundHits = intersects.filter(hit => !hit.object.userData.isPlayer);

        this.isGrounded = groundHits.length > 0 && groundHits[0].distance < Config.player.height / 2 + 0.2;
    }

    /**
     * Move the player
     */
    move(deltaTime) {
        // Horizontal movement
        const horizontalMovement = this.moveDirection.clone().multiplyScalar(deltaTime);

        // Vertical movement (gravity/jumping)
        const verticalMovement = new THREE.Vector3(0, this.velocity.y * deltaTime, 0);

        // Combine movements
        const totalMovement = horizontalMovement.add(verticalMovement);

        // Simple collision detection
        const newPosition = this.position.clone().add(totalMovement);

        // Check if new position is valid (basic collision)
        if (this.canMoveTo(newPosition)) {
            this.position.copy(newPosition);
        } else {
            // Try moving only horizontally
            const horizontalOnly = this.position.clone().add(horizontalMovement);
            if (this.canMoveTo(horizontalOnly)) {
                this.position.copy(horizontalOnly);
            }

            // Try moving only vertically
            const verticalOnly = this.position.clone().add(verticalMovement);
            if (this.canMoveTo(verticalOnly)) {
                this.position.copy(verticalOnly);
            }
        }

        // Clamp to ground level minimum
        if (this.position.y < Config.player.height / 2) {
            this.position.y = Config.player.height / 2;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }

    /**
     * Check if player can move to a position (basic collision)
     */
    canMoveTo(position) {
        // Create a bounding box for the player at the new position
        const playerBox = new THREE.Box3(
            new THREE.Vector3(
                position.x - Config.player.radius,
                position.y - Config.player.height / 2,
                position.z - Config.player.radius
            ),
            new THREE.Vector3(
                position.x + Config.player.radius,
                position.y + Config.player.height / 2,
                position.z + Config.player.radius
            )
        );

        // Check collision with scene objects
        for (const object of this.scene.children) {
            if (object.userData.isPlayer) continue;
            if (!object.userData.collidable) continue;

            // Get object's bounding box
            const objectBox = new THREE.Box3().setFromObject(object);

            // Check intersection
            if (playerBox.intersectsBox(objectBox)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Smoothly rotate player to face movement direction
     */
    updateRotation(deltaTime) {
        // Smooth rotation towards target
        let rotationDiff = this.targetRotation - this.currentRotation;

        // Handle rotation wrapping (shortest path)
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

        this.currentRotation += rotationDiff * Config.player.turnSpeed;
    }

    /**
     * Get player's forward direction (for camera)
     */
    getForwardDirection() {
        return new THREE.Vector3(
            Math.sin(this.currentRotation),
            0,
            Math.cos(this.currentRotation)
        );
    }

    /**
     * Get player position
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * Set player position (for teleporting)
     */
    setPosition(position) {
        this.position.copy(position);
        this.mesh.position.copy(position);
    }

    /**
     * Dispose of player resources
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            Utils.disposeObject(this.mesh);
        }
    }
}
