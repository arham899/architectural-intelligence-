"use client";

import { useEffect, useRef } from "react";

export default function CrosshairCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const coord = coordRef.current;
    if (!dot || !ring || !coord) return;

    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const tick = () => {
      // Dot follows instantly
      dot.style.transform = `translate(${mx}px, ${my}px)`;

      // Ring follows with smooth lag
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;

      coord.style.transform = `translate(${mx + 18}px, ${my + 18}px)`;
      coord.textContent = `x:${Math.round(mx)} y:${Math.round(my)}`;

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        body { cursor: none !important; }
        a, button, [role="button"], input, textarea, select { cursor: none !important; }
      `}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999 }}>
        {/* Dot */}
        <div
          ref={dotRef}
          style={{
            position: "absolute",
            top: -3,
            left: -3,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent-blue-light)",
            boxShadow: "0 0 8px rgba(26,111,239,0.5)",
            willChange: "transform",
          }}
        />
        {/* Ring */}
        <div
          ref={ringRef}
          style={{
            position: "absolute",
            top: -14,
            left: -14,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid rgba(0,71,171,0.35)",
            willChange: "transform",
          }}
        />
        {/* Coords */}
        <div
          ref={coordRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
            opacity: 0.5,
            whiteSpace: "nowrap",
            willChange: "transform",
          }}
        />
      </div>
    </>
  );
}
