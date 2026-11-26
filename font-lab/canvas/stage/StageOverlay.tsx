/**
 * Outline stage overlay — everything drawn *behind* the outlines: the em box,
 * metric lines, baseline, advance width, side bearings, grid and the rulers.
 * Kept separate from the interactive stage so the guides stay pure/presentational.
 */
import type { Mapper } from '../useStageView';
import type { Metrics } from '../../core/project';

export interface OverlayGuide {
  id: string;
  y: number;
  ar: string;
  en: string;
  tone: 'ascender' | 'cap' | 'x' | 'baseline' | 'descender' | 'user';
}

export function guideLines(metrics: Metrics, userGuides: number[]): OverlayGuide[] {
  return [
    { id: 'ascender', y: metrics.ascender, ar: 'العلوي', en: 'Ascender', tone: 'ascender' },
    { id: 'cap', y: metrics.capHeight, ar: 'الكابيتال', en: 'Cap height', tone: 'cap' },
    { id: 'x', y: metrics.xHeight, ar: 'الارتفاع الصغير', en: 'x-height', tone: 'x' },
    { id: 'baseline', y: 0, ar: 'خط القاعدة', en: 'Baseline', tone: 'baseline' },
    { id: 'descender', y: metrics.descender, ar: 'السفلي', en: 'Descender', tone: 'descender' },
    ...userGuides.map((y, index) => ({ id: `guide-${index}`, y, ar: `دليل ${index + 1}`, en: `Guide ${index + 1}`, tone: 'user' as const })),
  ];
}

export function StageGrid({
  mapper,
  upm,
  width,
  height,
  step,
}: {
  mapper: Mapper;
  upm: number;
  width: number;
  height: number;
  step: number;
}) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; strong: boolean }> = [];
  for (let value = 0; value <= upm; value += step) {
    const left = mapper.toScreen(0, value);
    const right = mapper.toScreen(upm, value);
    const bottom = mapper.toScreen(value, 0);
    const top = mapper.toScreen(value, upm);
    const strong = value % (step * 5) === 0;
    lines.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y, strong });
    lines.push({ x1: bottom.x, y1: bottom.y, x2: top.x, y2: top.y, strong });
  }
  return (
    <g className="fl-grid" aria-hidden="true">
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          className={line.strong ? 'is-strong' : ''}
        />
      ))}
      <line
        x1={mapper.toScreen(-upm * 0.15, 0).x}
        y1={mapper.toScreen(0, 0).y}
        x2={mapper.toScreen(upm * 1.15, 0).x}
        y2={mapper.toScreen(0, 0).y}
        className="is-axis"
      />
      <line
        x1={mapper.toScreen(0, 0).x}
        y1={mapper.toScreen(0, -upm * 0.15).y}
        x2={mapper.toScreen(0, 0).x}
        y2={mapper.toScreen(0, upm * 1.15).y}
        className="is-axis"
      />
      {width > 0 && height > 0 ? null : null}
    </g>
  );
}

export function MetricGuides({
  mapper,
  metrics,
  userGuides,
  width,
  height,
  ar,
}: {
  mapper: Mapper;
  metrics: Metrics;
  userGuides: number[];
  width: number;
  height: number;
  ar: boolean;
}) {
  const guides = guideLines(metrics, userGuides);
  return (
    <g className="fl-metrics" aria-hidden="true">
      {guides.map((guide) => {
        const start = mapper.toScreen(-metrics.unitsPerEm * 0.1, guide.y);
        const end = mapper.toScreen(metrics.unitsPerEm * 1.1, guide.y);
        // keep labels inside the canvas even when a metric sits outside the em box
        const labelY = Math.min(height - 6, Math.max(12, start.y - 5));
        return (
          <g key={guide.id} className={`fl-metric fl-metric-${guide.tone}`}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
            {/* explicit direction keeps the label inside the canvas in both languages */}
            <text
              x={ar ? width - 10 : 10}
              y={labelY}
              textAnchor={ar ? 'end' : 'start'}
              direction="ltr"
              className="fl-metric-label"
            >
              {ar ? guide.ar : guide.en} · {Math.round(guide.y)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function EmBox({ mapper, upm }: { mapper: Mapper; upm: number }) {
  const topLeft = mapper.toScreen(0, upm);
  const bottomRight = mapper.toScreen(upm, 0);
  return (
    <rect
      className="fl-em-box"
      x={topLeft.x}
      y={topLeft.y}
      width={Math.max(0, bottomRight.x - topLeft.x)}
      height={Math.max(0, bottomRight.y - topLeft.y)}
    />
  );
}

export function AdvanceBox({ mapper, advance, upm }: { mapper: Mapper; advance: number; upm: number }) {
  const top = mapper.toScreen(0, upm);
  const bottom = mapper.toScreen(0, 0);
  const edge = mapper.toScreen(advance, 0);
  return (
    <g className="fl-advance" aria-hidden="true">
      <rect x={top.x} y={top.y} width={Math.max(1, edge.x - top.x)} height={Math.max(1, bottom.y - top.y)} />
      <line x1={edge.x} y1={top.y} x2={edge.x} y2={bottom.y} className="is-edge" />
      <text x={(top.x + edge.x) / 2} y={bottom.y + 16} textAnchor="middle">
        {Math.round(advance)}
      </text>
    </g>
  );
}

/** Horizontal + vertical rulers in em units. */
export function StageRulers({ mapper, width, height, upm }: { mapper: Mapper; width: number; height: number; upm: number }) {
  const step = upm >= 2000 ? 500 : 250;
  const ticks: Array<{ x: number; y: number; label: string; vertical: boolean }> = [];
  for (let value = -step; value <= upm + step; value += step) {
    const horizontal = mapper.toScreen(value, 0);
    const vertical = mapper.toScreen(0, value);
    if (horizontal.x > 0 && horizontal.x < width) ticks.push({ x: horizontal.x, y: 0, label: String(value), vertical: false });
    if (vertical.y > 0 && vertical.y < height) ticks.push({ x: 0, y: vertical.y, label: String(value), vertical: true });
  }
  return (
    <g className="fl-rulers" aria-hidden="true">
      {ticks.map((tick, index) =>
        tick.vertical ? (
          <g key={`v${index}`}>
            <line x1={0} y1={tick.y} x2={6} y2={tick.y} />
            <text x={9} y={tick.y + 3}>
              {tick.label}
            </text>
          </g>
        ) : (
          <g key={`h${index}`}>
            <line x1={tick.x} y1={height} x2={tick.x} y2={height - 8} />
            <text x={tick.x} y={height - 10} textAnchor="middle">
              {tick.label}
            </text>
          </g>
        ),
      )}
    </g>
  );
}
