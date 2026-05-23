"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import styles from "./page.module.css";
import Architectural3DView from "./Architectural3DView";

// ─── Types ──────────────────────────────────────────────

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

type Tool = "select" | "pan" | "wall" | "line" | "eraser";

// ─── Asset Library ──────────────────────────────────────

const ASSET_CATEGORIES = ["Rooms", "Doors", "Furniture", "Kitchen", "Bathroom", "Outdoor"];

const ASSETS: AssetDef[] = [
  // Rooms
  { id: "living", name: "Living Room", category: "Rooms", icon: "▢", w: 6, h: 5, color: "rgba(100,180,255,0.12)" },
  { id: "bedroom", name: "Bedroom", category: "Rooms", icon: "▢", w: 5, h: 4, color: "rgba(120,200,120,0.12)" },
  { id: "kitchen", name: "Kitchen", category: "Rooms", icon: "▢", w: 4, h: 3, color: "rgba(255,200,80,0.12)" },
  { id: "bathroom", name: "Bathroom", category: "Rooms", icon: "▢", w: 3, h: 3, color: "rgba(80,180,220,0.12)" },
  { id: "dining", name: "Dining Room", category: "Rooms", icon: "▢", w: 4, h: 4, color: "rgba(200,150,100,0.12)" },
  { id: "garage", name: "Garage", category: "Rooms", icon: "▢", w: 5, h: 5, color: "rgba(150,150,150,0.12)" },
  // Doors
  { id: "door-single", name: "Single Door", category: "Doors", icon: "🚪", w: 1, h: 0.5, color: "rgba(180,140,100,0.3)" },
  { id: "door-double", name: "Double Door", category: "Doors", icon: "🚪", w: 2, h: 0.5, color: "rgba(180,140,100,0.3)" },
  // Furniture
  { id: "sofa", name: "Sofa", category: "Furniture", icon: "🛋", w: 3, h: 1, color: "rgba(100,80,60,0.25)" },
  { id: "bed-double", name: "Double Bed", category: "Furniture", icon: "🛏", w: 3, h: 3, color: "rgba(180,160,140,0.2)" },
  { id: "table-dining", name: "Dining Table", category: "Furniture", icon: "◯", w: 2, h: 3, color: "rgba(140,110,80,0.25)" },
  // Kitchen
  { id: "island", name: "Island", category: "Kitchen", icon: "▬", w: 2, h: 2, color: "rgba(170,170,170,0.2)" },
  // Bathroom
  { id: "bathtub", name: "Bathtub", category: "Bathroom", icon: "⊏", w: 1, h: 3, color: "rgba(180,210,230,0.2)" },
  // Outdoor
  { id: "tree", name: "Tree", category: "Outdoor", icon: "🌳", w: 2, h: 2, color: "rgba(60,140,60,0.2)" },
];

const GRID = 40; // px per grid unit
const CANVAS_W = 60;
const CANVAS_H = 40;

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Core CAD State
  const [placed, setPlaced] = useState<PlacedAsset[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 80, y: 80 });

  // UI State
  const [activeTab, setActiveTab] = useState("Home");
  const [activeCategory, setActiveCategory] = useState("Rooms");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // CAD Coordinates

  // Command Line State
  const [cmdInput, setCmdInput] = useState("");
  const [cliHistory, setCliHistory] = useState<string[]>(["Archon LT 2026 loaded.", "Type a command or drop a block."]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ uid: string; offsetX: number; offsetY: number } | null>(null);
  const dropPreviewRef = useRef<{ x: number; y: number; def: AssetDef } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const rafRef = useRef(0);

  // ─── Command Line Interpreter ────────────────────────────
  const executeCommand = () => {
    if (!cmdInput.trim()) return;
    const cmd = cmdInput.trim().toUpperCase();
    setCliHistory(prev => [...prev.slice(-10), `Command: ${cmd}`]);
    
    if (cmd === "L" || cmd === "LINE") setTool("line");
    else if (cmd === "E" || cmd === "ERASE") setTool("eraser");
    else if (cmd === "P" || cmd === "PAN") setTool("pan");
    else if (cmd === "3D") setViewMode("3D");
    else if (cmd === "2D") setViewMode("2D");
    else if (cmd === "AI" || cmd === "GENERATE") {
       setCliHistory(prev => [...prev, "AI: Generating layout...", "AI: Layout generated."]);
    }
    else {
      setCliHistory(prev => [...prev, `Unknown command "${cmd}". Press F1 for help.`]);
    }
    setCmdInput("");
  };

  // ─── Canvas rendering ─────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const ox = panOffset.x;
    const oy = panOffset.y;
    const g = GRID * zoom;

    // Deep AutoCAD Black Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    // Minor Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    const startX = (ox % g + g) % g;
    const startY = (oy % g + g) % g;
    for (let x = startX; x < w; x += g) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = startY; y < h; y += g) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Major Grid
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.5;
    const g5 = g * 5;
    const startX5 = (ox % g5 + g5) % g5;
    const startY5 = (oy % g5 + g5) % g5;
    for (let x = startX5; x < w; x += g5) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = startY5; y < h; y += g5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw placed assets
    for (const asset of placed) {
      const def = ASSETS.find(a => a.id === asset.defId);
      if (!def) continue;

      const ax = asset.x * g + ox;
      const ay = asset.y * g + oy;
      const aw = asset.w * g;
      const ah = asset.h * g;
      const isSel = asset.uid === selected;

      // Fill
      ctx.fillStyle = def.color;
      ctx.fillRect(ax, ay, aw, ah);

      // Border (AutoCAD Line Weight Style)
      ctx.strokeStyle = isSel ? "#50b4f8" : "rgba(255,255,255,0.6)";
      ctx.lineWidth = isSel ? 2 : 1.5;
      ctx.strokeRect(ax, ay, aw, ah);

      // AutoCAD Grips
      if (isSel) {
        ctx.fillStyle = "#50b4f8";
        const hs = 6;
        const corners = [[ax, ay], [ax + aw, ay], [ax, ay + ah], [ax + aw, ay + ah]];
        for (const [cx, cy] of corners) {
          ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
        }
      }

      // Label & Dim
      ctx.fillStyle = isSel ? "#50b4f8" : "rgba(255,255,255,0.7)";
      ctx.font = `${Math.max(9, 11 * zoom)}px 'Courier New', monospace`; // CAD Font
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(asset.label, ax + aw / 2, ay + ah / 2);
    }

    // Drop preview
    if (dropPreviewRef.current) {
      const { x, y, def } = dropPreviewRef.current;
      const px = x * g + ox;
      const py = y * g + oy;
      const pw = def.w * g;
      const ph = def.h * g;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "#50b4f8";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
      ctx.fillStyle = "#50b4f8";
      ctx.font = `${11 * zoom}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.name, px + pw / 2, py + ph / 2);
    }

    // Origin Cross (UCS Icon)
    const originX = ox;
    const originY = oy;
    ctx.strokeStyle = "#44ff44"; // Y-axis Green
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(originX, originY - 40); ctx.stroke();
    ctx.strokeStyle = "#ff4444"; // X-axis Red
    ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(originX + 40, originY); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif";
    ctx.fillText("X", originX + 45, originY + 4);
    ctx.fillText("Y", originX - 4, originY - 45);

  }, [placed, selected, zoom, panOffset]);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // ─── Helpers ─────────────────────────────────────────

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { gx: 0, gy: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const g = GRID * zoom;
    const gx = Math.round((sx - panOffset.x) / g * 2) / 2;
    const gy = Math.round((sy - panOffset.y) / g * 2) / 2;
    return { gx, gy };
  }, [zoom, panOffset]);

  const hitTest = useCallback((gx: number, gy: number): PlacedAsset | null => {
    for (let i = placed.length - 1; i >= 0; i--) {
      const a = placed[i];
      if (gx >= a.x && gx <= a.x + a.w && gy >= a.y && gy <= a.y + a.h) return a;
    }
    return null;
  }, [placed]);

  // ─── Mouse Handlers ────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan" || e.button === 1 || e.button === 2) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
      return;
    }

    const { gx, gy } = screenToGrid(e.clientX, e.clientY);

    if (tool === "select") {
      const hit = hitTest(gx, gy);
      if (hit) {
        setSelected(hit.uid);
        dragRef.current = { uid: hit.uid, offsetX: gx - hit.x, offsetY: gy - hit.y };
      } else {
        setSelected(null);
      }
    }

    if (tool === "eraser") {
      const hit = hitTest(gx, gy);
      if (hit) {
        setPlaced(prev => prev.filter(a => a.uid !== hit.uid));
        setSelected(null);
        setCliHistory(prev => [...prev, "1 object(s) erased."]);
      }
    }
  }, [tool, panOffset, screenToGrid, hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { gx, gy } = screenToGrid(e.clientX, e.clientY);
    setMousePos({ x: gx, y: gy }); // Live coordinates

    if (isPanningRef.current) {
      setPanOffset({
        x: panStartRef.current.ox + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.oy + (e.clientY - panStartRef.current.y),
      });
      return;
    }

    if (dragRef.current && tool === "select") {
      const { uid, offsetX, offsetY } = dragRef.current;
      setPlaced(prev => prev.map(a =>
        a.uid === uid ? { ...a, x: Math.round((gx - offsetX) * 2) / 2, y: Math.round((gy - offsetY) * 2) / 2 } : a
      ));
    }
  }, [tool, screenToGrid, panOffset]);

  const handleMouseUp = useCallback(() => { dragRef.current = null; isPanningRef.current = false; }, []);
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(4, z + delta)));
  }, []);

  // ─── Drag and Drop (Blocks Palette) ─────────────────────

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const { gx, gy } = screenToGrid(e.clientX, e.clientY);
    if (dropPreviewRef.current?.def) {
      dropPreviewRef.current.x = Math.round(gx * 2) / 2;
      dropPreviewRef.current.y = Math.round(gy * 2) / 2;
    }
  }, [screenToGrid]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const defId = e.dataTransfer.getData("assetid");
    const def = ASSETS.find(a => a.id === defId);
    if (!def) return;
    const { gx, gy } = screenToGrid(e.clientX, e.clientY);
    const newAsset: PlacedAsset = {
      uid: `${defId}-${Date.now()}`,
      defId: def.id,
      x: Math.round((gx - def.w / 2) * 2) / 2,
      y: Math.round((gy - def.h / 2) * 2) / 2,
      w: def.w, h: def.h, rotation: 0, label: def.name,
    };
    setPlaced(prev => [...prev, newAsset]);
    setSelected(newAsset.uid);
    setCliHistory(prev => [...prev, `Block inserted: ${def.name}`]);
    dropPreviewRef.current = null;
  }, [screenToGrid]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Delete" && selected) {
        setPlaced(p => p.filter(a => a.uid !== selected));
        setSelected(null);
      }
      if (e.key === "Escape") { setSelected(null); setTool("select"); }
      if (e.key === "l") { setTool("line"); setCliHistory(p => [...p, "Command: LINE"]); }
      if (e.key === "e") { setTool("eraser"); setCliHistory(p => [...p, "Command: ERASE"]); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected]);

  const selectedAsset = placed.find(a => a.uid === selected);
  const selectedDef = selectedAsset ? ASSETS.find(a => a.id === selectedAsset.defId) : null;

  // ─── Layout ───────────────────────────────────────────

  return (
    <div className={styles.workspace}>
      {/* ── TOP: RIBBON MENU ── */}
      <header className={styles.ribbon}>
        <div className={styles.ribbonTop}>
          <div className={styles.ribbonLogo}>A</div>
          <div className={styles.ribbonTabs}>
            {["Home", "Insert", "Annotate", "View", "Manage"].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? styles.ribbonTabActive : styles.ribbonTab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.projectInfo}>Project #{id} - Autodesk AutoCAD 2026 Compatible</div>
        </div>

        <div className={styles.ribbonPanels}>
          <div className={styles.ribbonPanel}>
            <div className={styles.panelTools}>
              <button className={`${styles.ribbonBtn} ${tool === 'line' ? styles.active : ''}`} onClick={() => setTool("line")}>
                <span className={styles.rbIcon}>╱</span> <span style={{fontSize: '9px'}}>Line</span>
              </button>
              <button className={`${styles.ribbonBtn} ${tool === 'wall' ? styles.active : ''}`} onClick={() => setTool("wall")}>
                <span className={styles.rbIcon}>‖</span> <span style={{fontSize: '9px'}}>Wall</span>
              </button>
            </div>
            <div className={styles.panelLabel}>Draw</div>
          </div>
          
          <div className={styles.ribbonPanel}>
            <div className={styles.panelTools}>
              <button className={`${styles.ribbonBtn}`} onClick={() => {}}>
                <span className={styles.rbIcon}>◱</span> <span style={{fontSize: '9px'}}>Move</span>
              </button>
              <button className={`${styles.ribbonBtn} ${tool === 'eraser' ? styles.active : ''}`} onClick={() => setTool("eraser")}>
                <span className={styles.rbIcon}>⌫</span> <span style={{fontSize: '9px'}}>Erase</span>
              </button>
            </div>
            <div className={styles.panelLabel}>Modify</div>
          </div>

          <div className={styles.ribbonPanel}>
            <div className={styles.panelTools}>
              <button className={`${styles.ribbonBtn} ${tool === 'select' ? styles.active : ''}`} onClick={() => setTool("select")}>
                <span className={styles.rbIcon}>↗</span> <span style={{fontSize: '9px'}}>Select</span>
              </button>
              <button className={`${styles.ribbonBtn} ${tool === 'pan' ? styles.active : ''}`} onClick={() => setTool("pan")}>
                <span className={styles.rbIcon}>🤚</span> <span style={{fontSize: '9px'}}>Pan</span>
              </button>
              <button className={`${styles.ribbonBtn} ${viewMode === '3D' ? styles.active : ''}`} onClick={() => setViewMode(v => v === "2D" ? "3D" : "2D")}>
                <span className={styles.rbIcon}>🧊</span> <span style={{fontSize: '9px'}}>3D View</span>
              </button>
            </div>
            <div className={styles.panelLabel}>Navigate & View</div>
          </div>
        </div>
      </header>

      <div className={styles.editorArea}>
        {/* ── LEFT: BLOCKS PALETTE ── */}
        <aside className={styles.palette}>
          <div className={styles.paletteHeader}>Tool Palettes - All Palettes</div>
          <div className={styles.paletteBody}>
            <div className={styles.catTabs}>
              {ASSET_CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className={styles.blockGrid}>
              {ASSETS.filter(a => a.category === activeCategory).map(def => (
                <div 
                  key={def.id} 
                  className={styles.blockCard}
                  draggable 
                  onDragStart={(e) => { e.dataTransfer.setData("assetid", def.id); dropPreviewRef.current = {x:0,y:0,def}; }}
                >
                  <div className={styles.blockIcon} style={{color: def.color}}>{def.icon}</div>
                  <div className={styles.blockName}>{def.name}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER: CANVAS ── */}
        <main className={styles.canvasMain}>
          <div className={styles.canvasWrap} ref={containerRef}>
            {viewMode === "2D" ? (
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                style={{ cursor: tool === "select" ? "default" : tool === "pan" ? "grab" : "crosshair" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
                onContextMenu={e => e.preventDefault()} // Right click pans
              />
            ) : (
              <Architectural3DView placed={placed} assets={ASSETS} grid={GRID} />
            )}
          </div>
        </main>

        {/* ── RIGHT: PROPERTIES PALETTE ── */}
        <aside className={styles.palette}>
          <div className={styles.paletteHeader}>Properties</div>
          <div className={styles.paletteBody}>
            {selectedAsset && selectedDef ? (
              <>
                <div className={styles.propGroup}>
                  <div className={styles.propGroupName}>General</div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Color</span>
                    <span className={styles.propVal} style={{color: selectedDef.color}}>ByLayer</span>
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Layer</span>
                    <span className={styles.propVal}>A-BLCK</span>
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Block Name</span>
                    <input className={styles.propVal} value={selectedAsset.label} onChange={(e) => setPlaced(p => p.map(a => a.uid === selected ? {...a, label: e.target.value} : a))} />
                  </div>
                </div>
                <div className={styles.propGroup}>
                  <div className={styles.propGroupName}>Geometry</div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Position X</span>
                    <input className={styles.propVal} type="number" step="0.5" value={selectedAsset.x} onChange={(e) => setPlaced(p => p.map(a => a.uid === selected ? {...a, x: Number(e.target.value)} : a))} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Position Y</span>
                    <input className={styles.propVal} type="number" step="0.5" value={selectedAsset.y} onChange={(e) => setPlaced(p => p.map(a => a.uid === selected ? {...a, y: Number(e.target.value)} : a))} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Scale X</span>
                    <input className={styles.propVal} type="number" step="0.5" value={selectedAsset.w} onChange={(e) => setPlaced(p => p.map(a => a.uid === selected ? {...a, w: Number(e.target.value)} : a))} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Scale Y</span>
                    <input className={styles.propVal} type="number" step="0.5" value={selectedAsset.h} onChange={(e) => setPlaced(p => p.map(a => a.uid === selected ? {...a, h: Number(e.target.value)} : a))} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Rotation</span>
                    <span className={styles.propVal}>{selectedAsset.rotation}°</span>
                  </div>
                </div>
                <div style={{marginTop: 16}}>
                  <button className={styles.propAction} onClick={() => setPlaced(p => p.map(a => a.uid === selected ? { ...a, w: a.h, h: a.w, rotation: (a.rotation + 90) % 360 } : a))}>Rotate 90°</button>
                  <button className={styles.propAction} onClick={() => setPlaced(p => p.filter(a => a.uid !== selected))}>Delete</button>
                </div>
              </>
            ) : (
              <div style={{fontSize: 10, color: '#888', padding: 8}}>No selection</div>
            )}
          </div>
        </aside>
      </div>

      {/* ── BOTTOM: COMMAND LINE ── */}
      <footer className={styles.commandLine}>
        <div className={styles.cliHistory}>
          {cliHistory.map((line, i) => <div key={i} className={styles.cliRow}>{line}</div>)}
        </div>
        <div className={styles.cliRow}>
          <span className={styles.cliPrompt}>Command:</span>
          <input 
            className={styles.cliInput} 
            value={cmdInput} 
            onChange={e => setCmdInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && executeCommand()}
          />
        </div>
        <div className={styles.statusBar}>
          <span style={{width: 150}}>{mousePos.x.toFixed(4)}, {mousePos.y.toFixed(4)}, 0.0000</span>
          <button className={`${styles.statusBtn} ${styles.on}`}>MODEL</button>
          <button className={styles.statusBtn}>GRID</button>
          <button className={`${styles.statusBtn} ${styles.on}`}>SNAP</button>
          <button className={styles.statusBtn}>ORTHO</button>
          <span style={{marginLeft: 'auto'}}>1:100</span>
        </div>
      </footer>
    </div>
  );
}
