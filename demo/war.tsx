// MALAM TERAKHIR DI ARDENNES — cerita perang pendek, gaya trailer sinematik.
// Letterbox 2.39:1, ledakan, tracer fire, ember, kinetic text. 600 frame @30fps = 20 detik.
// Render: raea render demo/war.tsx -o war.mp4
import {
  AbsoluteFill, Audio, Composition, Easing, Mix, interpolate, registerRoot, staticFile, useCurrentFrame,
} from "raea";

const W = 1920, H = 1080;
const INK = "#e8e2d5";
const DIM = "#7d8296";

function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ember yang naik pelan, berkelip
function Embers({ n, start, end, seed, color = "#ff9a4c" }: { n: number; start: number; end: number; seed: number; color?: string }) {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x0 = r() * W, h = 300 + r() * 500, sp = 14 + r() * 26, ph = r() * 6.28, sz = 2 + r() * 5;
        const t = f - start;
        const y = H + 40 - ((t * sp) % (H + h)) - ph * 20;
        const x = x0 + Math.sin(t / 9 + ph) * 26;
        const o = interpolate(f, [start, start + 15, end - 12, end], [0, 0.75, 0.75, 0], clamp) * (0.45 + 0.55 * Math.abs(Math.sin(t / 7 + ph)));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz / 2, background: color, opacity: o }} />;
      })}
    </>
  );
}

// ledakan: flash layar + bola api melebar + puing beterbangan + asap
function Blast({ x, y, start, size = 300 }: { x: number; y: number; start: number; size?: number }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > 34) return null;
  const r = rng(start * 7 + 3);
  const s = size / 300;
  // bola api: cepat membesar lalu padam
  const fr = interpolate(t, [0, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fo = interpolate(t, [0, 2, 16, 24], [0, 1, 0.6, 0], clamp);
  // asap: lambat, lebih lama
  const sm = interpolate(t, [6, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const smo = interpolate(t, [6, 14, 28, 34], [0, 0.5, 0.35, 0], clamp);
  return (
    <>
      <div style={{
        position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2,
        background: `radial-gradient(circle, #fff6d8 0%, #ffb14e 30%, #ff5a1e 62%, transparent 72%)`,
        transform: `scale(${fr})`, opacity: fo,
      }} />
      <div style={{
        position: "absolute", left: x - size * 0.65, top: y - size * 0.75, width: size * 1.3, height: size * 1.3, borderRadius: "50%",
        background: `radial-gradient(circle, #3a2c20 0%, transparent 65%)`, transform: `scale(${sm}) translateY(${-30 * sm}px)`, opacity: smo,
      }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = r() * 6.283, v = (4 + r() * 10) * s, sz = 3 + r() * 5 * s;
        const dx = Math.cos(a) * v * t, dy = Math.sin(a) * v * t + 1.6 * t * t; // gravitasi
        const o = interpolate(t, [0, 4, 22, 30], [0, 1, 0.7, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: x + dx, top: y + dy, width: sz, height: sz, borderRadius: sz / 2, background: i % 3 ? "#ffcf7d" : "#ff6a2a", opacity: o }} />;
      })}
      {t < 6 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${(x / W) * 100}% ${(y / H) * 100}%, #ffdfa8 0%, rgba(255,120,40,${0.8 - t * 0.15}) 40%, transparent 75%)`, opacity: interpolate(t, [0, 5], [0.9, 0], clamp) }} />}
    </>
  );
}

// kilat pelacak menyilang layar
function Tracer({ y, dir, start, dur, len = 240, color = "#ffe9b0" }: { y: number; dir: 1 | -1; start: number; dur: number; len?: number; color?: string }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const x = dir === 1 ? -len + p * (W + 2 * len) : W + len - p * (W + 2 * len);
  const dy = (dir === 1 ? 1 : -1) * p * 30; // sedikit menukik
  return (
    <div style={{ position: "absolute", left: x - len / 2, top: y + dy, width: len, height: 3.5, borderRadius: 2, background: `linear-gradient(${dir === 1 ? 90 : -90}deg, transparent, ${color} 55%, #fff)`, boxShadow: `0 0 14px ${color}`, opacity: interpolate(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0], clamp) }} />
  );
}

// guncangan kamera: offset acak menurun selama dur
function shakeAmp(f: number, hits: [number, number][], decay = 14) {
  let a = 0;
  for (const [t0, m] of hits) if (f >= t0) a += m * Math.exp(-(f - t0) / decay);
  return a;
}
function Shake({ hits, children }: { hits: [number, number][]; children: React.ReactNode }) {
  const f = useCurrentFrame();
  const a = shakeAmp(f, hits);
  const r = rng(Math.floor(f) * 911 + 7);
  const dx = (r() - 0.5) * 2 * a, dy = (r() - 0.5) * 2 * a * 0.6;
  return <div style={{ position: "absolute", inset: -40, transform: `translate(${dx}px, ${dy}px)` }}>{children}</div>;
}

// baris teks masuk dengan slam + opsional jitter kecil
function Line({ text, start, end, size = 84, color = INK, sub = false, y = "center" }: { text: string; start: number; end: number; size?: number; color?: string; sub?: boolean; y?: "center" | "lower" }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 6, end - 8, end], [0, 1, 1, 0], clamp);
  const s = interpolate(f, [start, start + 10], [1.5, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const r = rng(start + text.length);
  const jx = f < start + 14 ? (r() - 0.5) * 8 : 0;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y === "center" ? "42%" : "64%", textAlign: "center",
      fontSize: size, fontWeight: 800, color, letterSpacing: sub ? 10 : 4, lineHeight: 1.15,
      fontStyle: sub ? "normal" : "italic", opacity: o,
      transform: `scale(${s}) translate(${jx}px, 0)`,
      textShadow: "0 4px 30px rgba(0,0,0,0.8)",
    }}>
      {text}
    </div>
  );
}

// ridgeline siluet depan
function Ridge({ color = "#04050a" }: { color?: string }) {
  const r = rng(42);
  return (
    <div style={{ position: "absolute", left: -60, right: -60, bottom: -14, height: 190, background: color }}>
      {Array.from({ length: 9 }, (_, i) => {
        const w = 180 + r() * 320, h = 30 + r() * 90;
        return <div key={i} style={{ position: "absolute", left: i * 235 - 40, top: -h + 16, width: w, height: h, background: color, borderRadius: "46% 54% 0 0", transform: `rotate(${(r() - 0.5) * 6}deg)` }} />;
      })}
    </div>
  );
}

function Vignette() {
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)" }} />;
}
// grain film: titik-titik acak tiap frame, dithering untuk gradient gelap (anti banding encoder)
function Grain({ n = 130 }: { n?: number }) {
  const f = useCurrentFrame();
  const r = rng(Math.floor(f) * 7919 + 13);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const dark = r() < 0.5;
        return <div key={i} style={{ position: "absolute", left: r() * W, top: 128 + r() * (H - 256), width: 2 + r() * 3.5, height: 2 + r() * 3.5, background: dark ? "#000" : "#fff", opacity: 0.06 + r() * 0.08 }} />;
      })}
    </>
  );
}
function Letterbox() {
  return <><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 128, background: "#000" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 128, background: "#000" }} /></>;
}

const HITS: [number, number][] = [[60, 26], [255, 20], [312, 22], [330, 18], [420, 34]];

function Scene() {
  const f = useCurrentFrame();
  const dawn = interpolate(f, [420, 480], [0, 1], clamp); // 420: ledakan terbesar -> fajar
  const nightBg = "#0a0e1a";
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "sans-serif", overflow: "hidden" }}>
      <Shake hits={HITS}>
        {/* langit: malam -> fajar */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${nightBg} 0%, #0d1120 55%, #141a2c 100%)` }} />
        {dawn > 0 && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2a3350 0%, #8a5a5c 48%, #e8a76a 78%, #f4c98a 100%)", opacity: dawn }} />}
        {/* matahari fajar kecil */}
        {dawn > 0.4 && <div style={{ position: "absolute", left: "48%", top: "62%", width: 90, height: 90, borderRadius: 45, background: "radial-gradient(circle, #fff3d0, #f4b95e 70%, transparent 72%)", opacity: dawn, boxShadow: "0 0 80px #f4b95e" }} />}

        {/* ember selalu ada, mereda saat fajar */}
        <Embers n={26} start={0} end={560} seed={11} />
        {f < 420 && <Embers n={14} start={60} end={420} seed={77} color="#ff5a1e" />}

        {/* ridgeline */}
        <Ridge color={dawn > 0.5 ? "#0d0f16" : "#04050a"} />

        {/* tracers periode aksi */}
        {f >= 100 && f < 360 && (
          <>
            <Tracer y={430} dir={1} start={104} dur={26} />
            <Tracer y={500} dir={-1} start={118} dur={22} color="#ffca7d" />
            <Tracer y={560} dir={1} start={150} dur={20} />
            <Tracer y={470} dir={-1} start={196} dur={24} />
            <Tracer y={540} dir={1} start={230} dur={18} len={320} />
            <Tracer y={440} dir={-1} start={252} dur={21} len={300} color="#ffca7d" />
            <Tracer y={590} dir={1} start={280} dur={19} />
            <Tracer y={480} dir={-1} start={300} dur={23} />
            <Tracer y={520} dir={1} start={322} dur={17} len={340} />
            <Tracer y={460} dir={-1} start={336} dur={19} color="#ffca7d" />
          </>
        )}

        {/* ledakan sesuai timeline audio */}
        <Blast x={W * 0.72} y={620} start={60} size={560} />
        <Blast x={W * 0.25} y={660} start={255} size={380} />
        <Blast x={W * 0.78} y={640} start={312} size={430} />
        <Blast x={W * 0.5} y={680} start={330} size={330} />
        <Blast x={W * 0.5} y={560} start={420} size={900} />

        {/* muzzle flashes kecil di ridge saat aksi */}
        {f >= 195 && f < 345 && (
          <>
            {[205, 232, 268, 296, 318, 340].map((t, i) => {
              const on = (f - t) % 26 < 3 && f >= t;
              const r = rng(i * 37);
              return on ? <div key={i} style={{ position: "absolute", left: 150 + r() * 1600, top: 780 + r() * 60, width: 26, height: 26, borderRadius: 13, background: "radial-gradient(circle,#fff8dc,#ffb54e 60%,transparent 70%)" }} /> : null;
            })}
          </>
        )}

        {/* ===== beats teks ===== */}
        <Line text="NOVEMBER 1944" start={8} end={52} size={64} sub color={DIM} y="center" />
        <Line text="PERBATASAN ARDENNES" start={22} end={52} size={34} sub color={DIM} y="lower" />
        <Line text="MALAM ITU," start={64} end={92} size={120} />
        <Line text="PERANG TIBA." start={92} end={128} size={120} color="#ff8a3c" />
        <Line text="200 TENTARA." start={140} end={170} size={96} />
        <Line text="SATU PERINTAH:" start={170} end={196} size={64} sub color={DIM} />
        <Line text="TAHAN GARIS INI." start={196} end={236} size={110} />
        <Line text="MUSUH DATANG DARI TIMUR." start={246} end={300} size={82} color="#ffca7d" />
        <Line text="TAK ADA JALAN MUNDUR." start={306} end={352} size={98} />
        <Line text="…lalu, sunyi." start={366} end={412} size={52} sub color={DIM} />
        <Line text="KETIKA PAGI TIBA," start={452} end={492} size={72} color="#f4e8ce" />
        <Line text="GARIS ITU MASIH BERDIRI." start={492} end={544} size={96} color="#ffd9a0" />
        <Line text="MALAM TERAKHIR DI ARDENNES" start={548} end={600} size={76} y="center" />
        <Line text="sebuah cerita dalam 20 detik" start={560} end={600} size={30} sub color={DIM} y="lower" />

        {/* detak jantung saat senyap: denyut kecil */}
        {f >= 372 && f < 420 && (f % 40 < 6) && (
          <div style={{ position: "absolute", left: "49.2%", top: "30%", width: 20, height: 20, borderRadius: 10, background: "#ff3b30", opacity: interpolate((f % 40), [0, 6], [0.9, 0], clamp), boxShadow: "0 0 30px #ff3b30" }} />
        )}

        <Vignette />
      </Shake>
      <Grain />
      <Letterbox />
      <Audio src={staticFile("war.wav")} />
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="war" component={Scene} width={W} height={H} fps={30} durationInFrames={600} />);
