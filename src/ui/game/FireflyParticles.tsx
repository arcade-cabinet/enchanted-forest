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
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      firefliesRef.current.forEach((firefly) => {
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;
        if (firefly.x < 0) firefly.x = canvas.width;
        if (firefly.x > canvas.width) firefly.x = 0;
        if (firefly.y < 0) firefly.y = canvas.height;
        if (firefly.y > canvas.height) firefly.y = 0;
        firefly.phase += firefly.phaseSpeed;
        const glow = (Math.sin(firefly.phase) + 1) / 2;
        const alpha = 0.3 + glow * 0.7;
        const gradient = ctx.createRadialGradient(
          firefly.x,
          firefly.y,
          0,
          firefly.x,
          firefly.y,
          firefly.size * 4
        );
        gradient.addColorStop(0, `rgba(255, 230, 120, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(180, 220, 100, ${alpha * 0.6})`);
        gradient.addColorStop(1, "rgba(100, 180, 80, 0)");
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
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
