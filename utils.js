/**
 * Utils.js - Utility functions and helpers
 * Provides common math operations, event handling, and browser compatibility checks
 */

const Utils = {
    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Check if pointer lock is supported
     */
    isPointerLockSupported() {
        return 'pointerLockElement' in document ||
               'mozPointerLockElement' in document ||
               'webkitPointerLockElement' in document;
    },

    /**
     * Request pointer lock on an element
     */
    requestPointerLock(element) {
        element.requestPointerLock = element.requestPointerLock ||
                                      element.mozRequestPointerLock ||
                                      element.webkitRequestPointerLock;
        element.requestPointerLock();
    },

    /**
     * Exit pointer lock
     */
    exitPointerLock() {
        document.exitPointerLock = document.exitPointerLock ||
                                   document.mozExitPointerLock ||
                                   document.webkitExitPointerLock;
        document.exitPointerLock();
    },

    /**
     * Check if pointer is currently locked
     */
    isPointerLocked() {
        return document.pointerLockElement !== null ||
               document.mozPointerLockElement !== null ||
               document.webkitPointerLockElement !== null;
    },

    /**
     * Get distance between two Vector3 positions (XZ plane only)
     */
    distanceXZ(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    },

    /**
     * Create a simple event emitter
     */
    createEventEmitter() {
        const listeners = {};

        return {
            on(event, callback) {
                if (!listeners[event]) {
                    listeners[event] = [];
                }
                listeners[event].push(callback);
            },

            off(event, callback) {
                if (!listeners[event]) return;
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            },

            emit(event, data) {
                if (!listeners[event]) return;
                listeners[event].forEach(callback => callback(data));
            }
        };
    },

    /**
     * Load texture with error handling
     */
    loadTexture(url, onLoad, onError) {
        const loader = new THREE.TextureLoader();
        return loader.load(
            url,
            onLoad,
            undefined,
            onError || ((err) => console.error('Error loading texture:', url, err))
        );
    },

    /**
     * Dispose of Three.js object and its children
     */
    disposeObject(object) {
        if (!object) return;

        if (object.geometry) {
            object.geometry.dispose();
        }

        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }

        if (object.texture) {
            object.texture.dispose();
        }

        if (object.children) {
            object.children.forEach(child => Utils.disposeObject(child));
        }
    }
};
