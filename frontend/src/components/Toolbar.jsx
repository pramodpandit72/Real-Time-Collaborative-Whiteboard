import { 
  Pencil, Eraser, Undo2, Redo2, Trash2, Camera, Minus, Plus,
  Circle, Square, Triangle, Minus as LineIcon, Type, ArrowRight,
  Diamond, Pen, Star, MoveRight
} from 'lucide-react';

const COLORS = [
  '#1e1e1e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#ffffff'
];

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onUndo,
  onRedo,
  onClear,
  onSaveSnapshot,
  canUndo,
  canRedo,
  canClear,
  canDraw
}) => {
  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 gap-0.5 shadow-sm overflow-y-auto">
      {/* Drawing Tools */}
      <SectionLabel text="Draw" />
      <div className="flex flex-col items-center gap-0.5">
        <ToolButton
          icon={<PenIcon />}
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          disabled={!canDraw}
          title="Pen (P)"
        />
        <ToolButton
          icon={<EraserIcon />}
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          disabled={!canDraw}
          title="Eraser (E)"
        />
        <ToolButton
          icon={<Type className="w-[18px] h-[18px]" />}
          active={tool === 'text'}
          onClick={() => setTool('text')}
          disabled={!canDraw}
          title="Text (T)"
        />
      </div>

      <Divider />

      {/* Shape Tools */}
      <SectionLabel text="Shapes" />
      <div className="flex flex-col items-center gap-0.5">
        <ToolButton
          icon={<LineShapeIcon />}
          active={tool === 'line'}
          onClick={() => setTool('line')}
          disabled={!canDraw}
          title="Line (L)"
        />
        <ToolButton
          icon={<ArrowShapeIcon />}
          active={tool === 'arrow'}
          onClick={() => setTool('arrow')}
          disabled={!canDraw}
          title="Arrow (A)"
        />
        <ToolButton
          icon={<RectShapeIcon />}
          active={tool === 'rectangle'}
          onClick={() => setTool('rectangle')}
          disabled={!canDraw}
          title="Rectangle (R)"
        />
        <ToolButton
          icon={<CircleShapeIcon />}
          active={tool === 'circle'}
          onClick={() => setTool('circle')}
          disabled={!canDraw}
          title="Circle (C)"
        />
        <ToolButton
          icon={<TriangleShapeIcon />}
          active={tool === 'triangle'}
          onClick={() => setTool('triangle')}
          disabled={!canDraw}
          title="Triangle"
        />
        <ToolButton
          icon={<DiamondShapeIcon />}
          active={tool === 'diamond'}
          onClick={() => setTool('diamond')}
          disabled={!canDraw}
          title="Diamond"
        />
        <ToolButton
          icon={<StarShapeIcon />}
          active={tool === 'star'}
          onClick={() => setTool('star')}
          disabled={!canDraw}
          title="Star"
        />
      </div>

      <Divider />

      {/* Color Palette */}
      <SectionLabel text="Color" />
      <div className="flex flex-col items-center gap-[2px]">
        <div className="grid grid-cols-2 gap-[2px]">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              disabled={!canDraw}
              className={`w-5 h-5 rounded-md border transition-all ${
                color === c
                  ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110'
                  : 'border-gray-300 dark:border-gray-600 hover:scale-105'
              } ${!canDraw ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!canDraw}
          className={`w-10 h-5 rounded cursor-pointer border border-gray-300 dark:border-gray-600 mt-0.5 ${!canDraw ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Custom Color"
        />
      </div>

      <Divider />

      {/* Brush Size */}
      <SectionLabel text="Size" />
      <div className="flex flex-col items-center gap-0">
        <button
          onClick={() => setBrushSize(Math.min(brushSize + 2, 50))}
          disabled={!canDraw}
          className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 ${
            !canDraw ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="Increase Size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 h-8 flex items-center justify-center" title={`Size: ${brushSize}px`}>
          <div 
            className="rounded-full bg-gray-800 dark:bg-gray-200 transition-all"
            style={{ width: Math.max(Math.min(brushSize, 24), 4), height: Math.max(Math.min(brushSize, 24), 4) }}
          />
        </div>
        <button
          onClick={() => setBrushSize(Math.max(brushSize - 2, 1))}
          disabled={!canDraw}
          className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 ${
            !canDraw ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="Decrease Size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{brushSize}px</span>
      </div>

      <Divider />

      {/* History */}
      <SectionLabel text="History" />
      <div className="flex flex-col items-center gap-0.5">
        <ToolButton
          icon={<Undo2 className="w-[18px] h-[18px]" />}
          onClick={onUndo}
          disabled={!canUndo || !canDraw}
          title="Undo (Ctrl+Z)"
        />
        <ToolButton
          icon={<Redo2 className="w-[18px] h-[18px]" />}
          onClick={onRedo}
          disabled={!canRedo || !canDraw}
          title="Redo (Ctrl+Y)"
        />
      </div>

      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-0.5 mt-2">
        <ToolButton
          icon={<Camera className="w-[18px] h-[18px]" />}
          onClick={onSaveSnapshot}
          title="Save Snapshot"
        />
        {canClear && (
          <ToolButton
            icon={<Trash2 className="w-[18px] h-[18px]" />}
            onClick={onClear}
            title="Clear Board"
            danger
          />
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const SectionLabel = ({ text }) => (
  <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 mt-1">{text}</span>
);

const Divider = () => (
  <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1" />
);

const ToolButton = ({ icon, active, onClick, disabled, title, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-xl transition-all ${
      active 
        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
        : danger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    {icon}
  </button>
);

/* ─── Custom SVG Icons ─── */

// Realistic pen icon
const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

// Eraser icon
const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

// Line icon
const LineShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

// Arrow icon
const ArrowShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <polyline points="12 5 19 5 19 12" />
  </svg>
);

// Rectangle icon
const RectShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
  </svg>
);

// Circle icon
const CircleShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

// Triangle icon  
const TriangleShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 3 22 21 2 21" />
  </svg>
);

// Diamond icon
const DiamondShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 12 12 22 2 12" />
  </svg>
);

// Star icon
const StarShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default Toolbar;
