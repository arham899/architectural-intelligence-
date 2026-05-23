"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  rooms: number;
  status: "draft" | "complete";
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "Modern Villa", updatedAt: "2 hours ago", rooms: 6, status: "draft" },
  { id: "2", name: "Studio Apartment", updatedAt: "Yesterday", rooms: 3, status: "complete" },
  { id: "3", name: "Family Home", updatedAt: "3 days ago", rooms: 8, status: "draft" },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: newName.trim(),
      updatedAt: "Just now",
      rooms: 0,
      status: "draft",
    };
    setProjects([newProject, ...projects]);
    setNewName("");
    setCreating(false);
    router.push(`/project/${newProject.id}`);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⊞</span>
            <span className={styles.logoText}>ARCHON</span>
          </a>
        </div>
        <nav className={styles.sidebarNav}>
          <a href="/dashboard" className={`${styles.navItem} ${styles.navActive}`}>
            <span className={styles.navIcon}>◫</span> Projects
          </a>
          <a href="#" className={styles.navItem}>
            <span className={styles.navIcon}>⬡</span> Assets
          </a>
          <a href="#" className={styles.navItem}>
            <span className={styles.navIcon}>◈</span> Templates
          </a>
          <a href="#" className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span> Settings
          </a>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>A</div>
            <div>
              <div className={styles.userName}>Architect</div>
              <div className={styles.userEmail}>user@archon.ai</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Projects</h1>
            <p className={styles.pageSubtitle}>Your architectural designs</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setCreating(true)}
          >
            + New Project
          </button>
        </header>

        {/* New project form */}
        {creating && (
          <div className={styles.createRow}>
            <input
              type="text"
              className="input"
              placeholder="Project name, e.g. Beach House"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleCreate}>
              Create
            </button>
            <button className="btn" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        )}

        {/* Project grid */}
        <div className={styles.grid}>
          {projects.map((project) => (
            <div
              key={project.id}
              className={styles.projectCard}
              onClick={() => router.push(`/project/${project.id}`)}
            >
              {/* Card preview area */}
              <div className={styles.cardPreview}>
                <div className={styles.previewGrid}>
                  {/* Blueprint mini-preview */}
                  <svg viewBox="0 0 200 140" className={styles.previewSvg}>
                    <rect x="10" y="10" width="80" height="60" fill="none" stroke="rgba(0,71,171,0.3)" strokeWidth="1" />
                    <rect x="100" y="10" width="90" height="40" fill="none" stroke="rgba(0,71,171,0.3)" strokeWidth="1" />
                    <rect x="100" y="60" width="90" height="70" fill="none" stroke="rgba(0,71,171,0.3)" strokeWidth="1" />
                    <rect x="10" y="80" width="80" height="50" fill="none" stroke="rgba(0,71,171,0.3)" strokeWidth="1" />
                    <text x="50" y="45" textAnchor="middle" fill="rgba(0,71,171,0.4)" fontSize="8" fontFamily="monospace">PLAN</text>
                  </svg>
                </div>
                <div className={styles.cardStatus}>
                  <span className={`${styles.statusDot} ${project.status === "complete" ? styles.statusComplete : ""}`} />
                  {project.status}
                </div>
              </div>

              {/* Card info */}
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{project.name}</h3>
                <div className={styles.cardMeta}>
                  <span>{project.rooms} rooms</span>
                  <span>·</span>
                  <span>{project.updatedAt}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state / new project card */}
          <div
            className={`${styles.projectCard} ${styles.newCard}`}
            onClick={() => setCreating(true)}
          >
            <div className={styles.newCardInner}>
              <span className={styles.newCardIcon}>+</span>
              <span className={styles.newCardText}>New Project</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
