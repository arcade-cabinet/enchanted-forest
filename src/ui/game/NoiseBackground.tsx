import { useEffect, useRef } from "react";

interface NoiseBackgroundProps {
  className?: string;
}

export function NoiseBackground({ className = "" }: NoiseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;
    let frameCount = 0;
    let animationId = 0;
    const S = 512;
    const resize = () => {
      canvas.width = S;
      canvas.height = S;
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    };
    const draw = () => {
      const img = ctx.createImageData(S, S);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const pixel = i / 4;
        const seed = Math.sin(pixel * 12.9898 + frameCount * 0.37) * 43758.5453;
        const v = (seed - Math.floor(seed)) * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 10;
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = () => {
      if (frameCount % 3 === 0) draw();
      frameCount++;
      animationId = requestAnimationFrame(loop);
    };
    window.addEventListener("resize", resize);
    resize();
    loop();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-capture-exclude="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ imageRendering: "pixelated", mixBlendMode: "overlay" }}
    />
  );
}

export function ForestGradientBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10, 30, 20, 1) 0%, rgba(15, 45, 30, 1) 50%, rgba(20, 35, 25, 1) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 30% 20%, rgba(180, 160, 80, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 70% 30%, rgba(200, 180, 100, 0.1) 0%, transparent 45%), radial-gradient(ellipse 50% 30% at 50% 60%, rgba(150, 180, 100, 0.08) 0%, transparent 40%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 100%, rgba(80, 40, 120, 0.2) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 40% at 50% 100%, rgba(180, 120, 40, 0.15) 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `repeating-linear-gradient(105deg, transparent 0%, transparent 45%, rgba(255, 240, 180, 0.03) 45.5%, rgba(255, 240, 180, 0.03) 46.5%, transparent 47%)`,
          animation: "sway 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
