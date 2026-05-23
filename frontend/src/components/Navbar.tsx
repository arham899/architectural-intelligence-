"use client";

import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⊞</span>
          <span className={styles.logoText}>ARCHON</span>
          <span className={styles.logoTag}>v0.1</span>
        </a>

        {/* Nav links */}
        <div className={styles.links}>
          <a href="#features" className={styles.link}>Features</a>
          <a href="#workflow" className={styles.link}>Workflow</a>
          <a href="#tech" className={styles.link}>Stack</a>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <a href="/login" className={`btn btn-ghost ${styles.loginBtn}`}>
            Log In
          </a>
          <a href="/dashboard" className={`btn btn-primary ${styles.startBtn}`}>
            Launch Studio
          </a>
        </div>
      </div>
    </nav>
  );
}
