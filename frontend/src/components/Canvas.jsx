import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

const SHAPE_TOOLS = new Set(['line', 'arrow', 'rectangle', 'circle', 'triangle', 'diamond', 'star']);

const Canvas = forwardRef(({ 
  strokes, setStrokes, tool, color, brushSize, 
  roomId, canDraw, remoteCursors, addToHistory
}, ref) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [shapeStart, setShapeStart] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const textRef = useRef(null);
  const { sendDrawStart, sendDrawMove, sendDrawEnd, sendCursorMove } = useSocket();
  const { isDark } = useTheme();

  const BG_COLOR = isDark ? '#1a1a2e' : '#ffffff';
  const ERASER_COLOR = BG_COLOR;

  useImperativeHandle(ref, () => canvasRef.current);

  // Init + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
      redrawCanvas();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Redraw on stroke or theme change
  useEffect(() => { redrawCanvas(); }, [strokes, isDark]);

  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    strokes.forEach(s => renderStroke(ctx, s));
  }, [strokes, isDark]);

  // ─── Stroke Renderer ───
  const renderStroke = (ctx, s) => {
    if (!s?.points?.length) return;
    ctx.save();
    
    const isEraser = s.tool === 'eraser';
    ctx.strokeStyle = isEraser ? ERASER_COLOR : s.color;
    ctx.fillStyle = isEraser ? ERASER_COLOR : s.color;
    ctx.lineWidth = s.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'text' && s.text) {
      ctx.font = `${Math.max(s.brushSize * 3, 16)}px Inter, sans-serif`;
      ctx.fillText(s.text, s.points[0].x, s.points[0].y);
    } else if (SHAPE_TOOLS.has(s.tool) && s.points.length >= 2) {
      drawShape(ctx, s.tool, s.points[0], s.points[s.points.length - 1]);
    } else if (s.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // ─── Shape Helpers ───
  const drawShape = (ctx, type, a, b) => {
    ctx.beginPath();
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

    switch (type) {
      case 'line':
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); break;

      case 'arrow': {
        const len = Math.max(ctx.lineWidth * 4, 15);
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - len * Math.cos(ang - Math.PI / 6), b.y - len * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - len * Math.cos(ang + Math.PI / 6), b.y - len * Math.sin(ang + Math.PI / 6));
        break;
      }

      case 'rectangle':
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); return;

      case 'circle':
        ctx.ellipse(mx, my, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2); break;

      case 'triangle':
        ctx.moveTo(mx, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(a.x, b.y); ctx.closePath(); break;

      case 'diamond':
        ctx.moveTo(mx, a.y); ctx.lineTo(b.x, my); ctx.lineTo(mx, b.y); ctx.lineTo(a.x, my); ctx.closePath(); break;

      case 'star': {
        const R = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2;
        const r = R * 0.4;
        for (let i = 0; i < 10; i++) {
          const rad = (Math.PI / 5) * i - Math.PI / 2;
          const pr = i % 2 === 0 ? R : r;
          const px = mx + pr * Math.cos(rad), py = my + pr * Math.sin(rad);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); break;
      }
    }
    ctx.stroke();
  };

  // ─── Coordinate Helper ───
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  // ─── Event Handlers ───
  const handleStart = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    const pt = getCoords(e);

    if (tool === 'text') {
      setTextInput({ x: pt.x, y: pt.y, visible: true });
      setTimeout(() => textRef.current?.focus(), 50);
      return;
    }

    setIsDrawing(true);
    setShapeStart(pt);
    setCurrentStroke({ points: [pt], color, brushSize, tool, timestamp: Date.now() });

    if (!SHAPE_TOOLS.has(tool)) {
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? ERASER_COLOR : color;
      ctx.lineWidth = brushSize;
      ctx.moveTo(pt.x, pt.y);
    }
    sendDrawStart(roomId, pt, color, brushSize, tool);
  };

  const handleMove = (e) => {
    if (!canDraw) return;
    const pt = getCoords(e);
    sendCursorMove(roomId, pt);
    if (!isDrawing) return;
    e.preventDefault();

    if (SHAPE_TOOLS.has(tool)) {
      setCurrentStroke(prev => ({ ...prev, points: [shapeStart, pt] }));
      redrawCanvas();
      const ctx = ctxRef.current;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.setLineDash([6, 4]);
      drawShape(ctx, tool, shapeStart, pt);
      ctx.restore();
    } else {
      setCurrentStroke(prev => ({ ...prev, points: [...prev.points, pt] }));
      const ctx = ctxRef.current;
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    sendDrawMove(roomId, pt);
  };

  const handleEnd = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);

    if (currentStroke) {
      let final = currentStroke;
      if (SHAPE_TOOLS.has(tool) && shapeStart) {
        const end = e ? getCoords(e) : currentStroke.points[1] || shapeStart;
        final = { ...currentStroke, points: [shapeStart, end] };
      }
      if (final.points.length >= 2) {
        const next = [...strokes, final];
        setStrokes(next);
        addToHistory(next);
        sendDrawEnd(roomId, final);
      }
    }

    setCurrentStroke(null);
    setShapeStart(null);
    ctxRef.current?.closePath();
    if (SHAPE_TOOLS.has(tool)) setTimeout(redrawCanvas, 0);
  };

  const handleTextSubmit = (text) => {
    if (!text.trim() || !textInput) return;
    const s = { points: [{ x: textInput.x, y: textInput.y }], color, brushSize, tool: 'text', text: text.trim(), timestamp: Date.now() };
    const next = [...strokes, s];
    setStrokes(next);
    addToHistory(next);
    sendDrawEnd(roomId, s);
    setTextInput(null);
  };

  const cursor = !canDraw ? 'cursor-not-allowed' : tool === 'text' ? 'cursor-text' : tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair';

  return (
    <div ref={containerRef} className={`w-full h-full relative ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${cursor}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Text Input */}
      {textInput?.visible && (
        <div className="absolute z-20" style={{ left: textInput.x, top: textInput.y - 10 }}>
          <input
            ref={textRef}
            type="text"
            className="bg-transparent border-b-2 border-blue-500 outline-none px-1 py-0.5 min-w-[120px]"
            style={{ fontSize: `${Math.max(brushSize * 3, 16)}px`, color, fontFamily: 'Inter, sans-serif' }}
            placeholder="Type here..."
            onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(e.target.value); else if (e.key === 'Escape') setTextInput(null); }}
            onBlur={e => e.target.value.trim() ? handleTextSubmit(e.target.value) : setTextInput(null)}
          />
          <div className="text-[10px] text-gray-400 mt-0.5">Enter to confirm · Esc to cancel</div>
        </div>
      )}

      {/* Remote Cursors */}
      {Object.entries(remoteCursors).map(([uid, { position, username }]) => (
        <div key={uid} className="absolute pointer-events-none z-10" style={{ left: position.x, top: position.y, transform: 'translate(-50%,-50%)' }}>
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.5 3.21V20.8l6.99-6.99H21L5.5 3.21z" />
          </svg>
          <span className="absolute left-4 top-4 px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap shadow-md">{username}</span>
        </div>
      ))}

      {/* Drawing disabled */}
      {!canDraw && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-xl text-sm shadow-lg">
          Drawing is disabled for participants
        </div>
      )}

      {/* Active tool badge */}
      {canDraw && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-xs text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50 capitalize">
          {tool}
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
