"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 3D ARCHITECTURAL BLUEPRINT SCENE
 * Replaces the ASCII art with high-fidelity glowing wireframe monuments
 * and an infinite 3D grid with mouse parallax.
 */
const ArchitectureScene3D: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        monuments: THREE.Group[];
        ghosts: THREE.Group[];
        currentIdx: number;
        grid: THREE.GridHelper;
        mouse: THREE.Vector2;
        targetRotation: THREE.Vector2;
    } | null>(null);

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Setup Scene ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505); // Brutalist black
        scene.fog = new THREE.Fog(0x050505, 10, 50);

        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 20);
        camera.lookAt(0, 2, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // --- Infinite 3D Grid ---
        const gridSize = 100;
        const gridDivisions = 100;
        const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x333333, 0x111111);
        grid.position.y = -2;
        scene.add(grid);

        // --- Lights ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 20, 10);
        scene.add(pointLight);

        // --- Monument Factories ---
        const materials = {
            white: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
            dim: new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.3 }),
        };

        const createWireframe = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) => {
            const edges = new THREE.EdgesGeometry(geo);
            return new THREE.LineSegments(edges, mat);
        };

        const createColosseum = () => {
            const group = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const ring = new THREE.TorusGeometry(8 - i * 0.5, 1.2, 16, 64);
                const mesh = createWireframe(ring, i === 0 ? materials.white : materials.dim);
                mesh.rotation.x = Math.PI / 2;
                mesh.position.y = i * 2.5;
                group.add(mesh);
            }
            const inner = new THREE.TorusGeometry(5, 1, 12, 40);
            const innerMesh = createWireframe(inner, materials.dim);
            innerMesh.rotation.x = Math.PI / 2;
            group.add(innerMesh);
            return group;
        };

        const createMosque = () => {
            const group = new THREE.Group();
            const base = new THREE.BoxGeometry(10, 2, 10);
            group.add(createWireframe(base, materials.white));
            const minaretGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
            for (let x of [-4.5, 4.5]) {
                for (let z of [-4.5, 4.5]) {
                    const m = createWireframe(minaretGeo, materials.dim);
                    m.position.set(x, 5, z);
                    group.add(m);
                }
            }
            const dome = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
            const d = createWireframe(dome, materials.white);
            d.position.y = 1;
            group.add(d);
            return group;
        };

        const createPisa = () => {
            const group = new THREE.Group();
            for (let i = 0; i < 7; i++) {
                const ring = new THREE.CylinderGeometry(3, 3, 2, 24);
                const r = createWireframe(ring, i === 0 || i === 6 ? materials.white : materials.dim);
                r.position.y = i * 2.2;
                group.add(r);
            }
            group.rotation.z = 0.1;
            return group;
        };

        const createStatue = () => {
            const group = new THREE.Group();
            const base = new THREE.BoxGeometry(4, 4, 4);
            group.add(createWireframe(base, materials.dim));
            const body = new THREE.CylinderGeometry(0.5, 1.5, 10, 8);
            const b = createWireframe(body, materials.white);
            b.position.y = 7;
            group.add(b);
            return group;
        };

        const monuments = [createColosseum(), createMosque(), createPisa(), createStatue()];
        const ghosts: THREE.Group[] = [];

        monuments.forEach((m, i) => {
            m.visible = i === 0;
            m.position.x = 8;
            m.position.y = 0; // Grounded main figure
            scene.add(m);

            // Create Holographic Ghost
            const ghost = m.clone();
            ghost.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.4;
                }
            });
            ghost.visible = i === 0;
            ghosts.push(ghost);
            scene.add(ghost);
        });

        sceneRef.current = {
            scene, camera, renderer, monuments,
            currentIdx: 0, grid,
            mouse: new THREE.Vector2(),
            targetRotation: new THREE.Vector2(),
            ghosts // tracked for animation
        };

        // --- Interaction & Animation ---
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (sceneRef.current) {
                sceneRef.current.targetRotation.set(y * 0.1, x * 0.2);
            }
        };
        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);
            if (!sceneRef.current) return;
            const s = sceneRef.current;

            // Rotate current monument
            const currentM = s.monuments[s.currentIdx];
            currentM.rotation.y += 0.005;

            // Ghost Pulse Animation
            const currentGhost = s.ghosts[s.currentIdx];
            currentGhost.rotation.y = currentM.rotation.y;
            currentGhost.position.y += 0.04; // Rising

            // Fade ghost as it rises
            currentGhost.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
                    child.material.opacity -= 0.005;
                }
            });

            // Reset ghost if it drifts too high or fades out
            const firstChild = currentGhost.children[0] as THREE.LineSegments;
            if (currentGhost.position.y > 10 || (firstChild && (firstChild.material as THREE.LineBasicMaterial).opacity <= 0)) {
                currentGhost.position.y = 0;
                currentGhost.traverse((child: THREE.Object3D) => {
                    if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
                        child.material.opacity = 0.4;
                    }
                });
            }

            // Camera Parallax
            s.camera.position.x += (s.targetRotation.y * 10 - s.camera.position.x) * 0.05;
            s.camera.position.y += (5 + s.targetRotation.x * 5 - s.camera.position.y) * 0.05;
            s.camera.lookAt(4, 1.5, 0);

            s.renderer.render(s.scene, s.camera);
        };
        animate();

        // --- Rotation Cycle (3s) ---
        const interval = setInterval(() => {
            if (!sceneRef.current) return;
            const s = sceneRef.current;
            s.monuments[s.currentIdx].visible = false;
            s.ghosts[s.currentIdx].visible = false;

            s.currentIdx = (s.currentIdx + 1) % s.monuments.length;
            
            const nextM = s.monuments[s.currentIdx];
            nextM.visible = true;
            nextM.rotation.y = 0;
            nextM.position.y = 0; // Ensure grounding

            const nextG = s.ghosts[s.currentIdx];
            nextG.visible = true;
            nextG.position.y = 0;
            nextG.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
                    child.material.opacity = 0.4;
                }
            });
        }, 3000);

        setLoaded(true);

        // --- Cleanup ---
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                zIndex: 0,
                backgroundColor: "#050505",
                overflow: "hidden"
            }}
        />
    );
};

export default ArchitectureScene3D;
