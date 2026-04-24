import { useEffect, useRef } from "react";

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  phase: number;
  phaseSpeed: number;
}

interface FireflyParticlesProps {
  count?: number;
  className?: string;
}

// Pre-render each unique size's glow sprite once; draw it into the scene with
// a per-frame alpha instead of building a fresh radial gradient every tick.
// 40 fireflies × 60fps = 2.4K allocations/s → replaced with ~N sprites total.
function buildGlowSprite(radius: number): HTMLCanvasElement {
  const diameter = Math.ceil(radius * 2);
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = diameter;
  spriteCanvas.height = diameter;
  const sctx = spriteCanvas.getContext("2d");
  if (!sctx) return spriteCanvas;
  const cx = radius;
  const cy = radius;
  const gradient = sctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, "rgba(255, 230, 120, 1)");
  gradient.addColorStop(0.3, "rgba(180, 220, 100, 0.6)");
  gradient.addColorStop(1, "rgba(100, 180, 80, 0)");
  sctx.fillStyle = gradient;
  sctx.beginPath();
  sctx.arc(cx, cy, radius, 0, Math.PI * 2);
  sctx.fill();
  return spriteCanvas;
}

export function FireflyParticles({ count = 50, className = "" }: FireflyParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    firefliesRef.current = Array.from({ length: count }, (_, index) => ({
      x: ((index * 67) % 100) * 0.01 * canvas.width,
      y: ((index * 43) % 100) * 0.01 * canvas.height,
      vx: (((index * 17) % 9) - 4) * 0.055,
      vy: (((index * 29) % 9) - 4) * 0.045,
      size: 1.2 + ((index * 13) % 30) / 10,
      brightness: ((index * 31) % 100) / 100,
      phase: ((index * 19) % 100) * 0.01 * Math.PI * 2,
      phaseSpeed: 0.01 + ((index * 7) % 18) * 0.001,
    }));

    // Cache sprite per unique size bucket. Sizes are a small finite set
    // (1.2..4.1 in 0.1 steps), so this caps at ~30 sprite canvases total.
    const spriteCache = new Map<number, HTMLCanvasElement>();
    const getSprite = (size: number): HTMLCanvasElement => {
      const key = Math.round(size * 10);
      let s = spriteCache.get(key);
      if (!s) {
        s = buildGlowSprite(size * 4);
        spriteCache.set(key, s);
      }
      return s;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fireflies = firefliesRef.current;
      for (let i = 0; i < fireflies.length; i++) {
        const firefly = fireflies[i];
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;
        if (firefly.x < 0) firefly.x = canvas.width;
        if (firefly.x > canvas.width) firefly.x = 0;
        if (firefly.y < 0) firefly.y = canvas.height;
        if (firefly.y > canvas.height) firefly.y = 0;
        firefly.phase += firefly.phaseSpeed;
        const glow = (Math.sin(firefly.phase) + 1) / 2;
        const alpha = 0.3 + glow * 0.7;
        const sprite = getSprite(firefly.size);
        const r = firefly.size * 4;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, firefly.x - r, firefly.y - r);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      spriteCache.clear();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      data-capture-exclude="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ mixBlendMode: "screen" }}
    />
  );
}
