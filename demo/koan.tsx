// KOAN — "Wash your bowl" (Mumonkan, Gateless Gate 7) — dari daily-dharma-backend suttas.
// Vertical short 1080x1920, 630 frame @30fps (~21s). Estetika: kertas gelap, enso tinta,
// aksen emas, caption karaoke tenang, singing bowl.
// Render: raea render demo/koan.tsx -o demo/koan-frames/ --words demo/media/koan-words.json
import {
  AbsoluteFill, Audio, Composition, Easing, Mix, interpolate,
  registerRoot, staticFile, useCurrentFrame, useWords,
} from "raea";

const W = 1080, H = 1920;
const INK = "#ece4d4";
const GOLD = "#d9b36a";
const DIM = "#7a7164";
const PAPER = "#131110";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* enso: lingkaran tinta yang terbuka, terlukis perlahan */
function Enso({ start, dur }: { start: number; dur: number }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0) return null;
  const R = 300, C = 2 * Math.PI * R;
  const p = interpolate(t, [0, dur], [0, 0.86], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const o = interpolate(t, [0, 12], [0, 1], clamp);
  const breathe = 1 + 0.012 * Math.sin((f - dur) / 45);
  return (
    <div style={{ position: "absolute", left: (W - 720) / 2, top: 330, width: 720, height: 720, opacity: o, transform: `scale(${breathe})` }}>
      <svg width={720} height={720} viewBox="0 0 720 720" style={{ display: "block" }}>
        <circle cx={360} cy={360} r={R} fill="none" stroke={INK} strokeWidth={30}
          strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - p)}
          transform={`rotate(-92 360 360)`} strokeLinecap="round" opacity={0.94} />
        <circle cx={360} cy={360} r={R} fill="none" stroke={GOLD} strokeWidth={7}
          strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - p)}
          transform={`rotate(-92 360 360)`} strokeLinecap="round" opacity={0.35} />
      </svg>
      {Array.from({ length: 7 }, (_, i) => {
        const r = rng(i * 31 + 5);
        const a = r() * 6.28, d = R + 30 + r() * 60;
        return <div key={i} style={{ position: "absolute", left: 360 + Math.cos(a) * d, top: 360 + Math.sin(a) * d, width: 2 + r() * 6, height: 2 + r() * 6, borderRadius: 4, background: INK, opacity: (0.15 + r() * 0.3) * o }} />;
      })}
    </div>
  );
}

/* mangkuk sederhana + uap */
function Bowl({ show }: { show: number }) {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: (W - 460) / 2, top: 1330, width: 460, height: 260, opacity: show }}>
      <svg width={460} height={260} viewBox="0 0 460 260" style={{ display: "block" }}>
        <path d="M 40 60 Q 40 220 230 220 Q 420 220 420 60 Z" fill="#1c1916" stroke={INK} strokeWidth={7} />
        <rect x={40} y={48} width={380} height={24} rx={12} fill={INK} />
        {[0, 1, 2].map((i) => {
          const ph = i * 2.1;
          const yo = ((f * 1.4 + ph * 40) % 90);
          const o = Math.max(0, 0.5 - yo / 180);
          return <ellipse key={i} cx={150 + i * 80 + Math.sin(f / 12 + ph) * 16} cy={38 - yo} rx={9} ry={16} fill={INK} opacity={o} />;
        })}
      </svg>
    </div>
  );
}

/* caption karaoke tenang */
function Captions() {
  const f = useCurrentFrame();
  const words = useWords();
  if (!words.length || f >= 505) return null;
  const i = words.findIndex((w) => f >= w.from && f < w.to);
  const cur = i < 0 ? (f < words[0].from ? 0 : words.length - 1) : i;
  const g0 = Math.floor(cur / 3) * 3;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "70%", textAlign: "center" }}>
      {words.slice(g0, g0 + 3).map((w, k) => {
        const on = f >= w.from && f < w.to;
        return (
          <span key={g0 + k} style={{
            display: "inline-block", margin: "0 13px", fontSize: 76, fontWeight: on ? 800 : 500,
            color: on ? GOLD : "rgba(236,228,212,0.55)", fontStyle: "italic", letterSpacing: 1,
            borderBottom: on ? `5px solid ${GOLD}` : "5px solid transparent",
            textTransform: "uppercase", transition: "none",
          }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
}

function Line({ text, start, end, size = 60, color = DIM, y = "16%" }: { text: string; start: number; end: number; size?: number; color?: string; y?: string }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 8, end - 8, end], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontSize: size, fontWeight: 500, color, letterSpacing: 8, textTransform: "uppercase", opacity: o }}>
      {text}
    </div>
  );
}

/* punchline */
function Punch({ text, start, end }: { text: string; start: number; end: number }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 5, end - 10, end], [0, 1, 1, 0], clamp);
  const s = interpolate(f, [start, start + 10], [1.5, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: "46%", textAlign: "center",
      fontSize: 128, fontWeight: 800, color: GOLD, fontStyle: "italic", letterSpacing: 2,
      opacity: o, transform: `scale(${s})`, textShadow: "0 0 80px rgba(217,179,106,0.35)",
    }}>
      {text}
    </div>
  );
}

function EndCard({ start }: { start: number }) {
  const f = useCurrentFrame();
  const o = interpolate(f, [start, start + 16], [0, 1], clamp);
  if (f < start) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, background: PAPER, opacity: o,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 46, fontWeight: 600, color: DIM, letterSpacing: 10, textTransform: "uppercase" }}>Mumonkan · Gateless Gate 7</div>
      <div style={{ width: 110, height: 8, background: GOLD, borderRadius: 4, margin: "48px 0" }} />
      <div style={{ fontSize: 120, fontWeight: 800, color: INK, fontStyle: "italic", letterSpacing: 3 }}>DAILY DHARMA</div>
      <div style={{ fontSize: 44, fontWeight: 500, color: DIM, marginTop: 24 }}>refleksi zen setiap hari</div>
    </div>
  );
}

function Grain() {
  const f = useCurrentFrame();
  const r = rng(Math.floor(f) * 7919 + 3);
  return (
    <>
      {Array.from({ length: 80 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: r() * W, top: r() * H, width: 2 + r() * 3, height: 2 + r() * 3, background: r() < 0.55 ? "#000" : INK, opacity: 0.04 + r() * 0.05 }} />
      ))}
    </>
  );
}

function Scene() {
  const f = useCurrentFrame();
  const bowlO = interpolate(f, [480, 510, 560, 575], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 42%, #1c1815 0%, #131110 62%)" }} />
      <Enso start={6} dur={72} />
      <Line text="sebuah koan zen" start={30} end={110} size={44} y="14%" />
      <Bowl show={bowlO} />
      <Punch text="CUCI MANGKUKMU." start={505} end={565} />
      <EndCard start={578} />
      <Captions />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      <Grain />
      <Audio src={staticFile("voice-koan.wav")} />
      <Audio src={staticFile("zen.wav")} volume={0.9} />
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="koan" component={Scene} width={W} height={H} fps={30} durationInFrames={630} />);
