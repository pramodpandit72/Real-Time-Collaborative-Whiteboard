import { Undo2, Redo2, Trash2, Camera, Minus, Plus, Type, Sun, Moon } from 'lucide-react';

const COLORS = [
  '#1e1e1e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'
];

const Toolbar = ({
  tool, setTool, color, setColor, brushSize, setBrushSize,
  onUndo, onRedo, onClear, onSaveSnapshot,
  canUndo, canRedo, canClear, canDraw,
  canvasDark, onToggleCanvasDark
}) => (
  <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center shadow-sm overflow-y-auto"
    style={{ width: 64 }}>

    {/* ── Canvas Mode Toggle ── */}
    <div className="w-full px-2 pt-3 pb-1">
      <button
        onClick={onToggleCanvasDark}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition ${
          canvasDark
            ? 'bg-gray-700 text-amber-400 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title={canvasDark ? 'Switch to Light Canvas' : 'Switch to Dark Canvas'}
      >
        {canvasDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        {canvasDark ? 'Light' : 'Dark'}
      </button>
    </div>

    <Divider />

    {/* ── Draw Tools ── */}
    <Label text="Draw" />
    <ToolBtn icon={<PencilIcon />} active={tool === 'pencil'} onClick={() => setTool('pencil')} disabled={!canDraw} title="Pencil" />
    <ToolBtn icon={<EraserBlockIcon />} active={tool === 'eraser'} onClick={() => setTool('eraser')} disabled={!canDraw} title="Eraser" />
    <ToolBtn icon={<Type className="w-[18px] h-[18px]" />} active={tool === 'text'} onClick={() => setTool('text')} disabled={!canDraw} title="Text" />

    <Divider />

    {/* ── Shape Tools ── */}
    <Label text="Shapes" />
    <ToolBtn icon={<LineIcon />} active={tool === 'line'} onClick={() => setTool('line')} disabled={!canDraw} title="Line" />
    <ToolBtn icon={<ArrowIcon />} active={tool === 'arrow'} onClick={() => setTool('arrow')} disabled={!canDraw} title="Arrow" />
    <ToolBtn icon={<RectIcon />} active={tool === 'rectangle'} onClick={() => setTool('rectangle')} disabled={!canDraw} title="Rectangle" />
    <ToolBtn icon={<CircleIcon />} active={tool === 'circle'} onClick={() => setTool('circle')} disabled={!canDraw} title="Circle" />
    <ToolBtn icon={<TriangleIcon />} active={tool === 'triangle'} onClick={() => setTool('triangle')} disabled={!canDraw} title="Triangle" />
    <ToolBtn icon={<DiamondIcon />} active={tool === 'diamond'} onClick={() => setTool('diamond')} disabled={!canDraw} title="Diamond" />
    <ToolBtn icon={<StarIcon />} active={tool === 'star'} onClick={() => setTool('star')} disabled={!canDraw} title="Star" />

    <Divider />

    {/* ── Colors ── */}
    <Label text="Color" />
    <div className="grid grid-cols-2 gap-[3px] px-1">
      {COLORS.map(c => (
        <button key={c} onClick={() => setColor(c)} disabled={!canDraw}
          className={`w-5 h-5 rounded-md border transition-all ${
            color === c ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-105'
          } ${!canDraw ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ backgroundColor: c }} />
      ))}
    </div>
    <input type="color" value={color} onChange={e => setColor(e.target.value)} disabled={!canDraw}
      className={`w-10 h-5 rounded border border-gray-300 dark:border-gray-600 mt-1 cursor-pointer ${!canDraw ? 'opacity-40' : ''}`} />

    <Divider />

    {/* ── Size ── */}
    <Label text="Size" />
    <SizeBtn icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setBrushSize(Math.min(brushSize + 2, 50))} disabled={!canDraw} />
    <div className="w-8 h-8 flex items-center justify-center">
      <div className="rounded-full bg-gray-800 dark:bg-gray-200 transition-all"
        style={{ width: Math.max(Math.min(brushSize, 24), 4), height: Math.max(Math.min(brushSize, 24), 4) }} />
    </div>
    <SizeBtn icon={<Minus className="w-3.5 h-3.5" />} onClick={() => setBrushSize(Math.max(brushSize - 2, 1))} disabled={!canDraw} />
    <span className="text-[10px] font-mono text-gray-400">{brushSize}px</span>

    <Divider />

    {/* ── Edit ── */}
    <Label text="Edit" />
    <ToolBtn icon={<Undo2 className="w-[18px] h-[18px]" />} onClick={onUndo} disabled={!canUndo || !canDraw} title="Undo" />
    <ToolBtn icon={<Redo2 className="w-[18px] h-[18px]" />} onClick={onRedo} disabled={!canRedo || !canDraw} title="Redo" />

    <div className="flex-1" />

    {/* ── Bottom ── */}
    <div className="flex flex-col items-center gap-0.5 mb-3">
      <ToolBtn icon={<Camera className="w-[18px] h-[18px]" />} onClick={onSaveSnapshot} title="Snapshot" />
      {canClear && <ToolBtn icon={<Trash2 className="w-[18px] h-[18px]" />} onClick={onClear} title="Clear" danger />}
    </div>
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

/* ─── Colored Pencil Icon (like MS Paint / the reference image) ─── */
const PencilIcon = () => (
  <svg width="20" height="20" viewBox="0 0 64 64">
    {/* Pencil body - yellow */}
    <rect x="22" y="4" width="16" height="46" rx="2" transform="rotate(45 30 27)" fill="#F6B93B" stroke="#2C3A47" strokeWidth="2.5" />
    {/* Pencil tip - beige/cream */}
    <polygon points="8,56 14,42 22,50" fill="#FDF2D1" stroke="#2C3A47" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Pencil point */}
    <polygon points="8,56 11,50 15,54" fill="#2C3A47" />
    {/* Eraser top - pink/red */}
    <rect x="44" y="2" width="16" height="10" rx="2" transform="rotate(45 52 7)" fill="#E55039" stroke="#2C3A47" strokeWidth="2" />
    {/* Metal band */}
    <rect x="40" y="8" width="16" height="5" rx="1" transform="rotate(45 48 10.5)" fill="#C8D6E5" stroke="#2C3A47" strokeWidth="1.5" />
  </svg>
);

/* ─── Eraser Icon (rectangle block eraser) ─── */
const EraserBlockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 64 64">
    {/* Eraser body */}
    <rect x="8" y="20" width="48" height="24" rx="4" fill="#FDA7DF" stroke="#2C3A47" strokeWidth="2.5" />
    {/* Eraser band */}
    <rect x="8" y="20" width="16" height="24" rx="4" fill="#E55039" stroke="#2C3A47" strokeWidth="2.5" />
    {/* Eraser crumbs */}
    <circle cx="18" cy="50" r="2" fill="#C8D6E5" />
    <circle cx="28" cy="52" r="1.5" fill="#C8D6E5" />
    <circle cx="36" cy="50" r="2" fill="#C8D6E5" />
  </svg>
);

/* ─── Shape SVG Icons ─── */
const S = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const LineIcon = () => <svg {...S}><line x1="5" y1="19" x2="19" y2="5" /></svg>;
const ArrowIcon = () => <svg {...S}><line x1="5" y1="19" x2="19" y2="5" /><polyline points="12 5 19 5 19 12" /></svg>;
const RectIcon = () => <svg {...S}><rect x="3" y="5" width="18" height="14" rx="2" /></svg>;
const CircleIcon = () => <svg {...S}><circle cx="12" cy="12" r="9" /></svg>;
const TriangleIcon = () => <svg {...S}><polygon points="12 3 22 21 2 21" /></svg>;
const DiamondIcon = () => <svg {...S}><polygon points="12 2 22 12 12 22 2 12" /></svg>;
const StarIcon = () => <svg {...S}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

export default Toolbar;
