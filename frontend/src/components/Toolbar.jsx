import { 
  Pencil, Eraser, Undo2, Redo2, Trash2, Camera, Minus, Plus,
  Circle, Square, Type, Hand
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
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 gap-1 shadow-sm">
      {/* Section Label */}
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tools</span>
      
      {/* Drawing Tools */}
      <div className="flex flex-col items-center gap-1">
        <ToolButton
          icon={<Pencil className="w-[18px] h-[18px]" />}
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          disabled={!canDraw}
          title="Pencil (P)"
        />
        <ToolButton
          icon={<Eraser className="w-[18px] h-[18px]" />}
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          disabled={!canDraw}
          title="Eraser (E)"
        />
      </div>

      <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1" />

      {/* Colors Label */}
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Color</span>

      {/* Color Palette */}
      <div className="flex flex-col items-center gap-[3px]">
        <div className="grid grid-cols-2 gap-[3px]">
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
          className={`w-10 h-5 rounded cursor-pointer border border-gray-300 dark:border-gray-600 ${!canDraw ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Custom Color"
        />
      </div>

      <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1" />

      {/* Brush Size */}
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Size</span>
      <div className="flex flex-col items-center gap-0.5">
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
        <div 
          className="w-8 h-8 flex items-center justify-center"
          title={`Size: ${brushSize}px`}
        >
          <div 
            className="rounded-full bg-gray-800 dark:bg-gray-200 transition-all"
            style={{ 
              width: Math.max(Math.min(brushSize, 24), 4), 
              height: Math.max(Math.min(brushSize, 24), 4) 
            }}
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

      <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1" />

      {/* Undo / Redo */}
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">History</span>
      <div className="flex flex-col items-center gap-1">
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
      <div className="flex flex-col items-center gap-1">
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

const ToolButton = ({ icon, active, onClick, disabled, title, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-xl transition-all ${
      active 
        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shadow-sm' 
        : danger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    {icon}
  </button>
);

export default Toolbar;
