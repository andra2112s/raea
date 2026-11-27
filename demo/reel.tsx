// REEL — format talking-take vertical (Reels/TikTok/Shorts): footage + caption karaoke
// (word lit saat diucapkan, dari words.json), hook, stat card, end card.
// words.json di folder ini dibuat manual dari timing kata SAPI TTS (voice.wav).
// Render: raea render demo/reel.tsx -o demo/reel-frames/ ; ffmpeg crf 15.
import {
  AbsoluteFill, Audio, Composition, Easing, Mix, Video, interpolate,
  registerRoot, staticFile, useCurrentFrame, useWords,
} from "raea";

const W = 1080, H = 1920, FPS = 30;
const ACCENT = "#b8f24a"; // lime, gaya reel
const INK = "#f2efe6";
const DIM = "#8f8d86";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* ---------- caption karaoke: ~3 kata per layar, kata aktif menyala ---------- */
function Captions() {
  const f = useCurrentFrame();
  const words = useWords();
  if (!words.length || f >= 495) return null;
  const i = words.findIndex((w) => f >= w.from && f < w.to);
  const cur = i < 0 ? (f < words[0].from ? 0 : words.length - 1) : i;
  const g0 = Math.floor(cur / 3) * 3;
  const group = words.slice(g0, g0 + 3);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "72%", textAlign: "center" }}>
      {group.map((w, k) => {
        const on = f >= w.from && f < w.to;
        return (
          <span key={g0 + k} style={{
            display: "inline-block", margin: "0 14px", fontSize: 88, fontWeight: 900,
            color: on ? "#0d0d0f" : INK, fontStyle: "italic", letterSpacing: 1,
            background: on ? ACCENT : "transparent", padding: "2px 18px", borderRadius: 16,
            transform: `scale(${on ? 1.06 : 1})`, textTransform: "uppercase",
            textShadow: on ? "none" : "0 3px 18px rgba(0,0,0,0.9)",
            transition: "none",
          }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
}

/* ---------- hook atas ---------- */
function Lockup({ text, start, end, size = 110, y = "8%" }: { text: string; start: number; end: number; size?: number; y?: string }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 5, end - 6, end], [0, 1, 1, 0], clamp);
  const s = interpolate(f, [start, start + 9], [1.4, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y, textAlign: "center",
      fontSize: size, fontWeight: 900, color: INK, fontStyle: "italic", letterSpacing: 2,
      lineHeight: 1.05, opacity: o, transform: `scale(${s})`,
      textShadow: `0 5px 0 #000, 0 12px 40px rgba(0,0,0,0.85)`, textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}

/* ---------- stat card ---------- */
function StatCard({ start, end }: { start: number; end: number }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const t = f - start;
  const o = interpolate(f, [start, start + 6, end - 8, end], [0, 1, 1, 0], clamp);
  const y = interpolate(t, [0, 10], [40, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const barW = interpolate(t, [6, 40], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", left: 70, right: 70, top: "34%", opacity: o,
      transform: `translateY(${y}px)`, background: "#161616", borderRadius: 24,
      border: `3px solid ${ACCENT}`, padding: "44px 48px", boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
    }}>
      <div style={{ fontSize: 150, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>200,000</div>
      <div style={{ fontSize: 44, fontWeight: 700, color: INK, marginTop: 14, lineHeight: 1.2 }}>pasukan Jerman mengepung</div>
      <div style={{ marginTop: 26, height: 26, background: "#2a2a2a", borderRadius: 13, overflow: "hidden" }}>
        <div style={{ width: `${barW}%`, height: "100%", background: ACCENT, borderRadius: 13 }} />
      </div>
    </div>
  );
}

/* ---------- kata kunci: "NUTS." punch ---------- */
function NutPunch({ start }: { start: number }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > 44) return null;
  const o = interpolate(t, [0, 3, 38, 44], [0, 1, 1, 0], clamp);
  const s = interpolate(t, [0, 9], [2.6, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(6,6,7,0.55)", opacity: o,
    }}>
      <div style={{
        fontSize: 300, fontWeight: 900, color: ACCENT, fontStyle: "italic",
        transform: `scale(${s})`, textShadow: "0 8px 0 #000, 0 0 90px rgba(184,242,74,0.4)",
      }}>NUTS.</div>
    </div>
  );
}

/* ---------- end card ---------- */
function EndCard({ start, end }: { start: number; end: number }) {
  const f = useCurrentFrame();
  if (f < start) return null;
  const o = interpolate(f, [start, start + 14], [0, 1], clamp);
  const up = interpolate(f, [start, start + 16], [60, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", inset: 0, background: "#0b0b0c", opacity: o,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transform: `translateY(${up}px)`,
    }}>
      <div style={{ width: 130, height: 10, background: ACCENT, borderRadius: 5, marginBottom: 42 }} />
      <div style={{ fontSize: 160, fontWeight: 900, color: INK, fontStyle: "italic", letterSpacing: 4 }}>BASTOGNE</div>
      <div style={{ fontSize: 46, fontWeight: 600, color: DIM, marginTop: 26 }}>kota yang tak pernah jatuh</div>
      <div style={{ marginTop: 70, fontSize: 44, fontWeight: 800, color: "#0d0d0f", background: ACCENT, padding: "18px 54px", borderRadius: 60 }}>FOLLOW UNTUK LEBIH</div>
    </div>
  );
}

function Grain() {
  const f = useCurrentFrame();
  const r = rng(Math.floor(f) * 7919 + 7);
  return (
    <>
      {Array.from({ length: 70 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: r() * W, top: r() * H, width: 2 + r() * 3, height: 2 + r() * 3, background: r() < 0.5 ? "#000" : "#fff", opacity: 0.05 + r() * 0.06 }} />
      ))}
    </>
  );
}

function Scene() {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, 540], [1, 1.1], clamp);
  return (
    <AbsoluteFill style={{ background: "#0b0b0c", overflow: "hidden", fontFamily: "sans-serif" }}>
      {/* footage: band tengah, sedikit zoom */}
      <div style={{
        position: "absolute", left: 0, top: "14%", width: W, height: 810,
        transform: `scale(${sc})`, transformOrigin: "50% 42%",
        filter: "sepia(0.22) contrast(1.1) brightness(0.96)",
      }}>
        <Video src={staticFile("take.mp4")} muted trimBefore={150} style={{ width: W, height: 810, objectFit: "cover" }} />
      </div>
      {/* gradasi atas/bawah supaya menyatu */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "22%", background: "linear-gradient(180deg,#0b0b0c 20%,transparent)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "52%", bottom: 0, background: "linear-gradient(0deg,#0b0b0c 30%,transparent)" }} />

      <Lockup text="BASTOGNE" start={4} end={66} size={130} y="7%" />
      <Lockup text="Desember 1944" start={16} end={66} size={56} y="15%" />
      <StatCard start={76} end={116} />
      <NutPunch start={423} />
      <EndCard start={500} end={540} />
      <Captions />

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
      <Grain />
      <Audio src={staticFile("voice.wav")} />
      <Audio src={staticFile("war3.wav")} volume={0.22} />
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="reel" component={Scene} width={W} height={H} fps={FPS} durationInFrames={540} />);
