// BASTOGNE v3 — trailer footage asli: Army-Navy Screen Magazine No.55 (public domain,
// footage tempur US Army, pengepungan Bastogne Desember 1944). 600 frame @30fps.
// Render HQ: raea render demo/war3.tsx -o demo/frames3/ ; lalu ffmpeg libx264 crf 15 + mux wav.
import {
  AbsoluteFill, Audio, Composition, Easing, Mix, Sequence, Video, interpolate,
  registerRoot, staticFile, useCurrentFrame,
} from "raea";

const W = 1920, H = 1080;
const INK = "#ece6d8";
const DIM = "#a8a292";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/* ---------- satu potong footage: zoom perlahan + flicker arsip ---------- */
function Clip({ src, from, dur, trim = 0, zoom = 0.07, dim = 0 }: {
  src: string; from: number; dur: number; trim?: number; zoom?: number; dim?: number;
}) {
  return (
    <Sequence from={from} durationInFrames={dur}>
      <ClipInner src={src} trim={trim} zoom={zoom} dur={dur} dim={dim} />
    </Sequence>
  );
}
function ClipInner({ src, trim, zoom, dur, dim }: { src: string; trim: number; zoom: number; dur: number; dim: number }) {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, dur], [1, 1 + zoom], clamp);
  const flick = 0.97 + 0.03 * Math.sin(f * 0.4 + 1.1);
  const o = interpolate(f, [0, 3, dur - 2, dur], [0, 1, 1, 1], clamp);
  return (
    <div style={{
      position: "absolute", left: (W - 1440) / 2, top: 0, width: 1440, height: H,
      transform: `scale(${sc})`, opacity: o * flick,
      filter: "sepia(0.28) contrast(1.12) brightness(0.94)",
    }}>
      <Video src={src} muted trimBefore={trim} style={{ width: 1440, height: H, objectFit: "cover" }} />
      {dim > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} />}
    </div>
  );
}

/* ---------- teks ---------- */
function Line({ text, start, end, size = 84, color = INK, sub = false, y = 62, punch = false }: {
  text: string; start: number; end: number; size?: number; color?: string; sub?: boolean; y?: number; punch?: boolean;
}) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 5, end - 6, end], [0, 1, 1, 0], clamp);
  const s = punch
    ? interpolate(f, [start, start + 8], [2.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
    : interpolate(f, [start, start + 10], [1.35, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: `${y}%`, textAlign: "center",
      fontSize: size, fontWeight: 800, color, letterSpacing: sub ? 9 : 3, lineHeight: 1.12,
      fontStyle: sub ? "normal" : "italic", opacity: o, transform: `scale(${s})`,
      textShadow: "0 3px 26px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)",
      fontFamily: "sans-serif",
    }}>
      {text}
    </div>
  );
}

/* ---------- treatment arsip: grain, goresan, vignette, letterbox ---------- */
function Grain() {
  const f = useCurrentFrame();
  const r = rng(Math.floor(f) * 7919 + 13);
  return (
    <>
      {Array.from({ length: 110 }, (_, i) => {
        const dark = r() < 0.5;
        return <div key={i} style={{ position: "absolute", left: r() * W, top: 128 + r() * (H - 256), width: 2 + r() * 3, height: 2 + r() * 3, background: dark ? "#000" : "#fff", opacity: 0.05 + r() * 0.07 }} />;
      })}
      {f % 9 < 2 && <div style={{ position: "absolute", left: 300 + r() * 1200, top: 0, bottom: 0, width: 1.5, background: "#fff", opacity: 0.05 }} />}
    </>
  );
}
function Vignette() {
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.62) 100%)" }} />;
}
function Letterbox() {
  return <><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 128, background: "#000" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 128, background: "#000" }} /></>;
}

/* dip ke hitam singkat di cut besar */
function Dip({ at }: { at: number }) {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 4) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#000", opacity: interpolate(t, [0, 2, 4], [0, 0.9, 0], clamp) }} />;
}

function Scene() {
  return (
    <AbsoluteFill style={{ background: "#060504", overflow: "hidden" }}>
      {/* ===== footage ===== */}
      <Clip src={staticFile("clip-march.mp4")}     from={0}   dur={75}  trim={20} zoom={0.06} dim={0.25} />
      <Clip src={staticFile("clip-rockets.mp4")}   from={75}  dur={60}  trim={45} zoom={0.05} />
      <Clip src={staticFile("clip-rifle.mp4")}     from={135} dur={65}  trim={10} zoom={0.06} />
      <Clip src={staticFile("clip-mg.mp4")}        from={200} dur={60}  trim={18} zoom={0.05} />
      <Clip src={staticFile("clip-bombers.mp4")}   from={260} dur={60}  trim={12} zoom={0.06} />
      <Clip src={staticFile("clip-helmet.mp4")}    from={320} dur={80}  trim={25} zoom={0.11} dim={0.3} />
      <Clip src={staticFile("clip-formation.mp4")} from={440} dur={60}  trim={30} zoom={0.05} />
      <Clip src={staticFile("clip-drop.mp4")}      from={500} dur={45}  trim={0}  zoom={0.05} />
      <Clip src={staticFile("clip-cheer.mp4")}     from={545} dur={25}  trim={45} zoom={0.08} />

      {/* ===== cut flashes ===== */}
      <Dip at={75} />
      <Dip at={320} />
      <Dip at={440} />

      {/* ===== beats teks ===== */}
      <Line text="DESEMBER 1944"            start={12}  end={48}  size={56} sub color={DIM} y={40} />
      <Line text="ARDENNES · BELGIA"        start={30}  end={62}  size={30} sub color={DIM} y={58} />
      <Line text="16 DESEMBER, PUKUL 04.00" start={86}  end={128} size={72} />
      <Line text="DIVISI KE-101"            start={142} end={168} size={90} />
      <Line text="TERKEPUNG."               start={168} end={196} size={110} color="#ffdf9e" />
      <Line text="LIMA HARI."               start={206} end={232} size={80} />
      <Line text="TANPA BANTUAN."           start={232} end={258} size={80} />
      <Line text="MUSUH MEMINTA MENYERAH."  start={268} end={315} size={78} color="#ffd28a" />
      <Line text="JENDERAL McAULIFFE MENJAWAB:" start={338} end={392} size={44} sub color={DIM} y={38} />
      <Line text="NUTS."                    start={402} end={438} size={200} color="#ffffff" y={32} punch />
      <Line text="23 DESEMBER — LANGIT BERSIH." start={448} end={495} size={62} color="#f2e9d2" />
      <Line text="BANTUAN TIBA DARI UDARA." start={505} end={540} size={60} color="#f2e9d2" />
      <Line text="BASTOGNE"                 start={572} end={600} size={110} y={36} />
      <Line text="kota yang tak pernah jatuh"  start={582} end={600} size={30} sub color={DIM} y={60} />

      <Vignette />
      <Grain />
      <Letterbox />
      <Audio src={staticFile("war3.wav")} />
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="war3" component={Scene} width={W} height={H} fps={30} durationInFrames={600} />);
