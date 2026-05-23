"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

function useTypewriter(text: string, speed: number = 50, delay: number = 0, start: boolean = false) {
  const [displayedText, setDisplayedText] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!start) return;
    let timeout: any;
    let i = 0;

    const type = () => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        timeout = setTimeout(type, speed);
      } else {
        setComplete(true);
      }
    };

    const initialDelay = setTimeout(type, delay);
    return () => {
      clearTimeout(timeout);
      clearTimeout(initialDelay);
    };
  }, [text, speed, delay, start]);

  return { displayedText, complete };
}

const CrosshairCursor = dynamic(() => import("@/components/CrosshairCursor"), { ssr: false });
const LoadingScreen = dynamic(() => import("@/components/LoadingScreen"), { ssr: false });
const ArchitectureScene3D = dynamic(() => import("@/components/ArchitectureScene3D"), { ssr: false });

const FEATURES = [
  {
    icon: "⌘",
    title: "Prompt-to-Plan",
    desc: "Describe your home. AI generates a structured, constraint-checked floor plan instantly.",
  },
  {
    icon: "◫",
    title: "2D Editor",
    desc: "Interactive canvas with drag, resize, snap-to-grid. CAD-like precision in the browser.",
  },
  {
    icon: "⬡",
    title: "3D Preview",
    desc: "One-click extrusion to walkable 3D scenes. Orbit, zoom, inspect from every angle.",
  },
  {
    icon: "⊞",
    title: "Asset Library",
    desc: "Drag-and-drop furniture, doors, windows from a curated glTF collection.",
  },
  {
    icon: "◈",
    title: "AI Edits",
    desc: '"Make the kitchen larger." Iterative natural-language refinements on your plan.',
  },
  {
    icon: "⬢",
    title: "Geometry Engine",
    desc: "Rules-based validation for walls, adjacency, openings, and collision-free layouts.",
  },
];

const WORKFLOW = [
  { num: "01", title: "Describe", desc: "Type requirements in plain English." },
  { num: "02", title: "Generate", desc: "AI produces a valid, constraint-checked plan." },
  { num: "03", title: "Refine", desc: "Edit on canvas or ask AI for changes." },
  { num: "04", title: "Visualize", desc: "Switch to 3D, place assets, explore." },
];

export default function LandingPage() {
  const [loaded, setLoaded] = useState(false);
  const { displayedText: title1, complete: t1Complete } = useTypewriter("Architectural", 60, 500, loaded);
  const { displayedText: title2, complete: t2Complete } = useTypewriter("Intelligence.", 60, 1500, loaded);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      <div className={styles.page} style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.8s ease" }}>
        <CrosshairCursor />

        {/* ======== NAVBAR — fixed, always on top ======== */}
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#workflow" className={styles.navLink}>Workflow</a>
          </div>
          <a href="/" className={styles.navLogo}>
            <span className={styles.navTriangle}>▽</span>
            <span className={styles.navBrand}>ARCHON</span>
          </a>
          <div className={styles.navRight}>
            <a href="/login" className={styles.navLink}>Log In</a>
            <a href="/dashboard" className={styles.navCta}>Get Started</a>
          </div>
        </nav>
        {/* ======== HERO — Full viewport with high-fidelity 3D Blueprint scene ======== */}
        <section className={styles.hero}>
          <ArchitectureScene3D />

          {/* Hero content overlay — Left Aligned Editorial Layout */}
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <p className={styles.heroLabel}>AI ARCHITECT STUDIO // v2.0</p>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroCursive}>Evolutionary</span>
                <span className={styles.heroPixel}>{title1}</span>
                <span className={`${styles.heroAccent} ${styles.heroPixel}`}>
                  {title2}
                  {t1Complete && !t2Complete && <span className={styles.typeCursor}>_</span>}
                </span>
              </h1>
              <p className={`${styles.heroSub} ${t2Complete ? styles.subVisible : ""}`}>
                Converting natural language into generative blueprints and walkable 3D environments.
              </p>
              <div className={`${styles.heroActions} ${t2Complete ? styles.actionsVisible : ""}`}>
                <a href="/dashboard" className={styles.heroPrimary}>Open Studio</a>
                <a href="#features" className={styles.heroSecondary}>Learn More</a>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className={styles.scrollCue}>
            <span className={styles.scrollText}>SCROLL</span>
            <div className={styles.scrollLine} />
          </div>
        </section>

        {/* ======== FEATURES ======== */}
        <section id="features" className={styles.features}>
          <video
            className={styles.sectionBgVideo}
            src="/archon-logo.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>// capabilities</span>
            <h2 className={styles.sectionTitle}>
              Concept to 3D model,<br />in one workflow
            </h2>
          </div>
          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featCard}>
                <span className={styles.featIcon}>{f.icon}</span>
                <h3 className={styles.featName}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======== WORKFLOW ======== */}
        <section id="workflow" className={styles.workflow}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>// process</span>
            <h2 className={styles.sectionTitle}>Four steps to a building</h2>
          </div>
          <div className={styles.steps}>
            {WORKFLOW.map((s, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNum}>{s.num}</span>
                <h3 className={styles.stepName}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======== CTA ======== */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to architect?</h2>
          <p className={styles.ctaSub}>
            Start designing with AI-powered precision.
          </p>
          <a href="/dashboard" className={styles.heroPrimary}>
            Open ARCHON Studio →
          </a>
        </section>

        {/* ======== FOOTER ======== */}
        <footer className={styles.footer}>
          <span className={styles.footerBrand}>© 2026 ARCHON</span>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>GitHub</a>
            <a href="#" className={styles.footerLink}>Docs</a>
          </div>
        </footer>
      </div>
    </>
  );
}
