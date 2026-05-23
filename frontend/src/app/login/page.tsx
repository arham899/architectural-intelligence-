"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock auth — just redirect
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        {/* Left side — branding */}
        <div className={styles.brand}>
          <div className={styles.brandInner}>
            <span className={styles.brandIcon}>⊞</span>
            <h1 className={styles.brandTitle}>ARCHON</h1>
            <p className={styles.brandDesc}>
              AI Architect Studio
            </p>
            <div className={styles.brandAscii}>
              {"╔══════════╗\n║  ┌──┐  ┌──┐ ║\n║  │▓▓│  │▒▒│ ║\n║  └──┘  └──┘ ║\n╚══════════╝"}
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className={styles.formSide}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {isRegister ? "Create Account" : "Welcome Back"}
              </h2>
              <p className={styles.formSubtitle}>
                {isRegister
                  ? "Start designing with AI"
                  : "Log in to your workspace"}
              </p>
            </div>

            {isRegister && (
              <div className={styles.field}>
                <label className={styles.label}>NAME</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your name"
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>EMAIL</label>
              <input
                type="email"
                className="input"
                placeholder="architect@studio.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>PASSWORD</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
              {isRegister ? "Create Account" : "Log In"} →
            </button>

            <p className={styles.toggle}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className={styles.toggleBtn}
              >
                {isRegister ? "Log In" : "Register"}
              </button>
            </p>
          </form>

          <div className={styles.formFooter}>
            <span className={styles.footerText}>ARCHON v0.1 — AI Architect Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
