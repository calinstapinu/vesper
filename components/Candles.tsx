import data from "@/lib/candles.json";

// The hero chart's candles, redrawn as SVG at the exact positions of chart_bg.webp (same cover crop).
// Each candle lights in neon when the pointer comes near (see FX), then fades out.

export default function Candles() {
  return (
    <svg className="candles" viewBox={`0 0 ${data.w} ${data.h}`} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {data.candles.map((c, i) => (
        <g key={i} data-c data-x={c.x} data-y={(c.hi + c.lo) / 2}>
          <line x1={c.x} x2={c.x} y1={c.hi} y2={c.lo} />
          <rect x={c.x - c.w / 2} y={c.top} width={c.w} height={c.bot - c.top} className={c.up ? "up" : "dn"} />
        </g>
      ))}
    </svg>
  );
}
