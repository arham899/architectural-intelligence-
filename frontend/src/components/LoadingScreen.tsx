"use client";

import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [showContent, setShowContent] = useState(false);

  // Fade in content
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Simulated loading
  useEffect(() => {
    const statuses = [
      { at: 10, msg: "LOADING MODULES" },
      { at: 25, msg: "INIT GEOMETRY ENGINE" },
      { at: 45, msg: "CONNECTING AI SERVICE" },
      { at: 65, msg: "PREPARING WORKSPACE" },
      { at: 85, msg: "RENDERING ENVIRONMENT" },
      { at: 98, msg: "READY" },
    ];

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 6 + 3, 100);
        const s = statuses.find((s) => s.at <= next && s.at > p);
        if (s) setStatus(s.msg);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={styles.container}>
      {/* Background video */}
      <video
        className={styles.bgVideo}
        src="/archon-logo.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay */}
      <div className={styles.overlay} />

      {/* Center content */}
      <div className={`${styles.content} ${showContent ? styles.visible : ""}`}>
        {/* Logo */}
        <div className={styles.logoGroup}>
          <div className={styles.logoLine} />
          <h1 className={styles.logo}>ARCHON</h1>
          <div className={styles.logoLine} />
        </div>

        <p className={styles.tagline}>AI-Powered Architecture</p>

        {/* Progress ring */}
        <div className={styles.ringContainer}>
          <svg className={styles.ring} viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(229, 229, 229, 0.6)"
              strokeWidth="1.5"
              strokeDasharray={`${progress * 3.267} 326.7`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className={styles.ringProgress}
            />
          </svg>
          <span className={styles.percent}>{Math.floor(progress)}</span>
        </div>

        {/* Status */}
        <div className={styles.statusRow}>
          <span className={styles.cursor}>▍</span>
          <span className={styles.statusText}>{status}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scanline */}
      <div className={styles.scanline} />
    </div>
  );
}
