import { PERIODIC_TABLE, SUPPORTED_ELEMENTS } from '../data/periodicTable';
import { ELEMENTS } from '../data/chemistry';

// Map period values to grid rows (8=lanthanides, 9=actinides get extra rows with gap)
const ROW_MAP = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 9, 9: 10 };

export default function PeriodicTable({ highlight = [], onElementClick, onClose }) {
  const highlightSet = new Set(highlight);

  return (
    <div className="absolute inset-0 z-10 bg-gray-950/95 flex flex-col items-center justify-center p-3 overflow-auto">
      <div className="w-full max-w-[720px]">
        <p className="text-sm font-semibold text-emerald-400 text-center mb-2">Tabla Periódica</p>

        {/* Grid: 18 columns, 10 rows (7 periods + gap + 2 f-block rows) */}
        <div
          className="grid gap-[2px] mx-auto"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(10, auto)',
          }}
        >
          {PERIODIC_TABLE.map((el) => {
            const isSupported = SUPPORTED_ELEMENTS.has(el.symbol);
            const isHighlighted = highlightSet.has(el.symbol);
            const cpk = ELEMENTS[el.symbol];
            const row = ROW_MAP[el.period];

            // Determine colors
            let bg, text, border;
            if (isHighlighted && cpk) {
              bg = cpk.color;
              text = cpk.textColor;
              border = 'ring-2 ring-emerald-400';
            } else if (isSupported && cpk) {
              bg = cpk.color;
              text = cpk.textColor;
              border = '';
            } else {
              bg = '#1f2937';
              text = '#6b7280';
              border = '';
            }

            return (
              <div
                key={el.z}
                onClick={() => isSupported && onElementClick?.(el.symbol)}
                className={`flex flex-col items-center justify-center rounded-sm select-none
                  ${isSupported ? 'cursor-pointer hover:brightness-125' : 'opacity-50'}
                  ${border}`}
                style={{
                  gridColumn: el.group,
                  gridRow: row,
                  backgroundColor: bg,
                  color: text,
                  minHeight: 36,
                  padding: '2px 1px',
                }}
                title={`${el.name} (${el.symbol}) - Z=${el.z}`}
              >
                <span className="text-[7px] leading-none opacity-70">{el.z}</span>
                <span className="text-[11px] font-bold leading-tight">{el.symbol}</span>
                <span className="text-[6px] leading-none opacity-70 truncate max-w-full">{el.name}</span>
              </div>
            );
          })}

          {/* Lanthanide / Actinide labels */}
          <div
            className="flex items-center justify-end pr-1 text-[7px] text-gray-500"
            style={{ gridColumn: '1 / 3', gridRow: 9 }}
          >
            Lantánidos
          </div>
          <div
            className="flex items-center justify-end pr-1 text-[7px] text-gray-500"
            style={{ gridColumn: '1 / 3', gridRow: 10 }}
          >
            Actínidos
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-600" />
            <span>Elemento interactivo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-700 opacity-50" />
            <span>No interactivo</span>
          </div>
          {highlight.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 ring-1 ring-emerald-400" />
              <span>Resaltado</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="block mx-auto mt-3 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
        >
          Cerrar tabla periódica
        </button>
      </div>
    </div>
  );
}
