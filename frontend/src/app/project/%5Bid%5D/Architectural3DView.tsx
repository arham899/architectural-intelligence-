"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// types shared with page.tsx
interface AssetDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  w: number;
  h: number;
  color: string;
}

interface PlacedAsset {
  uid: string;
  defId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  label: string;
}

interface Architectural3DViewProps {
  placed: PlacedAsset[];
  assets: AssetDef[];
  grid: number;
}

const Architectural3DView: React.FC<Architectural3DViewProps> = ({ placed, assets, grid }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    meshes: Map<string, THREE.Group>;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 10, 200);

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(40, 40, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // --- Lights ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);
    const point = new THREE.PointLight(0x0071ab, 1.2, 100);
    point.position.set(20, 30, 20);
    scene.add(point);

    // --- Infinite Grid ---
    const gridHelper = new THREE.GridHelper(200, 200, 0x222222, 0x111111);
    scene.add(gridHelper);

    sceneRef.current = { scene, camera, renderer, controls, meshes: new Map() };

    const animate = () => {
      requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.controls.update();
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // --- Syncing 2D to 3D ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, meshes } = sceneRef.current;

    // Remove defunct meshes
    const currentUids = new Set(placed.map(p => p.uid));
    meshes.forEach((_, uid) => {
      if (!currentUids.has(uid)) {
        const group = meshes.get(uid);
        if (group) scene.remove(group);
        meshes.delete(uid);
      }
    });

    // Update or Create
    placed.forEach(asset => {
      const def = assets.find(a => a.id === asset.defId);
      if (!def) return;

      let group = meshes.get(asset.uid);

      if (!group) {
        group = new THREE.Group();
        
        // --- Create Specialized Geometries ---
        const isRoom = def.category === "Rooms";
        const height = isRoom ? 3 : 0.8; // Rooms 3m, Furniture 0.8m
        const color = new THREE.Color(def.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) ? 
           `rgb(${RegExp.$1},${RegExp.$2},${RegExp.$3})` : "#ffffff");

        // Main Box
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // "Blueprint" Wireframe Look
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
        
        // Ghost Fill
        const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
        const fill = new THREE.Mesh(geometry, fillMat);
        
        group.add(line);
        group.add(fill);

        // Optional: Floor label placeholder
        // ... (can add more detail here)

        scene.add(group);
        meshes.set(asset.uid, group);
      }

      // Sync Position (2D X/Y -> 3D X/Z)
      // Since our 3D grid is centered, we map 2D units to 3D units directly
      const x3d = asset.x + asset.w / 2;
      const z3d = asset.y + asset.h / 2;
      const isRoom = def.category === "Rooms";
      const height = isRoom ? 3 : 0.8;

      group.position.set(x3d, height / 2, z3d);
      group.scale.set(asset.w, height, asset.h);
      group.rotation.y = (asset.rotation * Math.PI) / 180;
    });
  }, [placed, assets]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* 3D UI Overlay (Camera controls hint) */}
      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        background: "rgba(0,0,0,0.6)",
        padding: "10px",
        color: "#fff",
        fontSize: "10px",
        fontFamily: "monospace",
        border: "1px solid #444",
        pointerEvents: "none"
      }}>
        LMB: Rotate | RMB: Pan | Scroll: Zoom
      </div>
    </div>
  );
};

export default Architectural3DView;
