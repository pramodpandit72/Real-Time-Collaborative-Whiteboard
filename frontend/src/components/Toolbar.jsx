import { useState, useRef, useCallback, useEffect } from 'react';
import { Undo2, Redo2, Trash2, Download, Minus, Plus, Type, Sun, Moon, ZoomIn, ZoomOut, GripVertical, StickyNote, Grid3X3, PaintBucket } from 'lucide-react';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#6b7280', '#92400e', '#0d9488', '#7c3aed', '#dc2626',
];

const BRUSHES = [
  { id: 'pencil', label: 'Pencil', icon: <PencilColorIcon /> },
  { id: 'pen', label: 'Pen', icon: <PenInkIcon /> },
  { id: 'marker', label: 'Marker', icon: <MarkerIcon /> },
  { id: 'highlighter', label: 'Highlighter', icon: <HighlighterIcon /> },
  { id: 'eraser', label: 'Eraser', icon: <EraserBlockIcon /> },
];

const SHAPES = [
  { id: 'line', label: 'Line', icon: <LineIcon /> },
  { id: 'arrow', label: 'Arrow', icon: <ArrowIcon /> },
  { id: 'rectangle', label: 'Rectangle', icon: <RectIcon /> },
  { id: 'circle', label: 'Circle', icon: <CircleIcon /> },
  { id: 'triangle', label: 'Triangle', icon: <TriangleIcon /> },
  { id: 'diamond', label: 'Diamond', icon: <DiamondIcon /> },
  { id: 'star', label: 'Star', icon: <StarIcon /> },
  { id: 'hexagon', label: 'Hexagon', icon: <HexagonIcon /> },
  { id: 'pentagon', label: 'Pentagon', icon: <PentagonIcon /> },
  { id: 'heart', label: 'Heart', icon: <HeartIcon /> },
];

const GRID_MODES = [
  { id: 'none', label: 'No Grid' },
  { id: 'dots', label: 'Dots' },
  { id: 'lines', label: 'Lines' },
];

const SHAPE_FILLABLE = new Set(['rectangle','circle','triangle','diamond','star','hexagon','pentagon','heart']);

const Toolbar = ({
  tool, setTool, color, setColor,
  brushSize, setBrushSize,
  eraserSize, setEraserSize,
  onUndo, onRedo, onClear, onSaveSnapshot,
  canUndo, canRedo, canClear, canDraw,
  canvasDark, onToggleCanvasDark,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  sidebarWidth, onSidebarResize,
  gridMode, onGridModeChange,
  onAddStickyNote,
  fillEnabled, fillColor, onToggleFill, onFillColorChange,
}) => {
  const [showShapes, setShowShapes] = useState(false);
  const isEraser = tool === 'eraser';
  const activeSize = isEraser ? eraserSize : brushSize;
  const setActiveSize = isEraser ? setEraserSize : setBrushSize;

  // ─── Drag Resize Handle ───
  const resizeRef = useRef(null);
  const dragging = useRef(false);

  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startW = sidebarWidth;

    const onMove = (ev) => {
      const x = ev.clientX || ev.touches?.[0]?.clientX;
      const newW = Math.max(56, Math.min(200, startW + (x - startX)));
      onSidebarResize(newW);
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  }, [sidebarWidth, onSidebarResize]);

  const isWide = sidebarWidth >= 100;

  return (
    <div className="relative flex h-full">
      {/* Main toolbar */}
      <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm overflow-y-auto scrollbar-thin"
        style={{ width: sidebarWidth }}>

        {/* Canvas Mode */}
        <div className="px-1.5 pt-2 pb-1">
          <button onClick={onToggleCanvasDark}
            className={`w-full flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
              canvasDark ? 'bg-gray-700 text-amber-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`} title={canvasDark ? 'Light Canvas' : 'Dark Canvas'}>
            {canvasDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isWide && (canvasDark ? 'Light' : 'Dark')}
          </button>
        </div>

        <Divider />

        {/* Brushes */}
        <Label text="Brushes" wide={isWide} />
        <div className={`flex ${isWide ? 'flex-wrap justify-center gap-[2px] px-1' : 'flex-col items-center gap-[2px]'}`}>
          {BRUSHES.map(b => (
            <ToolBtn key={b.id} icon={b.icon} active={tool === b.id}
              onClick={() => setTool(b.id)} disabled={!canDraw} title={b.label}
              label={isWide ? b.label : undefined} />
          ))}
        </div>
        <ToolBtn icon={<Type className="w-[18px] h-[18px]" />} active={tool === 'text'}
          onClick={() => setTool('text')} disabled={!canDraw} title="Text"
          label={isWide ? 'Text' : undefined} />

        <Divider />

        {/* Laser + Sticky */}
        <Label text="Tools" wide={isWide} />
        <div className={`flex ${isWide ? 'flex-wrap justify-center gap-[2px] px-1' : 'flex-col items-center gap-[2px]'}`}>
          <ToolBtn
            icon={<LaserIcon />}
            active={tool === 'laser'}
            onClick={() => setTool('laser')}
            disabled={!canDraw}
            title="Laser Pointer"
            label={isWide ? 'Laser' : undefined}
          />
          <ToolBtn
            icon={<StickyNote className="w-[18px] h-[18px]" />}
            onClick={onAddStickyNote}
            disabled={!canDraw}
            title="Sticky Note"
            label={isWide ? 'Sticky' : undefined}
          />
        </div>

        {/* Grid Toggle */}
        <div className={`flex items-center ${isWide ? 'justify-center gap-1 px-1' : 'flex-col items-center gap-[2px]'} mt-1`}>
          {GRID_MODES.map(g => (
            <button key={g.id}
              onClick={() => onGridModeChange?.(g.id)}
              className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition ${
                gridMode === g.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={g.label}
            >
              {isWide ? g.label : g.id === 'none' ? '—' : g.id === 'dots' ? '⋯' : '▦'}
            </button>
          ))}
        </div>

        <Divider />

        {/* Shapes */}
        <Label text="Shapes" wide={isWide} />
        <div className={`flex ${isWide ? 'flex-wrap justify-center gap-[2px] px-1' : 'flex-col items-center gap-[2px]'}`}>
          {SHAPES.slice(0, showShapes ? SHAPES.length : 5).map(s => (
            <ToolBtn key={s.id} icon={s.icon} active={tool === s.id}
              onClick={() => setTool(s.id)} disabled={!canDraw} title={s.label} />
          ))}
        </div>
        {SHAPES.length > 5 && (
          <button onClick={() => setShowShapes(!showShapes)}
            className="text-[9px] text-blue-500 hover:text-blue-600 font-medium py-1 text-center">
            {showShapes ? '▲ Less' : `▼ +${SHAPES.length - 5}`}
          </button>
        )}

        {/* Fill Option — visible when a fillable shape tool is selected */}
        {SHAPE_FILLABLE.has(tool) && (
          <div className="px-1.5 mt-1 animate-fade-in-up">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleFill}
                disabled={!canDraw}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  fillEnabled
                    ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 ring-1 ring-violet-300 dark:ring-violet-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${!canDraw ? 'opacity-40' : ''}`}
                title={fillEnabled ? 'Disable fill' : 'Enable fill'}
              >
                <PaintBucket className="w-3.5 h-3.5" />
                {isWide && 'Fill'}
              </button>
              {fillEnabled && (
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={e => onFillColorChange(e.target.value)}
                    disabled={!canDraw}
                    className="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                    title="Fill color"
                  />
                  {isWide && <span className="text-[8px] font-mono text-gray-400 truncate">{fillColor}</span>}
                </div>
              )}
            </div>
            {fillEnabled && (
              <div className={`grid gap-[2px] mt-1 ${isWide ? 'grid-cols-5' : 'grid-cols-3'}`}>
                {['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#ffffff00'].map(c => (
                  <button key={c} onClick={() => onFillColorChange(c)} disabled={!canDraw}
                    className={`w-[14px] h-[14px] rounded-sm border transition-all mx-auto ${
                      fillColor === c ? 'ring-2 ring-violet-500 ring-offset-1 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-110'
                    } ${!canDraw ? 'opacity-40' : 'cursor-pointer'}`}
                    style={{ backgroundColor: c === '#ffffff00' ? 'transparent' : c }}
                    title={c === '#ffffff00' ? 'Transparent' : c}
                  >
                    {c === '#ffffff00' && <span className="text-[8px] text-gray-400 leading-none">∅</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Divider />

        {/* Colors */}
        <Label text="Colors" wide={isWide} />
        <div className={`grid gap-[3px] px-1.5 ${isWide ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} disabled={!canDraw}
              className={`w-[18px] h-[18px] rounded-md border transition-all mx-auto ${
                color === c ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-110'
              } ${!canDraw ? 'opacity-40' : 'cursor-pointer'} ${c === '#ffffff' ? 'border-gray-400 dark:border-gray-500' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex items-center gap-1 px-1.5 mt-1">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} disabled={!canDraw}
            className={`${isWide ? 'w-8 h-8' : 'w-7 h-7'} rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer ${!canDraw ? 'opacity-40' : ''}`} />
          {isWide && <span className="text-[9px] font-mono text-gray-400 truncate">{color}</span>}
        </div>

        <Divider />

        {/* Size */}
        <Label text={isEraser ? 'Eraser Size' : 'Brush Size'} wide={isWide} />
        <div className="flex flex-col items-center gap-0 px-1">
          <SizeBtn icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setActiveSize(Math.min(activeSize + 2, 50))} disabled={!canDraw} />
          <div className="w-10 h-10 flex items-center justify-center my-0.5 relative">
            <div className={`rounded-full transition-all ${isEraser ? 'bg-pink-400 dark:bg-pink-500' : 'bg-gray-800 dark:bg-gray-200'}`}
              style={{ width: Math.max(Math.min(activeSize, 28), 4), height: Math.max(Math.min(activeSize, 28), 4) }} />
          </div>
          <SizeBtn icon={<Minus className="w-3.5 h-3.5" />}
            onClick={() => setActiveSize(Math.max(activeSize - 2, 1))} disabled={!canDraw} />
          <span className="text-[10px] font-mono text-gray-400">{activeSize}px</span>
        </div>

        <Divider />

        {/* Zoom */}
        <Label text="Zoom" wide={isWide} />
        <div className="flex flex-col items-center gap-[2px]">
          <SizeBtn icon={<ZoomIn className="w-4 h-4" />} onClick={onZoomIn} />
          <button onClick={onZoomReset}
            className="text-[10px] font-mono text-gray-500 dark:text-gray-400 hover:text-blue-500 py-0.5">
            {Math.round((zoom || 1) * 100)}%
          </button>
          <SizeBtn icon={<ZoomOut className="w-4 h-4" />} onClick={onZoomOut} />
        </div>

        <Divider />

        {/* Edit */}
        <Label text="Edit" wide={isWide} />
        <div className={`flex ${isWide ? 'justify-center gap-1' : 'flex-col items-center gap-[2px]'}`}>
          <ToolBtn icon={<Undo2 className="w-[18px] h-[18px]" />} onClick={onUndo} disabled={!canUndo || !canDraw} title="Undo" />
          <ToolBtn icon={<Redo2 className="w-[18px] h-[18px]" />} onClick={onRedo} disabled={!canRedo || !canDraw} title="Redo" />
        </div>

        <div className="flex-1" />

        <div className={`flex ${isWide ? 'justify-center gap-1' : 'flex-col items-center gap-[2px]'} mb-3 px-1`}>
          <ToolBtn icon={<Download className="w-[18px] h-[18px]" />} onClick={onSaveSnapshot} title="Save PNG" />
          {canClear && <ToolBtn icon={<Trash2 className="w-[18px] h-[18px]" />} onClick={onClear} title="Clear" danger />}
        </div>
      </div>

      {/* ── Resize Handle ── */}
      <div ref={resizeRef}
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className="w-2 flex items-center justify-center cursor-col-resize hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-800/40 transition group"
        title="Drag to resize toolbar">
        <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition" />
      </div>
    </div>
  );
};

/* ─── Helpers ─── */
const Label = ({ text, wide }) => (
  <span className={`text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-0.5 mt-1.5 text-center w-full ${wide ? 'text-[9px]' : ''}`}>
    {text}
  </span>
);
const Divider = () => <div className="w-10 mx-auto border-t border-gray-200 dark:border-gray-700 my-1" />;

const ToolBtn = ({ icon, active, onClick, disabled, title, danger, label }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`${label ? 'w-auto px-2 gap-1.5' : 'w-10'} h-10 flex items-center justify-center rounded-xl transition-all mx-auto ${
      active ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-300 dark:ring-blue-700'
      : danger ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
    {icon}
    {label && <span className="text-[10px] font-medium truncate">{label}</span>}
  </button>
);

const SizeBtn = ({ onClick, disabled, icon }) => (
  <button onClick={onClick} disabled={disabled}
    className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition ${disabled ? 'opacity-40' : ''}`}>
    {icon}
  </button>
);

/* ═══════════════════════════
   SVG ICONS
   ═══════════════════════════ */

function LaserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill="#ef4444" stroke="#ef4444" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="#ef4444" opacity="0.5" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="#ef4444" opacity="0.5" />
      <line x1="2" y1="12" x2="6" y2="12" stroke="#ef4444" opacity="0.5" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="#ef4444" opacity="0.5" />
    </svg>
  );
}

function PencilColorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64">
      <polygon points="10,54 6,58 14,56 50,20 46,16" fill="#F6B93B" />
      <polygon points="6,58 10,54 14,56" fill="#FDF2D1" />
      <polygon points="6,58 8,55 10,57" fill="#2C3A47" />
      <line x1="46" y1="16" x2="50" y2="20" stroke="#2C3A47" strokeWidth="1.5" />
      <rect x="44" y="10" width="10" height="6" rx="1" fill="#E55039" transform="rotate(-45 49 13)" />
      <rect x="42" y="14" width="10" height="3" rx="0.5" fill="#C8D6E5" transform="rotate(-45 47 15.5)" />
      <line x1="10" y1="54" x2="50" y2="14" stroke="#2C3A47" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="14" y1="56" x2="54" y2="16" stroke="#2C3A47" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

function PenInkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" fill="rgba(59,130,246,0.15)" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function MarkerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64">
      <rect x="24" y="6" width="14" height="36" rx="3" fill="#8B5CF6" stroke="#2C3A47" strokeWidth="2" transform="rotate(-45 31 24)" />
      <polygon points="14,50 8,56 18,54 24,42 18,36" fill="#DDD6FE" stroke="#2C3A47" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="8,56 12,52 14,54" fill="#2C3A47" />
    </svg>
  );
}

function HighlighterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64">
      <rect x="20" y="8" width="18" height="32" rx="4" fill="#FBBF24" fillOpacity="0.6" stroke="#F59E0B" strokeWidth="2.5" transform="rotate(-45 29 24)" />
      <polygon points="14,50 8,56 18,54 22,44 16,38" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      <line x1="16" y1="38" x2="22" y2="44" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
}

function EraserBlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64">
      <rect x="8" y="22" width="48" height="20" rx="4" fill="#FDA7DF" stroke="#2C3A47" strokeWidth="2" />
      <rect x="8" y="22" width="16" height="20" rx="4" fill="#E55039" stroke="#2C3A47" strokeWidth="2" />
      <circle cx="16" cy="48" r="1.5" fill="#ddd" />
      <circle cx="26" cy="50" r="1" fill="#ddd" />
      <circle cx="34" cy="48" r="1.5" fill="#ddd" />
    </svg>
  );
}

const Sv = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
function LineIcon() { return <svg {...Sv}><line x1="5" y1="19" x2="19" y2="5" /></svg>; }
function ArrowIcon() { return <svg {...Sv}><line x1="5" y1="19" x2="19" y2="5" /><polyline points="12 5 19 5 19 12" /></svg>; }
function RectIcon() { return <svg {...Sv}><rect x="3" y="5" width="18" height="14" rx="2" /></svg>; }
function CircleIcon() { return <svg {...Sv}><circle cx="12" cy="12" r="9" /></svg>; }
function TriangleIcon() { return <svg {...Sv}><polygon points="12 3 22 21 2 21" /></svg>; }
function DiamondIcon() { return <svg {...Sv}><polygon points="12 2 22 12 12 22 2 12" /></svg>; }
function StarIcon() { return <svg {...Sv}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function HexagonIcon() { return <svg {...Sv}><polygon points="12 2 21 7 21 17 12 22 3 17 3 7" /></svg>; }
function PentagonIcon() { return <svg {...Sv}><polygon points="12 2 22 10 18 22 6 22 2 10" /></svg>; }
function HeartIcon() { return <svg {...Sv}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>; }

export default Toolbar;
