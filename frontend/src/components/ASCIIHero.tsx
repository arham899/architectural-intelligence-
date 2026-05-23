"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "./ASCIIHero.module.css";

const ASCII_CHARS = " .:-=+*#%@█▓▒░";
const BUILDING_TEMPLATE = [
  "                    ╔══════════════════╗                    ",
  "                    ║  ┌──┐  ┌──┐  ┌──┐║                    ",
  "                    ║  │▓▓│  │▓▓│  │▓▓│║                    ",
  "                    ║  └──┘  └──┘  └──┘║                    ",
  "                ╔═══╬══════════════════╬═══╗                ",
  "                ║   ║  ┌──┐  ┌──┐  ┌──┐║   ║                ",
  "                ║   ║  │▒▒│  │▒▒│  │▒▒│║   ║                ",
  "                ║   ║  └──┘  └──┘  └──┘║   ║                ",
  "            ╔═══╬═══╬══════════════════╬═══╬═══╗            ",
  "            ║   ║   ║  ┌──┐  ┌──┐  ┌──┐║   ║   ║            ",
  "            ║   ║   ║  │░░│  │░░│  │░░│║   ║   ║            ",
  "            ║   ║   ║  └──┘  └──┘  └──┘║   ║   ║            ",
  "        ╔═══╬═══╬═══╬══════════════════╬═══╬═══╬═══╗        ",
  "        ║   ║   ║   ║  ┌──┐  ┌──┐  ┌──┐║   ║   ║   ║        ",
  "        ║   ║   ║   ║  │██│  │██│  │██│║   ║   ║   ║        ",
  "        ║   ║   ║   ║  └──┘  └──┘  └──┘║   ║   ║   ║        ",
  "    ╔═══╬═══╬═══╬═══╬══════════════════╬═══╬═══╬═══╬═══╗    ",
  "    ║   ║   ║   ║   ║  ┌──┐  ┌──┐  ┌──┐║   ║   ║   ║   ║    ",
  "    ║   ║   ║   ║   ║  │▓▓│  │▓▓│  │▓▓│║   ║   ║   ║   ║    ",
  "    ║   ║   ║   ║   ║  └──┘  └──┘  └──┘║   ║   ║   ║   ║    ",
  "╔═══╬═══╬═══╬═══╬═══╬══════════════════╬═══╬═══╬═══╬═══╬═══╗",
  "║   ║   ║   ║   ║   ║  ┌──┐  ┌──┐  ┌──┐║   ║   ║   ║   ║   ║",
  "║   ║   ║   ║   ║   ║  │▒▒│  │▒▒│  │▒▒│║   ║   ║   ║   ║   ║",
  "║   ║   ║   ║   ║   ║  └──┘  └──┘  └──┘║   ║   ║   ║   ║   ║",
  "║   ║   ║   ║   ║   ║      ╔════╗      ║   ║   ║   ║   ║   ║",
  "║   ║   ║   ║   ║   ║      ║DOOR║      ║   ║   ║   ║   ║   ║",
  "╚═══╩═══╩═══╩═══╩═══╩══════╩════╩══════╩═══╩═══╩═══╩═══╩═══╝",
  "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀",
];

export default function ASCIIHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const animate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const time = Date.now() * 0.001;
    const lines = container.querySelectorAll<HTMLElement>("[data-line]");

    lines.forEach((line, i) => {
      const chars = line.querySelectorAll<HTMLElement>("span");
      chars.forEach((charEl, j) => {
        const original = charEl.getAttribute("data-char") || " ";
        // Random flicker on structural chars
        if (original !== " " && Math.random() < 0.02) {
          const randomChar = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
          charEl.textContent = randomChar;
          charEl.style.opacity = (0.3 + Math.random() * 0.7).toString();
          setTimeout(() => {
            charEl.textContent = original;
            charEl.style.opacity = "";
          }, 100 + Math.random() * 200);
        }

        // Subtle wave opacity
        const wave = Math.sin(time * 2 + i * 0.15 + j * 0.05) * 0.15 + 0.85;
        if (original !== " ") {
          charEl.style.opacity = wave.toString();
        }
      });
    });

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  return (
    <div className={styles.container}>
      <div className={styles.asciiArt} ref={containerRef}>
        {BUILDING_TEMPLATE.map((line, i) => (
          <div key={i} data-line={i} className={styles.line}>
            {line.split("").map((char, j) => (
              <span
                key={j}
                data-char={char}
                className={
                  char === "█" || char === "▓" || char === "▒" || char === "░"
                    ? styles.charBright
                    : char === "╔" || char === "╗" || char === "╚" || char === "╝" || 
                      char === "═" || char === "║" || char === "╬" || char === "╩" || char === "╦"
                    ? styles.charStructure
                    : char === "┌" || char === "┐" || char === "└" || char === "┘" || char === "│" || char === "─"
                    ? styles.charWindow
                    : char === "▀"
                    ? styles.charGround
                    : styles.charDefault
                }
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>
      {/* Chiaroscuro glow */}
      <div className={styles.glow} />
    </div>
  );
}
