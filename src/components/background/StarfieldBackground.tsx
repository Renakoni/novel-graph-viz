import { useEffect, useMemo, useRef, useState } from "react";
import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

type StarfieldBackgroundProps = {
  variant: BackgroundVariant;
};

export type BackgroundVariant =
  | "starfield"
  | "grid"
  | "snow"
  | "bubble"
  | "firefly"
  | "wave"
  | "tyndall";

type Star = {
  x: number;
  y: number;
  z: number;
  speed: number;
  radius: number;
};

type StarLayer = {
  className: string;
  boxShadow: string;
};

const PARTICLE_VARIANTS = new Set<BackgroundVariant>([
  "snow",
  "bubble",
  "firefly",
  "tyndall",
]);

let particlesEnginePromise: Promise<void> | null = null;

function initParticlesOnce() {
  if (!particlesEnginePromise) {
    particlesEnginePromise = initParticlesEngine(async (engine) => {
      await loadFull(engine);
    });
  }

  return particlesEnginePromise;
}

function getParticleOptions(variant: BackgroundVariant): ISourceOptions {
  const base = {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 90,
    detectRetina: true,
  };

  const optionsByVariant: Partial<Record<BackgroundVariant, ISourceOptions>> = {
    snow: {
      ...base,
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: true, mode: "repulse" },
          resize: { enable: true },
        },
        modes: { repulse: { distance: 100, duration: 0.4 } },
      },
      particles: {
        color: { value: "#ffffff" },
        move: {
          direction: "bottom",
          drift: { min: -0.5, max: 0.5 },
          enable: true,
          outModes: { default: "out" },
          speed: { min: 1, max: 3 },
          straight: false,
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 80,
        },
        opacity: {
          animation: { enable: true, speed: 1, sync: false },
          value: { min: 0.3, max: 0.8 },
        },
        shadow: {
          blur: 5,
          color: { value: "#ffffff" },
          enable: true,
          offset: { x: 0, y: 0 },
        },
        shape: { type: "circle" },
        size: { value: { min: 2, max: 6 } },
        wobble: { distance: 10, enable: true, speed: { min: -5, max: 5 } },
      },
    },
    bubble: {
      ...base,
      interactivity: {
        detectsOn: "window",
        events: {
          onClick: { enable: true, mode: "pop" },
          onHover: { enable: true, mode: "bubble" },
          resize: { enable: true },
        },
        modes: {
          bubble: { distance: 200, duration: 2, opacity: 0.8, size: 15 },
          pop: {},
        },
      },
      particles: {
        color: { value: ["#00d9ff", "#00ff9d", "#ff00e6", "#ffee00"] },
        move: {
          direction: "top",
          enable: true,
          outModes: { default: "out" },
          speed: { min: 1, max: 2 },
          straight: false,
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 50,
        },
        opacity: {
          animation: { enable: true, speed: 0.5, sync: false },
          value: { min: 0.2, max: 0.6 },
        },
        shadow: {
          blur: 10,
          color: { value: "#ffb3d9" },
          enable: true,
          offset: { x: 0, y: 0 },
        },
        shape: { type: "circle" },
        size: {
          animation: { enable: true, speed: 3, sync: false },
          value: { min: 5, max: 15 },
        },
        stroke: { color: { value: "rgba(255,255,255,0.3)" }, width: 1 },
      },
    },
    firefly: {
      ...base,
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: true, mode: "slow" },
          resize: { enable: true },
        },
        modes: { slow: { factor: 3, radius: 200 } },
      },
      particles: {
        color: { value: ["#ffff00", "#adff2f", "#7fff00", "#00ff7f"] },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: true,
          speed: 1,
          straight: false,
          trail: { enable: true, fill: { color: "transparent" }, length: 5 },
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 40,
        },
        opacity: {
          animation: { enable: true, speed: 2, sync: false },
          value: { min: 0.3, max: 1 },
        },
        shadow: {
          blur: 15,
          color: { value: "#adff2f" },
          enable: true,
          offset: { x: 0, y: 0 },
        },
        shape: { type: "circle" },
        size: { value: { min: 2, max: 5 } },
      },
    },
    tyndall: {
      ...base,
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: true, mode: "slow" },
          resize: { enable: true },
        },
        modes: { slow: { factor: 2.2, radius: 180 } },
      },
      particles: {
        color: { value: ["#fff7d8", "#ffe9a9", "#fffdf2"] },
        links: { enable: false },
        move: {
          angle: { offset: 24, value: 12 },
          direction: "bottom",
          enable: true,
          outModes: { default: "out", left: "out", right: "out", top: "out" },
          random: true,
          speed: { min: 0.18, max: 0.56 },
          straight: false,
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 120,
        },
        opacity: {
          animation: { enable: true, speed: 0.6, sync: false },
          value: { min: 0.2, max: 0.65 },
        },
        shape: { type: "circle" },
        size: { value: { min: 0.9, max: 2.6 } },
      },
    },
  };

  return optionsByVariant[variant] ?? optionsByVariant.snow!;
}

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createBoxShadowStars(
  count: number,
  seed: number,
  color: string,
  width = 2560,
  height = 1800,
) {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => {
    const x = Math.floor(random() * width);
    const y = Math.floor(random() * height);
    return `${x}px ${y}px ${color}`;
  }).join(", ");
}

function createStar(width: number, height: number): Star {
  return {
    x: (Math.random() - 0.5) * width,
    y: (Math.random() - 0.5) * height,
    z: Math.random() * width,
    speed: 0.35 + Math.random() * 0.75,
    radius: 0.5 + Math.random() * 1.4,
  };
}

export function StarfieldBackground({ variant }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particlesReady, setParticlesReady] = useState(false);
  const starLayers = useMemo<StarLayer[]>(
    () => [
      {
        className: "starry-layer starry-layer--small",
        boxShadow: createBoxShadowStars(760, 11, "rgba(226, 242, 255, 0.92)"),
      },
      {
        className: "starry-layer starry-layer--medium",
        boxShadow: createBoxShadowStars(260, 23, "rgba(125, 211, 252, 0.78)"),
      },
      {
        className: "starry-layer starry-layer--large",
        boxShadow: createBoxShadowStars(96, 37, "rgba(255, 255, 255, 0.72)"),
      },
    ],
    [],
  );
  const particleOptions = useMemo(() => getParticleOptions(variant), [variant]);

  useEffect(() => {
    if (variant !== "starfield") {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: 260 }, () => createStar(width, height));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      const gradient = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.7,
      );
      gradient.addColorStop(0, "rgba(15, 23, 42, 0.02)");
      gradient.addColorStop(0.56, "rgba(14, 37, 61, 0.12)");
      gradient.addColorStop(1, "rgba(2, 6, 23, 0.24)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.z -= star.speed;
        if (star.z <= 1) {
          Object.assign(star, createStar(width, height));
          star.z = width;
        }

        const k = 128 / star.z;
        const x = star.x * k + centerX;
        const y = star.y * k + centerY;
        const alpha = Math.max(0.22, Math.min(1, 1 - star.z / width));
        const radius = star.radius * k;

        if (x < 0 || x > width || y < 0 || y > height) {
          continue;
        }

        context.beginPath();
        context.fillStyle = `rgba(226, 242, 255, ${alpha})`;
        context.arc(x, y, Math.max(0.4, radius), 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  useEffect(() => {
    if (!PARTICLE_VARIANTS.has(variant)) {
      return;
    }

    let cancelled = false;
    setParticlesReady(false);
    void initParticlesOnce().then(() => {
      if (!cancelled) {
        setParticlesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== "wave") {
      return;
    }

    const canvas = waveCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let tick = 0;
    const particleCount = 820;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      size: 0.6 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 0.00075,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.78 ? "rgba(226, 242, 255," : "rgba(56, 189, 248,",
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      tick += 0.0032;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.drift;
        if (particle.x < -0.04) particle.x = 1.04;
        if (particle.x > 1.04) particle.x = -0.04;

        const depth = 0.45 + particle.z * 0.8;
        const baseY = height * 0.62;
        const wave =
          Math.sin(particle.x * 10 + tick + particle.phase) *
            height *
            0.034 +
          Math.sin(particle.z * 6 + tick * 0.55) *
            height *
            0.022;
        const x = particle.x * width;
        const y =
          baseY +
          (particle.y - 0.5) * height * 0.3 +
          wave * depth;
        const alpha = 0.12 + particle.z * 0.44;
        const radius = particle.size * depth;

        context.beginPath();
        context.fillStyle = `${particle.color} ${alpha})`;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        if (particle.z > 0.86) {
          const glow = context.createRadialGradient(x, y, 0, x, y, radius * 5);
          glow.addColorStop(0, `${particle.color} ${alpha * 0.22})`);
          glow.addColorStop(1, `${particle.color} 0)`);
          context.fillStyle = glow;
          context.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  return (
    <div className={`viewer-background viewer-background--${variant}`}>
      {variant === "starfield" ? (
        <>
          <div className="starry-nebula starry-nebula--left" />
          <div className="starry-nebula starry-nebula--right" />
          {starLayers.map((layer) => (
            <div
              key={layer.className}
              className={layer.className}
              style={{ boxShadow: layer.boxShadow }}
            />
          ))}
          <div className="starry-meteor starry-meteor--one" />
          <div className="starry-meteor starry-meteor--two" />
          <canvas ref={canvasRef} className="starry-depth-canvas" />
        </>
      ) : null}
      {PARTICLE_VARIANTS.has(variant) && particlesReady ? (
        <Particles
          id={`viewer-particles-${variant}`}
          className="tsparticles-background"
          options={particleOptions}
        />
      ) : null}
      {variant === "wave" ? (
        <canvas ref={waveCanvasRef} className="particle-wave-canvas" />
      ) : null}
    </div>
  );
}
