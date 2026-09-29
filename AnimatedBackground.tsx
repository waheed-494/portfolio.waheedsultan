"use client";
import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number };

export default function AnimatedBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0, h = 0, raf = 0, ps: P[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const seed = () => {
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 28 : w < 1024 ? 45 : 70; // capped on mobile
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.4 + 0.5,
      }));
    };

    const dark = () => document.documentElement.classList.contains("dark");

    const mesh = (t: number) => {
      const d = dark();
      ctx.clearRect(0, 0, w, h);
      const blobs = [
        [0.2, 0.25, "124,147,255", 0.55], [0.8, 0.3, "62,224,255", 0.45], [0.55, 0.85, "160,110,255", 0.5],
      ] as const;
      blobs.forEach(([bx, by, col, s], i) => {
        const x = w * (bx + Math.sin(t / 9000 + i * 2) * 0.06);
        const y = h * (by + Math.cos(t / 11000 + i) * 0.06);
        const rad = Math.max(w, h) * s;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${col},${d ? 0.11 : 0.09})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
    };

    const frame = (t: number) => {
      mesh(t);
      const d = dark();
      const base = d ? "170,190,255" : "60,80,180";
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(${base},${d ? 0.35 : 0.3})`; ctx.fill();
      }
      // occasional faint lines: short distances, low alpha
      const max = w < 640 ? 90 : 130;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, dist = Math.hypot(dx, dy);
        if (dist < max && (i * 7 + j * 3) % 5 === 0) {
          ctx.strokeStyle = `rgba(${base},${(1 - dist / max) * 0.12})`;
          ctx.lineWidth = 0.6; ctx.beginPath();
          ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => { cancelAnimationFrame(raf); seed(); if (mq.matches) mesh(0); else raf = requestAnimationFrame(frame); };
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else if (!mq.matches) raf = requestAnimationFrame(frame); };
    start();
    window.addEventListener("resize", start);
    document.addEventListener("visibilitychange", onVis);
    mq.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", start);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="fixed inset-0 -z-10 h-full w-full pointer-events-none" />;
}
