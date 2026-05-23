"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./ASCIIBuilding3D.module.css";

// ─── Density-mapped chars (sparse → dense) ────────────────────
const DENSITY = " `.',:;-_+=|/\\()[]!?#&@%MW8B";

// Per-cell stable seed chars (pre-assigned, no flicker)
let seedChars: string[] | null = null;
function getSeedChars(n: number): string[] {
  if (seedChars && seedChars.length >= n) return seedChars;
  seedChars = Array.from({ length: n }, () => DENSITY[Math.floor(Math.random() * DENSITY.length)]);
  return seedChars;
}

function densityChar(b: number, seed: string): string {
  if (b < 4) return " ";
  const idx = Math.min(Math.floor((b / 255) * (DENSITY.length - 1)) + 1, DENSITY.length - 1);
  // Pick from appropriate density tier deterministically using seed
  const t = DENSITY.slice(Math.max(0, idx - 2), idx + 1);
  const si = seed.charCodeAt(0) % t.length;
  return t[si] || DENSITY[idx];
}

// Color palettes: [0=bg, 1=shadow, 2=mid, 3=highlight, 4=bright]
const PALETTES: string[][] = [
  // Colosseum – warm travertine amber
  ["#0a0502", "#3a1a06", "#7a401a", "#c07830", "#f0c060"],
  // Faisal Mosque – cold blue-white marble
  ["#050810", "#142040", "#2a4880", "#5090d8", "#b8d8ff"],
  // Tower of Pisa – creamy marble
  ["#0c0a06", "#2e2010", "#5e4a28", "#9a7848", "#dcc898"],
  // Statue of Liberty – verdigris teal
  ["#020c08", "#0a2818", "#1e5540", "#3d9880", "#78d0b8"],
];

function getPaletteColor(b: number, palette: string[]): string {
  if (b < 5) return palette[0];
  if (b < 25) return palette[1];
  if (b < 70) return palette[2];
  if (b < 150) return palette[3];
  return palette[4];
}

// ─── Monument Factories ────────────────────────────────────────

function createColosseum(): THREE.Group {
  const g = new THREE.Group();
  const mfill = (c: number) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const mline = (c: number) => new THREE.LineBasicMaterial({ color: c });

  // Ground platform
  const base = new THREE.CylinderGeometry(8.2, 8.5, 0.5, 64);
  g.add(new THREE.Mesh(base, mfill(0x251008)));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(base), mline(0x5a3010)));

  // 4 tiers of outer wall
  const tiers = [
    { r: 7.8, h: 2.2, y: 1.35 },
    { r: 7.5, h: 2.0, y: 3.5 },
    { r: 7.2, h: 1.8, y: 5.4 },
    { r: 7.0, h: 2.6, y: 7.5 }, // solid attic
  ];
  const tierColors = [0x7a401a, 0x6a3814, 0x5a3010, 0x4a2808];
  const edgeColors = [0xf0c060, 0xd0a040, 0xb08030, 0x907020];

  for (let ti = 0; ti < tiers.length; ti++) {
    const td = tiers[ti];
    const wall = new THREE.CylinderGeometry(td.r, td.r + 0.2, td.h, 64, 1, true);
    g.add(new THREE.Mesh(wall, mfill(tierColors[ti])).translateY(td.y));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(wall), mline(edgeColors[ti])).translateY(td.y));

    // Horizontal ledge ring between tiers
    if (ti < 3) {
      const ledge = new THREE.CylinderGeometry(td.r + 0.05, td.r + 0.05, 0.18, 64);
      g.add(new THREE.Mesh(ledge, mfill(0x3a1a06)).translateY(td.y + td.h / 2));
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(ledge), mline(edgeColors[ti])).translateY(td.y + td.h / 2));
    }
  }

  // Arch columns — 3 tiers × 28 columns
  const ARCH_N = 28;
  for (let tier = 0; tier < 3; tier++) {
    const td = tiers[tier];
    const clr = edgeColors[tier];
    for (let i = 0; i < ARCH_N; i++) {
      const angle = (i / ARCH_N) * Math.PI * 2;
      const r = td.r - 0.08;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // Column pillar
      const col = new THREE.CylinderGeometry(0.08, 0.11, td.h * 0.82, 6);
      const cm = new THREE.LineSegments(new THREE.EdgesGeometry(col), mline(clr));
      cm.position.set(x, td.y, z); cm.rotation.y = -angle;
      g.add(cm);

      // Arch top (half-torus)
      const archW = (Math.PI * 2 * r / ARCH_N) * 0.38;
      const archGeo = new THREE.TorusGeometry(archW, 0.045, 4, 10, Math.PI);
      const am = new THREE.LineSegments(new THREE.EdgesGeometry(archGeo), mline(clr));
      am.position.set(x, td.y + td.h * 0.33, z);
      am.rotation.y = -angle + Math.PI / 2; am.rotation.z = Math.PI / 2;
      g.add(am);
    }
  }

  // Outer rings at tier levels
  for (let t = 0; t <= 4; t++) {
    const ring = new THREE.TorusGeometry(8.0 - t * 0.25, 0.07, 4, 64);
    ring.rotateX(Math.PI / 2);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(ring), mline(edgeColors[Math.min(t, 3)])).translateY(t * 2.1 + 0.25));
  }

  // Interior arena + seating
  const seating = new THREE.CylinderGeometry(5.5, 7.2, 6, 48, 3, true);
  g.add(new THREE.Mesh(seating, mfill(0x1a0904)));
  const arena = new THREE.CylinderGeometry(2.8, 2.8, 0.12, 32);
  g.add(new THREE.Mesh(arena, mfill(0x2a1408)));

  // Ruined section (broken top on one side) — lines only for drama
  const breakMat = mline(0x906030);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 0.8 + 3.8;
    const h = 1.5 + Math.random() * 2;
    const rubble = new THREE.CylinderGeometry(0.06, 0.09, h, 4);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(rubble), breakMat)
      .translateX(Math.cos(a) * 7.1)
      .translateY(8 + h / 2)
      .translateZ(Math.sin(a) * 7.1));
  }

  g.scale.set(1.18, 1, 0.82); // elliptical footprint
  g.position.y = -2.5;
  return g;
}

function createFaisalMosque(): THREE.Group {
  const g = new THREE.Group();
  const mfill = (c: number) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const mline = (c: number) => new THREE.LineBasicMaterial({ color: c });

  const BRIGHT = 0xb8d8ff, MID = 0x4880c0, DIM = 0x1a3060;

  // Wide courtyard platform
  const court = new THREE.BoxGeometry(26, 0.35, 16);
  g.add(new THREE.Mesh(court, mfill(0x0a1828)));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(court), mline(DIM)));

  // Raised base for the hall
  const hallBase = new THREE.BoxGeometry(12, 0.6, 10);
  g.add(new THREE.Mesh(hallBase, mfill(0x142040)).translateY(0.47));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(hallBase), mline(MID)).translateY(0.47));

  // === TENT / Diamond prayer hall (signature shape) ===
  const tentGeo = new THREE.ConeGeometry(7, 10, 4);
  tentGeo.rotateY(Math.PI / 4);
  const tent = new THREE.Mesh(tentGeo, mfill(0x2a4878));
  tent.position.set(0, 5.8, 0);
  g.add(tent);
  const tentEdge = new THREE.LineSegments(new THREE.EdgesGeometry(tentGeo), mline(BRIGHT));
  tentEdge.position.copy(tent.position); tentEdge.rotation.y = Math.PI / 4;
  g.add(tentEdge);

  // Interior tent ribs (4 diagonal ridge lines)
  for (let side = 0; side < 4; side++) {
    const a = side * Math.PI / 2 + Math.PI / 4;
    const pts = [
      new THREE.Vector3(0, 10.8, 0),
      new THREE.Vector3(Math.cos(a) * 7, 0.8, Math.sin(a) * 7),
    ];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mline(BRIGHT)));
  }

  // Side arched entrances (3 arches each side)
  for (let side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const archGeo = new THREE.TorusGeometry(0.8, 0.07, 6, 14, Math.PI);
      const am = new THREE.LineSegments(new THREE.EdgesGeometry(archGeo), mline(MID));
      am.position.set(i * 2.5, 1.4, side * 5.2);
      am.rotation.y = side > 0 ? 0 : Math.PI;
      am.rotation.z = Math.PI / 2;
      g.add(am);
      // pillar
      const pillarG = new THREE.CylinderGeometry(0.1, 0.14, 2.0, 6);
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(pillarG), mline(MID))
        .translateX(i * 2.5).translateY(1.0).translateZ(side * 5.2));
    }
  }

  // === 4 Pencil minarets ===
  const mPos = [{ x: -10, z: -5 }, { x: 10, z: -5 }, { x: -10, z: 5 }, { x: 10, z: 5 }];
  for (const mp of mPos) {
    // Main shaft
    const shaft = new THREE.CylinderGeometry(0.17, 0.30, 16, 12);
    g.add(new THREE.Mesh(shaft, mfill(DIM)).translateX(mp.x).translateY(8.17).translateZ(mp.z));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(shaft), mline(BRIGHT)).translateX(mp.x).translateY(8.17).translateZ(mp.z));

    // Balcony rings (3 per minaret)
    for (let b = 0; b < 3; b++) {
      const bal = new THREE.TorusGeometry(0.36, 0.06, 6, 14);
      bal.rotateX(Math.PI / 2);
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(bal), mline(BRIGHT))
        .translateX(mp.x).translateY(3 + b * 4).translateZ(mp.z));
    }

    // Pointed tip
    const tip = new THREE.ConeGeometry(0.22, 4, 12);
    g.add(new THREE.Mesh(tip, mfill(MID)).translateX(mp.x).translateY(18.17).translateZ(mp.z));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(tip), mline(BRIGHT)).translateX(mp.x).translateY(18.17).translateZ(mp.z));

    // Crescent moon
    const crescent = new THREE.TorusGeometry(0.18, 0.035, 6, 10, Math.PI * 1.4);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(crescent), mline(BRIGHT))
      .translateX(mp.x).translateY(20.4).translateZ(mp.z));
  }

  g.position.y = -2;
  return g;
}

function createTowerOfPisa(): THREE.Group {
  const g = new THREE.Group();
  const mfill = (c: number) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const mline = (c: number) => new THREE.LineBasicMaterial({ color: c });

  const BRIGHT = 0xdcc898, MID = 0x9a7848, DIM = 0x5e4a28;

  // Ground base
  const base = new THREE.CylinderGeometry(2.4, 2.6, 0.6, 32);
  g.add(new THREE.Mesh(base, mfill(DIM)));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(base), mline(BRIGHT)));

  // 8 gallery tiers
  const TIERS = 8;
  const GALLERY_COLS = 16;
  for (let t = 0; t < TIERS; t++) {
    const r = 1.9 - t * 0.02;
    const y = 0.7 + t * 2.4;

    // Solid cylinder wall
    const cyl = new THREE.CylinderGeometry(r, r + 0.05, 2.2, 32, 1, true);
    const cm = new THREE.Mesh(cyl, mfill(t % 2 === 0 ? MID : DIM));
    cm.position.y = y; g.add(cm);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(cyl), mline(BRIGHT)).translateY(y));

    // Arch openings
    for (let ci = 0; ci < GALLERY_COLS; ci++) {
      const angle = (ci / GALLERY_COLS) * Math.PI * 2;
      const R = r + 0.06;
      const x = Math.cos(angle) * R, z = Math.sin(angle) * R;

      // Arch column
      const col = new THREE.CylinderGeometry(0.045, 0.055, 1.9, 5);
      const colM = new THREE.LineSegments(new THREE.EdgesGeometry(col), mline(BRIGHT));
      colM.position.set(x, y, z);
      g.add(colM);

      // Arch top
      const aw = (Math.PI * 2 * R / GALLERY_COLS) * 0.36;
      const arch = new THREE.TorusGeometry(aw, 0.04, 4, 8, Math.PI);
      const am = new THREE.LineSegments(new THREE.EdgesGeometry(arch), mline(BRIGHT));
      am.position.set(x, y + 0.95, z);
      am.rotation.y = -angle + Math.PI / 2; am.rotation.z = Math.PI / 2;
      g.add(am);
    }

    // Gallery floor ring
    // const ring = new THREE.TorusGeometry(R => r + 0.06, 0.07, 4, 32);
    // simplified ring
    const ringGeo = new THREE.TorusGeometry(r + 0.06, 0.07, 4, 32);
    ringGeo.rotateX(Math.PI / 2);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(ringGeo), mline(BRIGHT)).translateY(y + 1.1));
  }

  // Belfry (smaller, top)
  const belfryY = 0.7 + TIERS * 2.4;
  const belfry = new THREE.CylinderGeometry(1.3, 1.6, 2.0, 24, 1, true);
  g.add(new THREE.Mesh(belfry, mfill(MID)).translateY(belfryY));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(belfry), mline(BRIGHT)).translateY(belfryY));
  for (let ci = 0; ci < 10; ci++) {
    const angle = (ci / 10) * Math.PI * 2;
    const col = new THREE.CylinderGeometry(0.04, 0.055, 1.8, 5);
    const cm = new THREE.LineSegments(new THREE.EdgesGeometry(col), mline(BRIGHT));
    cm.position.set(Math.cos(angle) * 1.35, belfryY, Math.sin(angle) * 1.35);
    g.add(cm);
  }

  // Conical cap
  const cap = new THREE.ConeGeometry(1.3, 1.2, 24);
  g.add(new THREE.Mesh(cap, mfill(MID)).translateY(belfryY + 1.6));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(cap), mline(BRIGHT)).translateY(belfryY + 1.6));

  // THE LEAN — ~4 degrees
  g.rotation.z = 0.072;
  g.position.y = -2;
  return g;
}

function createStatueOfLiberty(): THREE.Group {
  const g = new THREE.Group();
  const mfill = (c: number) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const mline = (c: number) => new THREE.LineBasicMaterial({ color: c });

  const BRIGHT = 0x78d0b8, MID = 0x3d9880, DIM = 0x1e5540;
  const STONE = 0x484030, STONE_L = 0x686050;

  // Star-fort base
  const fortGeo = new THREE.CylinderGeometry(3.5, 4, 1.2, 8);
  g.add(new THREE.Mesh(fortGeo, mfill(0x282820)));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(fortGeo), mline(STONE_L)));

  // Granite pedestal
  const ped1 = new THREE.BoxGeometry(4.2, 2.5, 4.2);
  g.add(new THREE.Mesh(ped1, mfill(STONE)).translateY(2.45));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(ped1), mline(STONE_L)).translateY(2.45));

  const ped2 = new THREE.BoxGeometry(3.6, 3.0, 3.6);
  g.add(new THREE.Mesh(ped2, mfill(0x3a3028)).translateY(5.2));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(ped2), mline(STONE_L)).translateY(5.2));

  // Pedestal detail bands
  for (let b = 0; b < 4; b++) {
    const band = new THREE.BoxGeometry(4.3, 0.1, 4.3);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(band), mline(STONE_L)).translateY(1.2 + b * 1.4));
  }

  // Statue base / plinth
  const plinth = new THREE.CylinderGeometry(1.5, 2.0, 1.2, 12);
  g.add(new THREE.Mesh(plinth, mfill(DIM)).translateY(7.3));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(plinth), mline(MID)).translateY(7.3));

  // Robe / body
  const body = new THREE.CylinderGeometry(0.85, 1.45, 7.0, 12);
  g.add(new THREE.Mesh(body, mfill(DIM)).translateY(11.4));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(body), mline(MID)).translateY(11.4));

  // Robe drapery folds
  for (let f = 0; f < 6; f++) {
    const a = (f / 6) * Math.PI * 2;
    const pts = [
      new THREE.Vector3(Math.cos(a) * 1.4, 7.9, Math.sin(a) * 1.4),
      new THREE.Vector3(Math.cos(a) * 0.7, 15.0, Math.sin(a) * 0.7),
    ];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mline(DIM)));
  }

  // Left arm holding tablet (down-angled)
  const lArm = new THREE.CylinderGeometry(0.12, 0.16, 3.2, 6);
  const lArmM = new THREE.Mesh(lArm, mfill(DIM));
  lArmM.position.set(-1.2, 11.0, 0); lArmM.rotation.z = 0.55;
  g.add(lArmM);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(lArm), mline(MID)).copy(lArmM));

  // Tablet
  const tablet = new THREE.BoxGeometry(0.45, 1.2, 0.12);
  g.add(new THREE.Mesh(tablet, mfill(MID)).translateX(-1.8).translateY(9.6));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(tablet), mline(BRIGHT)).translateX(-1.8).translateY(9.6));

  // Right arm raised with torch
  const rArm = new THREE.CylinderGeometry(0.10, 0.14, 5.0, 6);
  const rArmM = new THREE.Mesh(rArm, mfill(DIM));
  rArmM.position.set(1.0, 14.0, 0); rArmM.rotation.z = -0.85;
  g.add(rArmM);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(rArm), mline(MID)).copy(rArmM));

  // Torch handle
  const torch = new THREE.CylinderGeometry(0.09, 0.11, 1.4, 6);
  g.add(new THREE.Mesh(torch, mfill(MID)).translateX(3.1).translateY(16.8));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(torch), mline(BRIGHT)).translateX(3.1).translateY(16.8));

  // Flame
  const flame = new THREE.ConeGeometry(0.22, 0.7, 8);
  g.add(new THREE.Mesh(flame, mfill(0xf09020)).translateX(3.1).translateY(17.9));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(flame), mline(0xffe060)).translateX(3.1).translateY(17.9));

  // Head
  const head = new THREE.SphereGeometry(0.52, 14, 10);
  g.add(new THREE.Mesh(head, mfill(DIM)).translateY(15.6));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(head), mline(MID)).translateY(15.6));

  // Crown (7 spikes)
  for (let s = 0; s < 7; s++) {
    const a = (s / 7) * Math.PI * 2;
    const spike = new THREE.ConeGeometry(0.055, 0.9, 4);
    const sm = new THREE.LineSegments(new THREE.EdgesGeometry(spike), mline(BRIGHT));
    sm.position.set(Math.cos(a) * 0.45, 16.1, Math.sin(a) * 0.45);
    sm.rotation.z = Math.cos(a) * 0.45;
    sm.rotation.x = Math.sin(a) * 0.45;
    g.add(sm);
  }
  // Crown band
  const crownBand = new THREE.TorusGeometry(0.52, 0.07, 6, 14);
  crownBand.rotateX(Math.PI / 2);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(crownBand), mline(BRIGHT)).translateY(15.85));

  g.position.y = -3.5;
  return g;
}

// ─── Building config ──────────────────────────────────────────
const BUILDINGS = [
  { name: "Colosseum", factory: createColosseum, camDist: 22, camY: 5, palette: PALETTES[0] },
  { name: "Faisal Mosque", factory: createFaisalMosque, camDist: 32, camY: 8, palette: PALETTES[1] },
  { name: "Tower of Pisa", factory: createTowerOfPisa, camDist: 20, camY: 7, palette: PALETTES[2] },
  { name: "Statue of Liberty", factory: createStatueOfLiberty, camDist: 28, camY: 9, palette: PALETTES[3] },
];

const CYCLE = 5.0;   // total seconds per monument
const BUILD_TIME = 2.2;   // build-from-bottom duration
const FADE_TIME = 1.0;   // fade-out at end

export default function ASCIIBuilding3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLPreElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measure font metrics
    const probe = document.createElement("pre");
    probe.style.cssText = "position:absolute;visibility:hidden;font-family:'Roboto Mono','Courier New',monospace;font-size:9px;line-height:1.0;white-space:pre;margin:0;padding:0;";
    probe.textContent = "X";
    document.body.appendChild(probe);
    const CW = probe.getBoundingClientRect().width || 5.4;
    const CH = probe.getBoundingClientRect().height || 9.0;
    document.body.removeChild(probe);

    const cols = Math.ceil(window.innerWidth / CW) + 4;
    const rows = Math.ceil(window.innerHeight / CH) + 4;

    // Pre-generate stable per-cell seed characters
    const seeds = getSeedChars(rows * cols);

    // Offscreen WebGL canvas
    const canvas = document.createElement("canvas");
    const CELL_W = 4, CELL_H = 6;
    canvas.width = cols * CELL_W;
    canvas.height = rows * CELL_H;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor(0x080808, 1);

    const camera = new THREE.PerspectiveCamera(38, canvas.width / canvas.height, 0.1, 200);

    // Scene
    const scene = new THREE.Scene();

    // Ground grid
    const gridMat = new THREE.LineBasicMaterial({ color: 0x141414 });
    for (let i = -14; i <= 14; i++) {
      const h = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-14, -3, i), new THREE.Vector3(14, -3, i)]);
      const v = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -3, -14), new THREE.Vector3(i, -3, 14)]);
      scene.add(new THREE.Line(h, gridMat));
      scene.add(new THREE.Line(v, gridMat));
    }

    // Initialize first building
    let buildIdx = 0;
    let currentGroup = BUILDINGS[0].factory();
    currentGroup.scale.set(1, 0.001, 1);
    scene.add(currentGroup);

    // Mouse parallax
    const target = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    // Brightness buffer
    const prevBright = new Float32Array(rows * cols);
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    const gl = renderer.getContext();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIn = (t: number) => t * t * t;

    const startTime = performance.now();
    let lastRender = 0;
    const INTERVAL = 1000 / 36;

    const animate = (now: number) => {
      frameRef.current = requestAnimationFrame(animate);
      if (now - lastRender < INTERVAL) return;
      lastRender = now;

      const elapsed = (now - startTime) * 0.001;
      const cycleTime = elapsed % CYCLE;

      smooth.x += (target.x - smooth.x) * 0.025;
      smooth.y += (target.y - smooth.y) * 0.025;

      // Build / display / fade phases
      let scaleY = 1.0;
      let opacity = 1.0;
      let revealRow = 0; // grid rows from top that are still "hidden" (dark)

      if (cycleTime < BUILD_TIME) {
        const t = easeOut(cycleTime / BUILD_TIME);
        scaleY = t;
        opacity = Math.min(1, t * 1.5);
        revealRow = Math.floor((1 - t) * rows);
      } else if (cycleTime > CYCLE - FADE_TIME) {
        const t = (cycleTime - (CYCLE - FADE_TIME)) / FADE_TIME;
        scaleY = 1 - easeIn(t);
        opacity = 1 - t;
      }

      currentGroup.scale.set(1, Math.max(0.001, scaleY), 1);

      // Cycle to next building
      if (cycleTime < 0.05 && elapsed > 0.5) {
        scene.remove(currentGroup);
        buildIdx = (buildIdx + 1) % BUILDINGS.length;
        currentGroup = BUILDINGS[buildIdx].factory();
        currentGroup.scale.set(1, 0.001, 1);
        scene.add(currentGroup);
        prevBright.fill(0);
      }

      // Camera orbit
      const bd = BUILDINGS[buildIdx];
      const angle = elapsed * 0.06 + smooth.x * 0.15;
      camera.position.set(
        Math.cos(angle) * bd.camDist,
        bd.camY + smooth.y * -1.5,
        Math.sin(angle) * bd.camDist
      );
      camera.lookAt(0, 2, 0);

      renderer.render(scene, camera);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // --- ASCII ---
      if (!asciiRef.current) return;
      const palette = bd.palette;
      const parts: string[] = [];

      for (let row = rows - 1; row >= 0; row--) {
        const gridRow = rows - 1 - row;
        const isHidden = gridRow < revealRow;

        for (let col = 0; col < cols; col++) {
          const px = col * CELL_W + (CELL_W >> 1);
          const py = row * CELL_H + (CELL_H >> 1);
          const pidx = (py * canvas.width + px) << 2;

          const rawB = (pixels[pidx] * 77 + pixels[pidx + 1] * 150 + pixels[pidx + 2] * 29) >> 8;
          const bi = gridRow * cols + col;
          const lerp = isHidden ? 0.05 : 0.32;
          const smo = prevBright[bi] + (rawB - prevBright[bi]) * lerp;
          prevBright[bi] = smo;

          const b = ((smo * opacity) | 0) * (isHidden ? 0.15 : 1);
          const seed = seeds[bi];
          const char = densityChar(b | 0, seed);
          const clr = getPaletteColor(b | 0, palette);

          parts.push(`<span style="color:${clr}">${char === '<' ? '&lt;' : char === '&' ? '&amp;' : char || ' '}</span>`);
        }
        parts.push('\n');
      }

      asciiRef.current.innerHTML = parts.join('');
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMouse);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <pre className={styles.ascii} ref={asciiRef} aria-hidden="true" />
    </div>
  );
}
