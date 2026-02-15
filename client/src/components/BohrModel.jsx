import { ELEMENTS } from '../data/chemistry';

const BASE_RADIUS = 20;
const SHELL_GAP = 22;
const ELECTRON_RADIUS = 4;

export default function BohrModel({ element }) {
  const el = ELEMENTS[element];
  if (!el || !el.electronShells) return null;

  const shellCount = el.electronShells.length;
  const outerRadius = BASE_RADIUS + shellCount * SHELL_GAP;
  const size = outerRadius * 2 + 20;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Electron shells (outermost first for layering) */}
        {el.electronShells.map((count, i) => {
          const r = BASE_RADIUS + (i + 1) * SHELL_GAP;
          const electrons = [];
          for (let j = 0; j < count; j++) {
            const angle = (2 * Math.PI * j) / count - Math.PI / 2;
            electrons.push(
              <circle
                key={`e-${i}-${j}`}
                cx={cx + r * Math.cos(angle)}
                cy={cy + r * Math.sin(angle)}
                r={ELECTRON_RADIUS}
                fill="#60a5fa"
              />
            );
          }
          return (
            <g key={`shell-${i}`}>
              <circle
                cx={cx} cy={cy} r={r}
                fill="none" stroke="#4b5563" strokeWidth={1}
                strokeDasharray="4 3"
              />
              {electrons}
            </g>
          );
        })}

        {/* Nucleus */}
        <circle cx={cx} cy={cy} r={BASE_RADIUS} fill={el.color} stroke="#555" strokeWidth={1.5} />
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" dominantBaseline="central"
          fill={el.textColor} fontSize={9} fontWeight="bold"
        >
          {el.atomicNumber}p+
        </text>
        <text
          x={cx} y={cy + 8}
          textAnchor="middle" dominantBaseline="central"
          fill={el.textColor} fontSize={9} fontWeight="bold"
        >
          {el.neutrons}n
        </text>
      </svg>

      {/* Legend */}
      <div className="text-center leading-tight">
        <p className="text-xs font-semibold text-gray-200">{el.name} ({el.symbol})</p>
        <p className="text-[10px] text-gray-400">
          {el.atomicNumber}p⁺ · {el.neutrons}n · {el.atomicNumber}e⁻
        </p>
      </div>
    </div>
  );
}
