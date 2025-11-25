/**
 * InputManager.js - Centralized input handling
 * Manages keyboard, mouse, and pointer lock state
 */

class InputManager {
    constructor() {
        this.keys = new Set();
        this.mouseMovement = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.canvas = null;

        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    /**
     * Initialize input listeners
     */
    init(canvas) {
        this.canvas = canvas;

        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);

        // Mouse events
        document.addEventListener('mousemove', this.onMouseMove);
        canvas.addEventListener('click', this.onClick);

        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', this.onPointerLockChange);

        console.log('InputManager initialized');
    }

    /**
     * Clean up event listeners
     */
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);

        if (this.canvas) {
            this.canvas.removeEventListener('click', this.onClick);
        }

        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('webkitpointerlockchange', this.onPointerLockChange);
    }

    /**
     * Handle key down
     */
    onKeyDown(event) {
        // Escape key releases pointer lock
        if (event.code === 'Escape' && this.isPointerLocked) {
            Utils.exitPointerLock();
            return;
        }

        this.keys.add(event.code);
    }

    /**
     * Handle key up
     */
    onKeyUp(event) {
        this.keys.delete(event.code);
    }

    /**
     * Handle mouse movement
     */
    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouseMovement.x = event.movementX || 0;
            this.mouseMovement.y = event.movementY || 0;
        }
    }

    /**
     * Handle canvas click (request pointer lock)
     */
    onClick() {
        if (!this.isPointerLocked && Utils.isPointerLockSupported()) {
            Utils.requestPointerLock(this.canvas);
        }
    }

    /**
     * Handle pointer lock state change
     */
    onPointerLockChange() {
        this.isPointerLocked = Utils.isPointerLocked();

        if (this.isPointerLocked) {
            console.log('Pointer locked - controls active');
        } else {
            console.log('Pointer unlocked - click canvas to resume');
            // Reset mouse movement when unlocking
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
    }

    /**
     * Check if any of the provided keys are pressed
     */
    isKeyPressed(keyCodes) {
        if (!Array.isArray(keyCodes)) {
            keyCodes = [keyCodes];
        }
        return keyCodes.some(code => this.keys.has(code));
    }

    /**
     * Get movement input as a Vector2
     */
    getMovementInput() {
        const input = new THREE.Vector2(0, 0);

        // Forward/Backward
        if (this.isKeyPressed(Config.input.forward)) {
            input.y += 1;
        }
        if (this.isKeyPressed(Config.input.backward)) {
            input.y -= 1;
        }

        // Left/Right
        if (this.isKeyPressed(Config.input.left)) {
            input.x -= 1;
        }
        if (this.isKeyPressed(Config.input.right)) {
            input.x += 1;
        }

        // Normalize diagonal movement
        if (input.length() > 0) {
            input.normalize();
        }

        return input;
    }

    /**
     * Check if sprint is held
     */
    isSprinting() {
        return this.isKeyPressed(Config.input.sprint);
    }

    /**
     * Check if interact key was pressed (consume the input)
     */
    isInteractPressed() {
        const pressed = this.isKeyPressed(Config.input.interact);
        if (pressed) {
            // Consume the input to prevent repeated triggers
            Config.input.interact.forEach(code => this.keys.delete(code));
        }
        return pressed;
    }

    /**
     * Get and reset mouse movement delta
     */
    getMouseDelta() {
        const delta = { ...this.mouseMovement };
        this.mouseMovement.x = 0;
        this.mouseMovement.y = 0;
        return delta;
    }

    /**
     * Reset all input state
     */
    reset() {
        this.keys.clear();
        this.mouseMovement.x = 0;
        this.mouseMovement.y = 0;
    }
}
