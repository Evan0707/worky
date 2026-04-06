"use client";

import { useEffect, useRef } from "react";

// Dot constellation that echoes the OpenChantier logo pattern
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let dots: { x: number; y: number; baseX: number; baseY: number; r: number; phase: number; speed: number }[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.scale(dpr, dpr);
      generateDots();
    }

    function generateDots() {
      dots = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      const spacing = 80;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;
      const offsetX = (w - (cols - 1) * spacing) / 2;
      const offsetY = (h - (rows - 1) * spacing) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * spacing;
          const y = offsetY + row * spacing;
          // Distance from center affects size
          const dx = x - w / 2;
          const dy = y - h / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
          const normalizedDist = dist / maxDist;

          // Larger dots near center, smaller at edges
          const baseR = 1.8 * (1 - normalizedDist * 0.7);

          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            r: Math.max(0.5, baseR),
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.5,
          });
        }
      }
    }

    function draw(time: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx!.clearRect(0, 0, w, h);

      const t = time * 0.001;

      // Draw dots
      for (const dot of dots) {
        // Subtle float
        const floatX = Math.sin(t * dot.speed + dot.phase) * 3;
        const floatY = Math.cos(t * dot.speed * 0.7 + dot.phase) * 3;
        dot.x = dot.baseX + floatX;
        dot.y = dot.baseY + floatY;

        // Opacity pulses based on distance from center
        const dx = dot.x - w / 2;
        const dy = dot.y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
        const normalizedDist = dist / maxDist;

        const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + dot.phase);
        const alpha = (0.12 + pulse * 0.12) * (1 - normalizedDist * 0.6);

        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.fill();
      }

      // Draw connections between nearby dots
      const connectionDist = 120;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i]!.x - dots[j]!.x;
          const dy = dots[i]!.y - dots[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = 0.03 * (1 - dist / connectionDist);
            ctx!.beginPath();
            ctx!.moveTo(dots[i]!.x, dots[i]!.y);
            ctx!.lineTo(dots[j]!.x, dots[j]!.y);
            ctx!.strokeStyle = `rgba(125, 125, 125, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Canvas dot grid */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Radial glow */}
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 h-[800px] w-[1200px] rounded-full bg-black/[0.015] dark:bg-white/[0.02] blur-[150px]" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-neutral-50 dark:from-[#0a0a0a] to-transparent" />
    </div>
  );
}
