import { useEffect, useRef } from "react";

const PALETTE = {
  bg: "#0c1a10",
  moss: "#1a3a22",
  bark: "#2e1810",
  firefly: "#f2c14e",
  spirit: "#8b5cf6",
  fg: "#ecf1df",
};

interface Firefly {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  phase: number;
  size: number;
}

interface Cinder {
  x: number;
  y: number;
  vy: number;
  drift: number;
  phase: number;
  opacity: number;
}

/**
 * Forest-grove landing hero: moss-green canopy, three rune glyphs
 * drifting in the background on a slow rotation, a central sacred-tree
 * silhouette, fireflies pulsing around it, cinders rising. Canvas is
 * aria-hidden + pointerEvents: none so it never intercepts the CTA
 * layer above.
 */
export function LandingHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const fireflies: Firefly[] = Array.from({ length: 32 }).map((_, i) => ({
      x: (i * 97.3) % 100,
      y: 40 + ((i * 51.7) % 60),
      driftX: ((i % 2) - 0.5) * 0.08,
      driftY: -0.04 - ((i * 3) % 5) * 0.01,
      phase: (i * 0.37) % (Math.PI * 2),
      size: 1.3 + ((i * 7) % 4) * 0.35,
    }));

    const cinders: Cinder[] = Array.from({ length: 18 }).map((_, i) => ({
      x: (i * 131.7) % 100,
      y: 100 + ((i * 13) % 10),
      vy: 0.08 + ((i * 3) % 5) * 0.02,
      drift: ((i % 2) - 0.5) * 0.03,
      phase: i * 0.5,
      opacity: 0.35 + ((i * 11) % 5) * 0.08,
    }));

    let t0 = performance.now();

    function frame(now: number) {
      if (!canvas || !ctx) return;
      const dt = reducedMotion ? 0 : (now - t0) / 1000;
      t0 = now;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Backdrop — deep forest floor to canopy gradient.
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#14261a");
      bg.addColorStop(0.55, PALETTE.bg);
      bg.addColorStop(1, "#040a06");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Moss-green mist at the far tree line — a soft horizontal band.
      const mist = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.95);
      mist.addColorStop(0, "rgba(26, 58, 34, 0.0)");
      mist.addColorStop(0.5, "rgba(26, 58, 34, 0.45)");
      mist.addColorStop(1, "rgba(12, 26, 16, 0.85)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // Distant tree silhouettes — three tall shapes on a far-parallax.
      drawDistantTree(ctx, w * 0.2, h * 0.95, h * 0.55, "#0e1f13");
      drawDistantTree(ctx, w * 0.72, h * 0.98, h * 0.6, "#0c1b10");
      drawDistantTree(ctx, w * 0.5, h * 1.02, h * 0.72, "#10211580");

      // Drifting rune glyphs — faint, slow, in the background canopy.
      drawRune(ctx, w * 0.25, h * 0.28, h * 0.06, (now * 0.0002) % (Math.PI * 2), "shield");
      drawRune(ctx, w * 0.55, h * 0.2, h * 0.065, (now * 0.00018) % (Math.PI * 2), "heal");
      drawRune(ctx, w * 0.8, h * 0.35, h * 0.055, (now * 0.00024) % (Math.PI * 2), "purify");

      // Rising cinders.
      for (const c of cinders) {
        c.y -= c.vy * dt * 24;
        c.x += c.drift * dt * 10;
        c.phase += dt * 2.2;
        if (c.y < -5) {
          c.y = 105;
          c.x = ((c.x + 47) * 13) % 100;
        }
        if (c.x < -5) c.x = 105;
        if (c.x > 105) c.x = -5;
        const px = (c.x / 100) * w;
        const py = (c.y / 100) * h;
        const flicker = 0.6 + 0.4 * Math.sin(c.phase);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 4);
        grad.addColorStop(0, `rgba(242, 193, 78, ${c.opacity * flicker})`);
        grad.addColorStop(1, "rgba(242, 193, 78, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fireflies — warm amber pulses at mid-depth.
      for (const f of fireflies) {
        f.x += f.driftX * dt * 12;
        f.y += f.driftY * dt * 8;
        f.phase += dt * 1.4;
        if (f.y < 10) f.y = 100;
        if (f.x < -4) f.x = 104;
        if (f.x > 104) f.x = -4;

        const pulse = 0.5 + 0.5 * Math.sin(f.phase);
        const px = (f.x / 100) * w;
        const py = (f.y / 100) * h;

        const halo = ctx.createRadialGradient(px, py, 0, px, py, f.size * 9);
        halo.addColorStop(0, `rgba(242, 193, 78, ${0.45 * pulse})`);
        halo.addColorStop(0.5, "rgba(242, 193, 78, 0.12)");
        halo.addColorStop(1, "rgba(242, 193, 78, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, f.size * 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(252, 230, 165, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, f.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central sacred tree silhouette — slightly larger, warmer
      // spirit-violet inner glow so it reads as the player's target.
      drawSacredTree(ctx, w * 0.5, h * 0.92, h * 0.55);

      // Vignette.
      const vig = ctx.createRadialGradient(
        w * 0.5,
        h * 0.55,
        Math.min(w, h) * 0.2,
        w * 0.5,
        h * 0.55,
        Math.max(w, h) * 0.85,
      );
      vig.addColorStop(0, "rgba(12, 26, 16, 0)");
      vig.addColorStop(1, "rgba(4, 10, 6, 0.9)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      if (!reducedMotion) rafRef.current = requestAnimationFrame(frame);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    if (reducedMotion) {
      frame(performance.now());
    } else {
      rafRef.current = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

function drawDistantTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx - height * 0.04, baseY);
  ctx.lineTo(cx - height * 0.04, baseY - height * 0.6);
  // Triangular canopy shape.
  ctx.lineTo(cx - height * 0.3, baseY - height * 0.6);
  ctx.lineTo(cx, baseY - height);
  ctx.lineTo(cx + height * 0.3, baseY - height * 0.6);
  ctx.lineTo(cx + height * 0.04, baseY - height * 0.6);
  ctx.lineTo(cx + height * 0.04, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawSacredTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
) {
  // Glow halo (spirit violet + firefly amber mix) behind the trunk.
  const halo = ctx.createRadialGradient(
    cx,
    baseY - height * 0.55,
    0,
    cx,
    baseY - height * 0.55,
    height * 0.6,
  );
  halo.addColorStop(0, "rgba(139, 92, 246, 0.28)");
  halo.addColorStop(0.4, "rgba(242, 193, 78, 0.14)");
  halo.addColorStop(1, "rgba(12, 26, 16, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, baseY - height * 0.55, height * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Trunk.
  ctx.fillStyle = PALETTE.bark;
  ctx.beginPath();
  ctx.moveTo(cx - height * 0.045, baseY);
  ctx.lineTo(cx - height * 0.035, baseY - height * 0.55);
  ctx.lineTo(cx + height * 0.035, baseY - height * 0.55);
  ctx.lineTo(cx + height * 0.045, baseY);
  ctx.closePath();
  ctx.fill();

  // Canopy — layered triangles for depth.
  ctx.fillStyle = "#0a1b0f";
  drawLeaf(ctx, cx, baseY - height * 0.55, height * 0.5, height * 0.45);
  ctx.fillStyle = "#112b18";
  drawLeaf(ctx, cx, baseY - height * 0.7, height * 0.38, height * 0.36);
  ctx.fillStyle = "#1a3b22";
  drawLeaf(ctx, cx, baseY - height * 0.82, height * 0.26, height * 0.25);

  // Spirit-violet accent at the canopy tip.
  const tip = ctx.createRadialGradient(
    cx,
    baseY - height * 0.95,
    0,
    cx,
    baseY - height * 0.95,
    height * 0.08,
  );
  tip.addColorStop(0, "rgba(217, 204, 250, 0.6)");
  tip.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.arc(cx, baseY - height * 0.95, height * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfWidth: number,
  height: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx - halfWidth, cy);
  ctx.quadraticCurveTo(cx, cy - height * 0.2, cx + halfWidth, cy);
  ctx.lineTo(cx, cy - height);
  ctx.closePath();
  ctx.fill();
}

function drawRune(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  kind: "shield" | "heal" | "purify",
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation * 0.15);
  ctx.strokeStyle = "rgba(242, 193, 78, 0.35)";
  ctx.lineWidth = 1.4;
  ctx.shadowColor = "rgba(242, 193, 78, 0.5)";
  ctx.shadowBlur = 6;

  ctx.beginPath();
  if (kind === "shield") {
    // Triangle pointing up — defensive rune.
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.9, size * 0.7);
    ctx.lineTo(-size * 0.9, size * 0.7);
    ctx.closePath();
  } else if (kind === "heal") {
    // Open circle with a slash — restorative rune.
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.moveTo(-size * 0.7, 0);
    ctx.lineTo(size * 0.7, 0);
  } else {
    // Square rotated 45° with an inner dot — purify rune.
    ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
    ctx.moveTo(0, -size * 0.3);
    ctx.lineTo(size * 0.3, 0);
    ctx.lineTo(0, size * 0.3);
    ctx.lineTo(-size * 0.3, 0);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}
