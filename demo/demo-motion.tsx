// Demo motion graphics 2D: title card dengan kinetic text, stagger spring, dan bar accents.
// Render: raea render examples/demo-motion.tsx -o motion.mp4
import {
  AbsoluteFill, Composition, Easing, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig,
} from "raea";

const DARK = "#0b0e14";
const INK = "#f4f1ea";
const ACCENT = "#ff4d2e";
const ACCENT2 = "#3ec1ff";

function Words({ text, start, size, color }: { text: string; start: number; size: number; color: string }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: size * 0.28 }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: f - (start + i * Math.round(fps * 0.12)), fps, config: { damping: 14, stiffness: 160, mass: 0.8 } });
        return (
          <div
            key={i}
            style={{
              fontSize: size,
              fontWeight: 800,
              color,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
            }}
          >
            {w}
          </div>
        );
      })}
    </div>
  );
}

function Bar({ start, color, delay }: { start: number; color: string; delay: number }) {
  const f = useCurrentFrame();
  const w = interpolate(f, [start + delay, start + delay + 18], [0, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <div style={{ width: w, height: 14, background: color, borderRadius: 7 }} />;
}

function Dots({ start }: { start: number }) {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", right: 90, top: 90, display: "grid", gridTemplateColumns: "repeat(6, 22px)", gap: 14 }}>
      {Array.from({ length: 18 }, (_, i) => {
        const o = interpolate(f, [start + i * 2, start + i * 2 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: i % 3 === 0 ? ACCENT : "#2a3040", opacity: o }} />;
      })}
    </div>
  );
}

function Card() {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [0, 26], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const subO = interpolate(f, [64, 84], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(f, [64, 84], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: DARK, fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `linear-gradient(135deg, #131a2b ${wipe * 100}%, ${DARK} ${wipe * 100}%)` }} />
      <Dots start={10} />
      <div style={{ position: "absolute", left: 180, top: 300, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", gap: 16 }}><Bar start={8} delay={0} color={ACCENT} /><Bar start={8} delay={6} color={ACCENT2} /></div>
        <Words text="MOTION GRAPHICS" start={18} size={148} color={INK} />
        <Words text="RENDERED ON GPU" start={40} size={148} color={ACCENT} />
        <div style={{ fontSize: 44, color: "#8b93a7", opacity: subO, transform: `translateY(${subY}px)`, maxWidth: 1200, lineHeight: 1.4 }}>
          React + TypeScript di tulis tangan AI, di-render raea — setiap frame tetap data yang bisa dicek.
        </div>
      </div>
      <div
        style={{
          position: "absolute", left: 180, bottom: 90, fontSize: 30, color: "#5a6274", letterSpacing: 6,
          opacity: interpolate(f, [90, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        RAEA · RENDER ANYTHING ENGINE
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="motion" component={Card} width={1920} height={1080} fps={30} durationInFrames={150} />);
