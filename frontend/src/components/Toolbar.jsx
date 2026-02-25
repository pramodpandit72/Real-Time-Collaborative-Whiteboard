import { Undo2, Redo2, Trash2, Camera, Minus, Plus, Type } from 'lucide-react';

const COLORS = [
  '#1e1e1e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'
];

const Toolbar = ({
  tool, setTool, color, setColor, brushSize, setBrushSize,
  onUndo, onRedo, onClear, onSaveSnapshot,
  canUndo, canRedo, canClear, canDraw
}) => (
  <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 gap-0.5 shadow-sm overflow-y-auto">
    {/* Draw Tools */}
    <Label text="Draw" />
    <ToolBtn icon={<PenIcon />} active={tool === 'pencil'} onClick={() => setTool('pencil')} disabled={!canDraw} title="Pen" />
    <ToolBtn icon={<EraserIcon />} active={tool === 'eraser'} onClick={() => setTool('eraser')} disabled={!canDraw} title="Eraser" />
    <ToolBtn icon={<Type className="w-[18px] h-[18px]" />} active={tool === 'text'} onClick={() => setTool('text')} disabled={!canDraw} title="Text" />

    <Divider />

    {/* Shape Tools */}
    <Label text="Shapes" />
    <ToolBtn icon={<LineIcon />} active={tool === 'line'} onClick={() => setTool('line')} disabled={!canDraw} title="Line" />
    <ToolBtn icon={<ArrowIcon />} active={tool === 'arrow'} onClick={() => setTool('arrow')} disabled={!canDraw} title="Arrow" />
    <ToolBtn icon={<RectIcon />} active={tool === 'rectangle'} onClick={() => setTool('rectangle')} disabled={!canDraw} title="Rectangle" />
    <ToolBtn icon={<CircleIcon />} active={tool === 'circle'} onClick={() => setTool('circle')} disabled={!canDraw} title="Circle" />
    <ToolBtn icon={<TriangleIcon />} active={tool === 'triangle'} onClick={() => setTool('triangle')} disabled={!canDraw} title="Triangle" />
    <ToolBtn icon={<DiamondIcon />} active={tool === 'diamond'} onClick={() => setTool('diamond')} disabled={!canDraw} title="Diamond" />
    <ToolBtn icon={<StarIcon />} active={tool === 'star'} onClick={() => setTool('star')} disabled={!canDraw} title="Star" />

    <Divider />

    {/* Colors */}
    <Label text="Color" />
    <div className="grid grid-cols-2 gap-[3px]">
      {COLORS.map(c => (
        <button
          key={c} onClick={() => setColor(c)} disabled={!canDraw}
          className={`w-5 h-5 rounded-md border transition-all ${
            color === c ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-105'
          } ${!canDraw ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
    <input
      type="color" value={color} onChange={e => setColor(e.target.value)} disabled={!canDraw}
      className={`w-10 h-5 rounded border border-gray-300 dark:border-gray-600 mt-0.5 cursor-pointer ${!canDraw ? 'opacity-40' : ''}`}
    />

    <Divider />

    {/* Size */}
    <Label text="Size" />
    <SizeBtn onClick={() => setBrushSize(Math.min(brushSize + 2, 50))} disabled={!canDraw} icon={<Plus className="w-3.5 h-3.5" />} />
    <div className="w-8 h-8 flex items-center justify-center">
      <div className="rounded-full bg-gray-800 dark:bg-gray-200 transition-all"
        style={{ width: Math.max(Math.min(brushSize, 24), 4), height: Math.max(Math.min(brushSize, 24), 4) }} />
    </div>
    <SizeBtn onClick={() => setBrushSize(Math.max(brushSize - 2, 1))} disabled={!canDraw} icon={<Minus className="w-3.5 h-3.5" />} />
    <span className="text-[10px] font-mono text-gray-400">{brushSize}px</span>

    <Divider />

    {/* History */}
    <Label text="Edit" />
    <ToolBtn icon={<Undo2 className="w-[18px] h-[18px]" />} onClick={onUndo} disabled={!canUndo || !canDraw} title="Undo" />
    <ToolBtn icon={<Redo2 className="w-[18px] h-[18px]" />} onClick={onRedo} disabled={!canRedo || !canDraw} title="Redo" />

    <div className="flex-1" />

    <ToolBtn icon={<Camera className="w-[18px] h-[18px]" />} onClick={onSaveSnapshot} title="Snapshot" />
    {canClear && <ToolBtn icon={<Trash2 className="w-[18px] h-[18px]" />} onClick={onClear} title="Clear" danger />}
  </div>
);

/* ─── Helpers ─── */
const Label = ({ text }) => <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 mt-1.5">{text}</span>;
const Divider = () => <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1.5" />;

const ToolBtn = ({ icon, active, onClick, disabled, title, danger }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`p-2 rounded-xl transition-all ${
      active ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800'
      : danger ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
    {icon}
  </button>
);

const SizeBtn = ({ onClick, disabled, icon }) => (
  <button onClick={onClick} disabled={disabled}
    className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
    {icon}
  </button>
);

/* ─── SVG Icons ─── */
const S = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PenIcon = () => (
  <svg {...S}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);

// Eraser: rectangle shape
const EraserIcon = () => (
  <svg {...S}>
    <rect x="4" y="8" width="16" height="10" rx="2" transform="rotate(-20 12 13)" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

const LineIcon = () => <svg {...S}><line x1="5" y1="19" x2="19" y2="5" /></svg>;

const ArrowIcon = () => (
  <svg {...S}><line x1="5" y1="19" x2="19" y2="5" /><polyline points="12 5 19 5 19 12" /></svg>
);

const RectIcon = () => <svg {...S}><rect x="3" y="5" width="18" height="14" rx="2" /></svg>;

const CircleIcon = () => <svg {...S}><circle cx="12" cy="12" r="9" /></svg>;

const TriangleIcon = () => <svg {...S}><polygon points="12 3 22 21 2 21" /></svg>;

const DiamondIcon = () => <svg {...S}><polygon points="12 2 22 12 12 22 2 12" /></svg>;

const StarIcon = () => (
  <svg {...S}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);

export default Toolbar;
