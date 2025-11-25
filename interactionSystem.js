/**
 * InteractionSystem.js - Handles player interactions with objects
 * Raycast-based detection and UI prompts
 */

class InteractionSystem {
    constructor(scene, camera, inputManager) {
        this.scene = scene;
        this.camera = camera;
        this.inputManager = inputManager;

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = Config.interaction.raycastDistance;

        // Current target
        this.currentInteractable = null;
        this.interactables = [];

        // UI elements
        this.promptElement = document.getElementById('interaction-prompt');
        this.infoPanelElement = document.getElementById('info-panel');
        this.panelTitleElement = document.getElementById('panel-title');
        this.panelContentElement = document.getElementById('panel-content');
        this.closePanelButton = document.getElementById('close-panel');

        // Panel state
        this.isPanelOpen = false;

        // Setup UI handlers
        this.setupUIHandlers();

        console.log('InteractionSystem initialized');
    }

    /**
     * Setup UI event handlers
     */
    setupUIHandlers() {
        this.closePanelButton.addEventListener('click', () => {
            this.closePanel();
        });

        // ESC key to close panel
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.isPanelOpen) {
                this.closePanel();
                event.stopPropagation();
            }
        });
    }

    /**
     * Register an interactable object
     */
    registerInteractable(object, data) {
        object.userData.interactable = true;
        object.userData.interactionData = data;
        this.interactables.push(object);
    }

    /**
     * Update interaction system (raycast check)
     */
    update() {
        // Don't check for interactions if panel is open
        if (this.isPanelOpen) {
            return;
        }

        // Only check when pointer is locked
        if (!this.inputManager.isPointerLocked) {
            this.clearHighlight();
            this.hidePrompt();
            return;
        }

        // Raycast from center of screen
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        // Check for interactables
        const intersects = this.raycaster.intersectObjects(this.interactables, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const object = this.findInteractableParent(hit.object);

            if (object && object.userData.interactable) {
                this.setCurrentInteractable(object);
            } else {
                this.clearCurrentInteractable();
            }
        } else {
            this.clearCurrentInteractable();
        }

        // Check for interact input
        if (this.currentInteractable && this.inputManager.isInteractPressed()) {
            this.interact();
        }
    }

    /**
     * Find the interactable parent of an object
     */
    findInteractableParent(object) {
        let current = object;
        while (current) {
            if (current.userData.interactable) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    /**
     * Set the current interactable and show prompt
     */
    setCurrentInteractable(object) {
        if (this.currentInteractable === object) {
            return; // Already set
        }

        // Clear previous
        this.clearHighlight();

        // Set new
        this.currentInteractable = object;
        this.highlightObject(object);
        this.showPrompt();
    }

    /**
     * Clear current interactable
     */
    clearCurrentInteractable() {
        if (!this.currentInteractable) {
            return;
        }

        this.clearHighlight();
        this.currentInteractable = null;
        this.hidePrompt();
    }

    /**
     * Highlight an object
     */
    highlightObject(object) {
        // Store original material
        object.traverse((child) => {
            if (child.isMesh) {
                // Store original emissive
                if (!child.userData.originalEmissive) {
                    child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
                    child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
                }

                // Apply highlight
                if (child.material.emissive) {
                    child.material.emissive.setHex(Config.interaction.highlightColor);
                    child.material.emissiveIntensity = Config.interaction.highlightIntensity;
                }
            }
        });
    }

    /**
     * Clear highlight from current object
     */
    clearHighlight() {
        if (!this.currentInteractable) return;

        this.currentInteractable.traverse((child) => {
            if (child.isMesh && child.userData.originalEmissive) {
                // Restore original emissive
                if (child.material.emissive) {
                    child.material.emissive.copy(child.userData.originalEmissive);
                    child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
                }
            }
        });
    }

    /**
     * Show interaction prompt
     */
    showPrompt() {
        this.promptElement.classList.add('visible');
    }

    /**
     * Hide interaction prompt
     */
    hidePrompt() {
        this.promptElement.classList.remove('visible');
    }

    /**
     * Trigger interaction with current object
     */
    interact() {
        if (!this.currentInteractable) return;

        const data = this.currentInteractable.userData.interactionData;

        console.log('Interacting with:', data.id);

        // Show info panel
        this.showInfoPanel(data);

        // Clear current interactable
        this.clearCurrentInteractable();
    }

    /**
     * Show info panel with content
     */
    showInfoPanel(data) {
        this.panelTitleElement.textContent = data.title || 'Information';
        this.panelContentElement.innerHTML = this.formatContent(data.content || '');

        this.infoPanelElement.classList.add('visible');
        this.isPanelOpen = true;

        // Release pointer lock to allow clicking close button
        if (Utils.isPointerLocked()) {
            Utils.exitPointerLock();
        }
    }

    /**
     * Close info panel
     */
    closePanel() {
        this.infoPanelElement.classList.remove('visible');
        this.isPanelOpen = false;
    }

    /**
     * Format content text (convert line breaks to HTML)
     */
    formatContent(text) {
        return text
            .split('\n')
            .map(line => {
                line = line.trim();
                if (line.startsWith('•')) {
                    return `<li>${line.substring(1).trim()}</li>`;
                } else if (line.length > 0) {
                    return `<p>${line}</p>`;
                }
                return '';
            })
            .join('');
    }

    /**
     * Create interactable objects from config
     */
    createInteractablesFromConfig() {
        Config.interactables.forEach(data => {
            this.createInteractable(data);
        });
    }

    /**
     * Create a single interactable object
     */
    createInteractable(data) {
        let geometry, material, mesh;

        switch (data.type) {
            case 'kiosk':
                // Info kiosk - tall rectangular stand
                geometry = new THREE.BoxGeometry(1.2, 2, 0.3);
                material = new THREE.MeshStandardMaterial({
                    color: 0x2c3e50,
                    metalness: 0.3,
                    roughness: 0.7,
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(data.position.x, 1, data.position.z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Add screen face
                const screenGeometry = new THREE.PlaneGeometry(0.9, 1.2);
                const screenMaterial = new THREE.MeshStandardMaterial({
                    color: 0x34495e,
                    emissive: 0x3498db,
                    emissiveIntensity: 0.2,
                });
                const screen = new THREE.Mesh(screenGeometry, screenMaterial);
                screen.position.set(0, 0.2, 0.16);
                mesh.add(screen);
                break;

            case 'gateway':
                // Gateway - arch structure
                const pillarGeometry = new THREE.BoxGeometry(1, 5, 1);
                const pillarMaterial = new THREE.MeshStandardMaterial({
                    color: 0x95a5a6,
                    metalness: 0.2,
                    roughness: 0.8,
                });

                const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                leftPillar.position.set(-3, 2.5, 0);
                leftPillar.castShadow = true;

                const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                rightPillar.position.set(3, 2.5, 0);
                rightPillar.castShadow = true;

                const archGeometry = new THREE.BoxGeometry(7, 0.8, 1);
                const arch = new THREE.Mesh(archGeometry, pillarMaterial);
                arch.position.set(0, 5.4, 0);
                arch.castShadow = true;

                // Group them
                mesh = new THREE.Group();
                mesh.add(leftPillar);
                mesh.add(rightPillar);
                mesh.add(arch);
                mesh.position.set(data.position.x, 0, data.position.z);
                break;

            default:
                // Generic interactable
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(data.position.x, 0.5, data.position.z);
                mesh.castShadow = true;
                break;
        }

        // Register as interactable
        this.registerInteractable(mesh, data);

        // Add to scene
        this.scene.add(mesh);

        return mesh;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.interactables.forEach(obj => {
            Utils.disposeObject(obj);
        });
        this.interactables = [];
    }
}
