import { 
  Pencil, Eraser, Undo2, Redo2, Trash2, Camera, Minus, Plus 
} from 'lucide-react';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
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
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-4">
      {/* Drawing Tools */}
      <div className="flex flex-col items-center gap-2">
        <ToolButton
          icon={<Pencil className="w-5 h-5" />}
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          disabled={!canDraw}
          title="Pencil"
        />
        <ToolButton
          icon={<Eraser className="w-5 h-5" />}
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          disabled={!canDraw}
          title="Eraser"
        />
      </div>

      <div className="w-8 border-t border-gray-200 dark:border-gray-700" />

      {/* Color Picker */}
      <div className="flex flex-col items-center gap-1">
        {COLORS.slice(0, 5).map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            disabled={!canDraw}
            className={`w-6 h-6 rounded-full border-2 transition ${
              color === c 
                ? 'border-blue-500 scale-110' 
                : 'border-gray-300 dark:border-gray-600'
            } ${!canDraw ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!canDraw}
          className={`w-6 h-6 rounded cursor-pointer ${!canDraw ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Custom Color"
        />
      </div>

      <div className="w-8 border-t border-gray-200 dark:border-gray-700" />

      {/* Brush Size */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => setBrushSize(Math.min(brushSize + 2, 50))}
          disabled={!canDraw}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${
            !canDraw ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Increase Size"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div 
          className="w-6 h-6 flex items-center justify-center"
          title={`Size: ${brushSize}`}
        >
          <div 
            className="rounded-full bg-gray-800 dark:bg-gray-200"
            style={{ 
              width: Math.min(brushSize, 20), 
              height: Math.min(brushSize, 20) 
            }}
          />
        </div>
        <button
          onClick={() => setBrushSize(Math.max(brushSize - 2, 1))}
          disabled={!canDraw}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${
            !canDraw ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Decrease Size"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">{brushSize}px</span>
      </div>

      <div className="w-8 border-t border-gray-200 dark:border-gray-700" />

      {/* Actions */}
      <div className="flex flex-col items-center gap-2">
        <ToolButton
          icon={<Undo2 className="w-5 h-5" />}
          onClick={onUndo}
          disabled={!canUndo || !canDraw}
          title="Undo"
        />
        <ToolButton
          icon={<Redo2 className="w-5 h-5" />}
          onClick={onRedo}
          disabled={!canRedo || !canDraw}
          title="Redo"
        />
      </div>

      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2">
        <ToolButton
          icon={<Camera className="w-5 h-5" />}
          onClick={onSaveSnapshot}
          title="Save Snapshot"
        />
        {canClear && (
          <ToolButton
            icon={<Trash2 className="w-5 h-5" />}
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
    className={`p-2 rounded-lg transition ${
      active 
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
        : danger
          ? 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon}
  </button>
);

export default Toolbar;
