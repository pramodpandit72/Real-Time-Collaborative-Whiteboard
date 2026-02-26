import { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal, Plus } from 'lucide-react';

const STICKY_COLORS = [
  { name: 'Yellow', bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  { name: 'Pink',   bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  { name: 'Blue',   bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' },
  { name: 'Green',  bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  { name: 'Purple', bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' },
  { name: 'Orange', bg: '#FFEDD5', border: '#F97316', text: '#9A3412' },
];

const StickyNoteOverlay = ({ notes, setNotes }) => {
  const [isAdding, setIsAdding] = useState(false);

  const addNote = (colorIdx = 0) => {
    const c = STICKY_COLORS[colorIdx];
    const id = Date.now().toString();
    const offset = (notes.length % 5) * 30;
    setNotes(prev => [...prev, {
      id,
      text: '',
      x: 120 + offset,
      y: 80 + offset,
      color: c,
      width: 180,
      height: 140,
      editing: true,
    }]);
    setIsAdding(false);
  };

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Sticky notes */}
      {notes.map(note => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={(u) => updateNote(note.id, u)}
          onDelete={() => deleteNote(note.id)}
        />
      ))}

      {/* Add button */}
      {isAdding ? (
        <div className="absolute top-20 left-20 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 animate-scale-in">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pick a color</p>
          <div className="flex gap-2">
            {STICKY_COLORS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => addNote(i)}
                className="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: c.bg, borderColor: c.border }}
                title={c.name}
              />
            ))}
          </div>
          <button
            onClick={() => setIsAdding(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition w-full text-center"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </>
  );
};

/* ─── Individual Sticky Note ─── */
const StickyNote = ({ note, onUpdate, onDelete }) => {
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const textareaRef = useRef(null);

  useEffect(() => {
    if (note.editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [note.editing]);

  const handleDragStart = (e) => {
    if (note.editing) return;
    e.preventDefault();
    const src = e.touches ? e.touches[0] : e;
    dragOffset.current = {
      x: src.clientX - note.x,
      y: src.clientY - note.y,
    };
    setDragging(true);

    const onMove = (ev) => {
      const s = ev.touches ? ev.touches[0] : ev;
      onUpdate({
        x: s.clientX - dragOffset.current.x,
        y: s.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  };

  return (
    <div
      className="absolute z-20 sticky-note select-none animate-scale-in"
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.height,
        backgroundColor: note.color.bg,
        borderLeft: `4px solid ${note.color.border}`,
        borderRadius: '4px',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <GripHorizontal className="w-4 h-4 opacity-40" style={{ color: note.color.text }} />
        <button
          onClick={onDelete}
          className="p-0.5 rounded hover:bg-black/10 transition"
        >
          <X className="w-3.5 h-3.5" style={{ color: note.color.text }} />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        {note.editing ? (
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:opacity-50"
            style={{ color: note.color.text, minHeight: note.height - 44 }}
            placeholder="Write something..."
            defaultValue={note.text}
            onBlur={(e) => onUpdate({ text: e.target.value, editing: false })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onUpdate({ text: e.target.value, editing: false });
              }
            }}
          />
        ) : (
          <div
            className="text-sm leading-relaxed cursor-text whitespace-pre-wrap min-h-[60px]"
            style={{ color: note.color.text }}
            onClick={() => onUpdate({ editing: true })}
          >
            {note.text || <span className="opacity-40 italic">Click to edit...</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Export both the overlay and the add button trigger
export { StickyNoteOverlay, STICKY_COLORS };
export default StickyNoteOverlay;
