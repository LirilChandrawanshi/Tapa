import Image from "next/image";

/**
 * Home hero backdrop — a brand plate with the aarti scene drawn in vector
 * on top of it.
 *
 * The plate sits at the bottom of the stack and the gradient stays behind it,
 * so the colour is right before the file lands and if it never does. Every
 * mark in the scene is warm-white at low alpha, so it tints itself against
 * whatever is underneath rather than assuming a fixed backdrop — which is
 * what lets the same vector sit on the plate and on a bare deity gradient.
 *
 * The scene is a pancharti thali — five wicks, the arrangement an aarti
 * thali actually carries — with the smoke rising off it and the circular
 * sweep the thali is moved in. The flame is the hero's key light, which is
 * why .hero-key is deliberately absent from this stack.
 */
export function HomeHeroBackdrop() {
  return (
    <>
      <Image
        src="/brand/homepagebg.png"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        priority
        className="pointer-events-none object-cover object-center"
      />
      <div aria-hidden className="hero-mesh absolute inset-0" />
      {/* The diya sits above the plate — its glow is still the hero's key light. */}
      <AartiScene />
      <div aria-hidden className="hero-scrim absolute inset-0" />
      <div aria-hidden className="hero-grain absolute inset-0" />
    </>
  );
}

/* Five wicks, centre tallest — the classic pancharti arrangement. */
const WICKS = [0, 1, 2, 3, 4].map((i) => ({
  x: 232 + i * 34,
  base: 160,
  height: [13, 18, 24, 18, 13][i],
  /* Out-of-step delays so the five read as five flames, not one
     pulsing graphic. Deliberately not evenly spaced. */
  delay: [0.9, 0.2, 1.6, 0.55, 1.25][i],
}));

/** Teardrop flame sitting on (x, base) and rising `h` tall. */
function flamePath(x: number, base: number, h: number): string {
  const w = h * 0.38;
  return [
    `M ${x} ${base}`,
    `C ${x - w} ${base - h * 0.45} ${x - w * 0.82} ${base - h * 0.86} ${x} ${base - h}`,
    `C ${x + w * 0.82} ${base - h * 0.86} ${x + w} ${base - h * 0.45} ${x} ${base}`,
    "Z",
  ].join(" ");
}

function AartiScene() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 520 280"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] md:block"
    >
      <defs>
        <radialGradient id="tapa-aarti-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD9A0" stopOpacity={0.3} />
          <stop offset="38%" stopColor="#FFB25A" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#FF9A2E" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="tapa-aarti-smoke" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Lamplight — the hero's actual key light */}
      <circle cx={300} cy={148} r={152} fill="url(#tapa-aarti-glow)" />

      {/* The circular sweep the thali is carried in */}
      <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
        <ellipse
          cx={300}
          cy={150}
          rx={172}
          ry={104}
          strokeOpacity={0.09}
          strokeDasharray="2 12"
        />
        <ellipse
          cx={300}
          cy={150}
          rx={140}
          ry={84}
          strokeOpacity={0.06}
          strokeDasharray="2 10"
        />
      </g>

      {/* Smoke, off the three tallest wicks */}
      <g stroke="url(#tapa-aarti-smoke)" strokeWidth={1.6} strokeLinecap="round">
        <path d="M 266 142 C 258 116 274 100 266 74 C 260 54 272 42 268 22" />
        <path d="M 300 136 C 291 106 311 88 300 58 C 293 38 305 26 301 8" />
        <path d="M 334 142 C 327 118 343 102 335 78 C 329 58 340 46 337 26" />
      </g>

      {/* The thali */}
      <g stroke="#FFFFFF" fill="none">
        <ellipse cx={300} cy={168} rx={104} ry={25} strokeOpacity={0.2} />
        <ellipse cx={300} cy={168} rx={86} ry={19} strokeOpacity={0.12} />
        <path
          d="M 196 168 C 196 184 240 196 300 196 C 360 196 404 184 404 168"
          strokeOpacity={0.16}
        />
      </g>

      {/* Five wicks */}
      <g>
        {WICKS.map((w) => (
          <g key={w.x}>
            <path
              d={`M ${w.x} ${w.base + 4} L ${w.x} ${w.base - 2}`}
              stroke="#FFFFFF"
              strokeOpacity={0.22}
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            {/* Each wick offset so the five breathe out of step, the way
                real flames do — in step would read as a pulsing graphic. */}
            <g
              className="flame-breathe"
              style={{
                animationDelay: `${w.delay}s`,
                transformOrigin: `${w.x}px ${w.base}px`,
              }}
            >
              <path d={flamePath(w.x, w.base, w.height)} fill="#FFD9A0" />
              <path
                d={flamePath(w.x, w.base, w.height * 0.52)}
                fill="#FFFFFF"
                fillOpacity={0.42}
              />
            </g>
          </g>
        ))}
      </g>

      {/* Scattered petals at the thali's foot */}
      <g fill="#FFFFFF" fillOpacity={0.1}>
        <ellipse cx={186} cy={204} rx={7} ry={3.4} transform="rotate(-18 186 204)" />
        <ellipse cx={228} cy={214} rx={6} ry={3} transform="rotate(12 228 214)" />
        <ellipse cx={378} cy={208} rx={7} ry={3.4} transform="rotate(24 378 208)" />
        <ellipse cx={414} cy={198} rx={5.5} ry={2.8} transform="rotate(-8 414 198)" />
      </g>
    </svg>
  );
}
