// MALAM TERAKHIR DI ARDENNES v2 — cerita perang, siluet SVG detail: pasukan, tank, pesawat,
// searchlight, ledakan tak beraturan, rimba Ardennes, kawat berduri. 600 frame @30fps.
// Render HQ: raea render demo/war2.tsx -o demo/frames2/ ; lalu ffmpeg libx264 crf 15.
import {
  AbsoluteFill, Audio, Composition, Easing, Mix, interpolate, registerRoot, staticFile, useCurrentFrame,
} from "raea";

const W = 1920, H = 1080;
const INK = "#e8e2d5";
const DIM = "#8a8fa3";
const BLACK = "#05060a";

function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/* ================= siluet SVG ================= */

// tentara berlari dengan senapan (viewBox 0 0 100 160)
function SoldierShape({ color }: { color: string }) {
  return (
    <svg width={100} height={160} viewBox="0 0 100 160" style={{ display: "block" }}>
      <g fill={color}>
        <ellipse cx={52} cy={17} rx={15} ry={10} />
        <polygon points="40,26 60,24 70,66 52,72 38,60" />
        <rect x={56} y={30} width={48} height={5} transform={`rotate(-16 56 30)`} />
        <rect x={96} y={20} width={10} height={8} transform={`rotate(-16 96 20)`} />
        <polygon points="52,70 40,104 30,148 41,151 54,108 60,84" />
        <polygon points="62,70 64,108 76,146 86,142 74,100 70,70" />
        <polygon points="36,40 20,66 26,72 44,52" />
      </g>
    </svg>
  );
}

// tank (viewBox 0 0 280 130)
function TankShape({ color }: { color: string }) {
  return (
    <svg width={280} height={130} viewBox="0 0 280 130" style={{ display: "block" }}>
      <g fill={color}>
        <rect x={8} y={84} width={264} height={42} rx={21} />
        {[38, 82, 126, 170, 214, 252].map((cx) => <circle key={cx} cx={cx} cy={105} r={16} />)}
        <polygon points="26,66 66,46 214,46 252,66 252,86 26,86" />
        <polygon points="88,46 98,26 168,26 178,46" />
        <rect x={172} y={32} width={92} height={7} />
        <rect x={258} y={29} width={14} height={12} />
        <rect x={104} y={6} width={3} height={22} />
      </g>
    </svg>
  );
}

// pesawat tempur melintas (viewBox 0 0 220 70)
function PlaneShape({ color }: { color: string }) {
  return (
    <svg width={220} height={70} viewBox="0 0 220 70" style={{ display: "block" }}>
      <g fill={color}>
        <polygon points="8,36 64,28 168,24 214,32 168,38 64,40" />
        <polygon points="76,30 36,6 56,6 108,27" />
        <polygon points="84,38 52,58 70,58 112,37" />
        <polygon points="186,28 172,10 182,27 196,30" />
      </g>
    </svg>
  );
}

// rimba: deretan pinus di horison
function Treeline({ y, seed, color, h = 90 }: { y: number; seed: number; color: string; h?: number }) {
  const r = rng(seed);
  const trees = Array.from({ length: 26 }, (_, i) => {
    const th = h * (0.6 + r() * 0.8), tw = th * 0.55;
    return { x: i * 78 - 30, h: th, w: tw };
  });
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: h }}>
      <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} style={{ display: "block" }}>
        <g fill={color}>
          {trees.map((t, i) => (
            <polygon key={i} points={`${t.x},${h} ${t.x + t.w / 2},${h - t.h} ${t.x + t.w},${h}`} />
          ))}
          <rect x={0} y={h - 8} width={W} height={8} />
        </g>
      </svg>
    </div>
  );
}

// kawat berduri di foreground
function BarbedWire({ y, color }: { y: number; color: string }) {
  const n = 24;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: 60, opacity: 0.9 }}>
      <svg width={W} height={60} viewBox={`0 0 ${W} 60`} style={{ display: "block" }}>
        <g stroke={color} strokeWidth={3} fill="none">
          <polyline points={Array.from({ length: 64 }, (_, i) => `${i * (W / 63)},${i % 2 ? 18 : 42}`).join(" ")} />
          <polyline points={Array.from({ length: 64 }, (_, i) => `${i * (W / 63)},${i % 2 ? 42 : 18}`).join(" ")} />
        </g>
        <g stroke={color} strokeWidth={2.4}>
          {Array.from({ length: n }, (_, i) => {
            const x = i * (W / n) + 40;
            return <g key={i}><line x1={x - 7} y1={23} x2={x + 7} y2={37} /><line x1={x + 7} y1={23} x2={x - 7} y2={37} /></g>;
          })}
        </g>
      </svg>
    </div>
  );
}

// searchlight: balok cahaya menyapu langit
function Searchlight({ x, phase, period, color = "#cfe4ff" }: { x: number; phase: number; period: number; color?: string }) {
  const f = useCurrentFrame();
  const t = (f + phase) % period;
  const ang = interpolate(t, [0, period / 2, period], [-26, 26, -26]);
  return (
    <div style={{ position: "absolute", left: x - 160, top: 90, width: 320, height: 830, transform: `rotate(${ang}deg)`, transformOrigin: "50% 100%", opacity: 0.16 }}>
      <svg width={320} height={830} viewBox="0 0 320 830" style={{ display: "block" }}>
        <polygon points="160,830 40,0 280,0" fill={color} opacity={0.55} />
        <polygon points="160,830 96,0 224,0" fill={color} opacity={0.5} />
      </svg>
    </div>
  );
}

// ledakan bentuk tak beraturan: dua lapis polygon bergerigi
function Blast({ x, y, start, size = 300 }: { x: number; y: number; start: number; size?: number }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > 36) return null;
  const r = rng(start * 7 + 3);
  const jag = (rad: number, n: number, seed: number) => {
    const rr = rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const d = rad * (0.55 + rr() * 0.65);
      return `${(Math.cos(a) * d).toFixed(1)},${(Math.sin(a) * d).toFixed(1)}`;
    }).join(" ");
  };
  const s = interpolate(t, [0, 22], [0.1, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const o = interpolate(t, [0, 2, 18, 26], [0, 1, 0.55, 0], clamp);
  const sm = interpolate(t, [7, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const smo = interpolate(t, [7, 15, 30, 36], [0, 0.5, 0.3, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x - size, top: y - size, opacity: o }}>
        <svg width={size * 2} height={size * 2} viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} style={{ display: "block", transform: `scale(${s})` }}>
          <polygon points={jag(size * 0.9, 14, start + 5)} fill="#ff7a26" />
          <polygon points={jag(size * 0.55, 10, start + 9)} fill="#ffc46a" />
          <polygon points={jag(size * 0.26, 8, start + 13)} fill="#fff3cf" />
        </svg>
      </div>
      <div style={{
        position: "absolute", left: x - size * 0.6, top: y - size * 0.85, width: size * 1.2, height: size * 1.2, borderRadius: "50%",
        background: "radial-gradient(circle, #33261c 0%, transparent 66%)", transform: `scale(${sm}) translateY(${-36 * sm}px)`, opacity: smo,
      }} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = r() * 6.283, v = 4 + r() * 9, sz = 3 + r() * 4;
        const dx = Math.cos(a) * v * t, dy = Math.sin(a) * v * t + 1.4 * t * t;
        const oo = interpolate(t, [0, 4, 24, 32], [0, 1, 0.6, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: x + dx, top: y + dy, width: sz, height: sz, borderRadius: sz / 2, background: i % 3 ? "#ffcf7d" : "#ff6a2a", opacity: oo }} />;
      })}
      {t < 6 && <div style={{ position: "absolute", inset: -40, background: `radial-gradient(circle at ${(x / W) * 100}% ${(y / H) * 100}%, #ffdfa8 0%, rgba(255,120,40,${0.75 - t * 0.15}) 42%, transparent 75%)`, opacity: interpolate(t, [0, 5], [0.9, 0], clamp) }} />}
    </>
  );
}

// kilat pelacak
function Tracer({ y, dir, start, dur, len = 240, color = "#ffe9b0" }: { y: number; dir: 1 | -1; start: number; dur: number; len?: number; color?: string }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const x = dir === 1 ? -len + p * (W + 2 * len) : W + len - p * (W + 2 * len);
  const dy = (dir === 1 ? 1 : -1) * p * 26;
  return (
    <div style={{ position: "absolute", left: x - len / 2, top: y + dy, width: len, height: 3.5, borderRadius: 2, background: `linear-gradient(${dir === 1 ? 90 : -90}deg, transparent, ${color} 55%, #fff)`, boxShadow: `0 0 14px ${color}`, opacity: interpolate(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0], clamp) }} />
  );
}

function shakeAmp(f: number, hits: [number, number][], decay = 14) {
  let a = 0;
  for (const [t0, m] of hits) if (f >= t0) a += m * Math.exp(-(f - t0) / decay);
  return a;
}
function Shake({ hits, children }: { hits: [number, number][]; children: React.ReactNode }) {
  const f = useCurrentFrame();
  const a = shakeAmp(f, hits);
  const r = rng(Math.floor(f) * 911 + 7);
  return <div style={{ position: "absolute", inset: -40, transform: `translate(${(r() - 0.5) * 2 * a}px, ${(r() - 0.5) * 2 * a * 0.6}px)` }}>{children}</div>;
}

function Embers({ n, start, end, seed, color = "#ff9a4c" }: { n: number; start: number; end: number; seed: number; color?: string }) {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x0 = r() * W, sp = 14 + r() * 26, ph = r() * 6.28, sz = 2 + r() * 4;
        const t = f - start;
        const y = H + 40 - ((t * sp) % (H + 340)) - ph * 20;
        const x = x0 + Math.sin(t / 9 + ph) * 26;
        const o = interpolate(f, [start, start + 15, end - 12, end], [0, 0.7, 0.7, 0], clamp) * (0.4 + 0.6 * Math.abs(Math.sin(t / 7 + ph)));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz / 2, background: color, opacity: o }} />;
      })}
    </>
  );
}

function Line({ text, start, end, size = 84, color = INK, sub = false, y = "center" }: { text: string; start: number; end: number; size?: number; color?: string; sub?: boolean; y?: "center" | "lower" }) {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const o = interpolate(f, [start, start + 6, end - 8, end], [0, 1, 1, 0], clamp);
  const s = interpolate(f, [start, start + 10], [1.5, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y === "center" ? "40%" : "62%", textAlign: "center",
      fontSize: size, fontWeight: 800, color, letterSpacing: sub ? 10 : 4, lineHeight: 1.15,
      fontStyle: sub ? "normal" : "italic", opacity: o, transform: `scale(${s})`,
      textShadow: "0 4px 30px rgba(0,0,0,0.85)",
    }}>
      {text}
    </div>
  );
}

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
function Vignette() {
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />;
}
function Letterbox() {
  return <><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 128, background: "#000" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 128, background: "#000" }} /></>;
}

const HITS: [number, number][] = [[60, 26], [255, 20], [312, 22], [330, 18], [420, 34]];

// pasukan maju: barisan tentara dengan parallax, kiri -> kanan lambat
function MarchingColumn({ start, end }: { start: number; end: number }) {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const r = rng(99);
  const soldiers = Array.from({ length: 7 }, (_, i) => ({
    x0: -160 + i * 300 + r() * 120,
    sc: 0.55 + r() * 0.5,
    speed: 1.1 + r() * 0.7,
    ph: r() * 6.28,
  }));
  const rowO = interpolate(f, [start, start + 20, end - 14, end], [0, 1, 1, 0], clamp);
  return (
    <>
      {soldiers.map((s, i) => {
        const x = s.x0 + (f - start) * s.speed;
        const bob = Math.abs(Math.sin((f - start) / 6 + s.ph)) * 7 * s.sc;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 800 - bob - s.sc * 160, transform: `scale(${s.sc})`, transformOrigin: "50% 100%", opacity: rowO }}>
            <SoldierShape color={BLACK} />
          </div>
        );
      })}
    </>
  );
}

// tank bergerak perlahan + muzzle flash di laras
function MovingTank({ start, end }: { start: number; end: number }) {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const x = interpolate(f, [start, end], [-60, 210], clamp);
  const o = interpolate(f, [start, start + 15, end - 12, end], [0, 1, 1, 0], clamp);
  const fire = (f % 34) < 4;
  return (
    <div style={{ position: "absolute", left: x, top: 770, transform: "scale(1.35)", transformOrigin: "50% 100%", opacity: o }}>
      <TankShape color={BLACK} />
      {fire && <div style={{ position: "absolute", left: 262, top: 16, width: 52, height: 40, borderRadius: "50%", background: "radial-gradient(circle,#fff8dc,#ffb54e 55%,transparent 72%)", transform: `scale(${1 - ((f % 34) / 8)})` }} />}
    </div>
  );
}

// tiga pesawat melintas tinggi
function Planes({ start }: { start: number }) {
  const f = useCurrentFrame();
  const t = f - start;
  if (t < 0 || t > 80) return null;
  const r = rng(31);
  return (
    <>
      {[0, 1, 2].map((i) => {
        const off = i * 90 + r() * 30;
        const x = W + 120 - t * 34 - off;
        const y = 210 + i * 60 + r() * 20;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: "scale(0.5) scaleX(-1)", opacity: interpolate(t, [0, 8, 72, 80], [0, 0.95, 0.95, 0], clamp) }}>
            <PlaneShape color="#0a0d16" />
            <div style={{ position: "absolute", left: 216, top: 28, width: 90, height: 3, background: "linear-gradient(-90deg, rgba(255,220,160,0.7), transparent)" }} />
          </div>
        );
      })}
    </>
  );
}

function Scene() {
  const f = useCurrentFrame();
  const dawn = interpolate(f, [420, 484], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "sans-serif", overflow: "hidden" }}>
      <Shake hits={HITS}>
        {/* langit malam -> fajar */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #070b16 0%, #0e1424 48%, #1a2138 100%)" }} />
        {dawn > 0 && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2a3350 0%, #8a5a5c 46%, #e8a76a 76%, #f4c98a 100%)", opacity: dawn }} />}
        {/* bintang samar saat malam */}
        {dawn < 0.6 && <Embers n={30} start={0} end={430} seed={7} color="#aebbd6" />}
        {dawn > 0.4 && <div style={{ position: "absolute", left: "48%", top: "60%", width: 90, height: 90, borderRadius: 45, background: "radial-gradient(circle, #fff3d0, #f4b95e 70%, transparent 72%)", opacity: dawn, boxShadow: "0 0 80px #f4b95e" }} />}

        {/* searchlights menyapu (malam saja) */}
        {f < 400 && <><Searchlight x={300} phase={0} period={210} /><Searchlight x={1500} phase={90} period={240} /></>}

        {/* rimba jauh (siluet pinus) */}
        <Treeline y={700} seed={5} color={dawn > 0.5 ? "#1a1620" : "#070a12"} h={110} />

        {/* tanah / ridge depan */}
        <div style={{ position: "absolute", left: -60, right: -60, top: 810, height: 320, background: dawn > 0.5 ? "#12141c" : "#04050a" }} />
        <BarbedWire y={852} color={dawn > 0.5 ? "#1c1f2b" : "#0a0d16"} />

        {/* pesawat saat "musuh dari timur" */}
        <Planes start={252} />

        {/* pasukan maju selama perintah */}
        <MarchingColumn start={128} end={252} />

        {/* tank selama aksi */}
        <MovingTank start={236} end={352} />

        {/* tracers */}
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

        {/* ledakan */}
        <Blast x={W * 0.72} y={600} start={60} size={340} />
        <Blast x={W * 0.22} y={640} start={255} size={240} />
        <Blast x={W * 0.8} y={630} start={312} size={280} />
        <Blast x={W * 0.5} y={670} start={330} size={210} />
        <Blast x={W * 0.5} y={540} start={420} size={560} />

        {/* ember api */}
        {f < 430 && <Embers n={16} start={60} end={430} seed={77} color="#ff5a1e" />}

        {/* beats teks */}
        <Line text="NOVEMBER 1944" start={8} end={52} size={64} sub color={DIM} />
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
        <Line text="MALAM TERAKHIR DI ARDENNES" start={548} end={600} size={76} />
        <Line text="sebuah cerita dalam 20 detik" start={560} end={600} size={30} sub color={DIM} y="lower" />

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

registerRoot(() => <Composition id="war2" component={Scene} width={W} height={H} fps={30} durationInFrames={600} />);
