import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const SHAPE_TOOLS = new Set(['line','arrow','rectangle','circle','triangle','diamond','star','hexagon','pentagon','heart']);
const BRUSH_TOOLS = new Set(['pencil','pen','marker','highlighter','eraser']);

const Canvas = forwardRef(({ 
  strokes, setStrokes, tool, color, brushSize, 
  roomId, canDraw, remoteCursors, addToHistory, canvasDark, zoom, gridMode,
  fillEnabled, fillColor
}, ref) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const shapeStartRef = useRef(null);
  const [textInput, setTextInput] = useState(null);
  const textRef = useRef(null);
  const { sendDrawStart, sendDrawMove, sendDrawEnd, sendCursorMove } = useSocket();
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  // Laser pointer trail
  const [laserDots, setLaserDots] = useState([]);
  const laserIdRef = useRef(0);

  // Minimap
  const minimapRef = useRef(null);

  const BG = canvasDark ? '#1a1a2e' : '#ffffff';

  useImperativeHandle(ref, () => canvasRef.current);

  // ─── Initialize & Resize ───
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
      ctxRef.current = ctx;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => { redraw(); }, [strokes, canvasDark, zoom, gridMode]);

  // Update minimap when strokes change
  useEffect(() => { updateMinimap(); }, [strokes, canvasDark]);

  // ─── Draw Grid on Canvas ───
  const drawGrid = (ctx, width, height) => {
    if (!gridMode || gridMode === 'none') return;
    const spacing = 20;
    const dotColor = canvasDark ? '#374151' : '#d1d5db';
    const lineColor = canvasDark ? 'rgba(55,65,81,0.5)' : 'rgba(209,213,219,0.7)';

    if (gridMode === 'dots') {
      ctx.fillStyle = dotColor;
      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridMode === 'lines') {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;
      for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  // ─── Redraw All ───
  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern directly on canvas
    drawGrid(ctx, width, height);

    const z = zoom || 1;
    ctx.save();
    ctx.scale(z, z);
    strokesRef.current.forEach(s => renderStroke(ctx, s));
    ctx.restore();
  }, [strokes, canvasDark, zoom, gridMode]);

  // ─── Minimap ───
  const updateMinimap = useCallback(() => {
    const miniCanvas = minimapRef.current;
    const mainCanvas = canvasRef.current;
    if (!miniCanvas || !mainCanvas) return;
    const mCtx = miniCanvas.getContext('2d');
    const mW = miniCanvas.width;
    const mH = miniCanvas.height;
    mCtx.clearRect(0, 0, mW, mH);
    mCtx.fillStyle = canvasDark ? '#1a1a2e' : '#ffffff';
    mCtx.fillRect(0, 0, mW, mH);

    // Scale to fit
    const { width, height } = mainCanvas.getBoundingClientRect();
    const scale = Math.min(mW / width, mH / height);
    mCtx.save();
    mCtx.scale(scale, scale);
    strokesRef.current.forEach(s => renderStroke(mCtx, s));
    mCtx.restore();
  }, [strokes, canvasDark]);

  // ─── Render Single Stroke ───
  const renderStroke = (ctx, s) => {
    if (!s?.points?.length) return;
    ctx.save();
    const isEraser = s.tool === 'eraser';
    const strokeColor = isEraser ? BG : s.color;
    
    switch (s.tool) {
      case 'marker':
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = s.brushSize * 2.5;
        break;
      case 'highlighter':
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = s.brushSize * 4;
        break;
      case 'pen':
        ctx.lineWidth = s.brushSize * 0.8;
        break;
      default:
        ctx.lineWidth = s.brushSize;
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineCap = s.tool === 'marker' ? 'square' : 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'text' && s.text) {
      ctx.globalAlpha = 1;
      ctx.font = `${Math.max(s.brushSize * 3, 16)}px Inter, sans-serif`;
      ctx.fillText(s.text, s.points[0].x, s.points[0].y);
    } else if (SHAPE_TOOLS.has(s.tool) && s.points.length >= 2) {
      drawShape(ctx, s.tool, s.points[0], s.points[s.points.length - 1], s.fillEnabled, s.fillColor);
    } else if (s.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ─── Shape Drawing ───
  const drawShape = (ctx, type, a, b, shouldFill, fColor) => {
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
        if (shouldFill && fColor) {
          ctx.fillStyle = fColor;
          ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        }
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
          i === 0 ? ctx.moveTo(mx + pr * Math.cos(rad), my + pr * Math.sin(rad))
                   : ctx.lineTo(mx + pr * Math.cos(rad), my + pr * Math.sin(rad));
        }
        ctx.closePath(); break;
      }

      case 'hexagon':
        drawRegularPolygon(ctx, mx, my, a, b, 6); break;

      case 'pentagon':
        drawRegularPolygon(ctx, mx, my, a, b, 5); break;

      case 'heart': {
        const w = b.x - a.x, h = b.y - a.y;
        ctx.moveTo(mx, a.y + h * 0.3);
        ctx.bezierCurveTo(mx + w * 0.5, a.y - h * 0.1, b.x + w * 0.1, a.y + h * 0.5, mx, b.y);
        ctx.moveTo(mx, a.y + h * 0.3);
        ctx.bezierCurveTo(mx - w * 0.5, a.y - h * 0.1, a.x - w * 0.1, a.y + h * 0.5, mx, b.y);
        break;
      }
    }
    // Fill first, then stroke on top
    if (shouldFill && fColor && type !== 'line' && type !== 'arrow') {
      ctx.fillStyle = fColor;
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawRegularPolygon = (ctx, cx, cy, a, b, sides) => {
    const R = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2;
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
      const px = cx + R * Math.cos(angle), py = cy + R * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // ─── Coords (zoom-aware) ───
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    const z = zoom || 1;
    return { x: (src.clientX - rect.left) / z, y: (src.clientY - rect.top) / z };
  };

  // ─── Mouse / Touch Handlers ───
  const handleStart = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    const pt = getCoords(e);

    // Laser pointer — just add dots, don't start a stroke
    if (tool === 'laser') {
      addLaserDot(pt);
      drawingRef.current = true;
      return;
    }

    if (tool === 'text') {
      setTextInput({ x: pt.x * (zoom || 1), y: pt.y * (zoom || 1), visible: true });
      setTimeout(() => textRef.current?.focus(), 50);
      return;
    }

    drawingRef.current = true;
    shapeStartRef.current = pt;
    currentStrokeRef.current = { points: [pt], color, brushSize, tool, timestamp: Date.now(), fillEnabled: SHAPE_TOOLS.has(tool) ? fillEnabled : false, fillColor: fillEnabled ? fillColor : null };

    if (BRUSH_TOOLS.has(tool)) {
      const ctx = ctxRef.current;
      const z = zoom || 1;
      ctx.save();
      ctx.scale(z, z);
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? BG : color;
      ctx.lineWidth = tool === 'marker' ? brushSize * 2.5 : tool === 'highlighter' ? brushSize * 4 : tool === 'pen' ? brushSize * 0.8 : brushSize;
      ctx.lineCap = tool === 'marker' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = tool === 'marker' ? 0.7 : tool === 'highlighter' ? 0.35 : 1;
      ctx.moveTo(pt.x, pt.y);
      ctx.restore();
    }
    sendDrawStart(roomId, pt, color, brushSize, tool);
  };

  const handleMove = (e) => {
    if (!canDraw) return;
    const pt = getCoords(e);
    sendCursorMove(roomId, pt);
    if (!drawingRef.current) return;
    e.preventDefault();

    // Laser pointer trail
    if (tool === 'laser') {
      addLaserDot(pt);
      return;
    }

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    if (SHAPE_TOOLS.has(tool)) {
      stroke.points = [shapeStartRef.current, pt];
      redraw();
      const ctx = ctxRef.current;
      const z = zoom || 1;
      ctx.save();
      ctx.scale(z, z);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash([6, 4]);
      drawShape(ctx, tool, shapeStartRef.current, pt, fillEnabled, fillColor);
      ctx.restore();
    } else {
      stroke.points.push(pt);
      const ctx = ctxRef.current;
      const z = zoom || 1;
      ctx.save();
      ctx.scale(z, z);
      ctx.strokeStyle = tool === 'eraser' ? BG : color;
      ctx.lineWidth = tool === 'marker' ? brushSize * 2.5 : tool === 'highlighter' ? brushSize * 4 : tool === 'pen' ? brushSize * 0.8 : brushSize;
      ctx.lineCap = tool === 'marker' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = tool === 'marker' ? 0.7 : tool === 'highlighter' ? 0.35 : 1;
      ctx.beginPath();
      const pts = stroke.points;
      if (pts.length >= 2) {
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    sendDrawMove(roomId, pt);
  };

  const handleEnd = (e) => {
    if (!drawingRef.current) return;
    e?.preventDefault();
    drawingRef.current = false;

    // Laser has no stroke to save
    if (tool === 'laser') return;

    const stroke = currentStrokeRef.current;
    if (stroke) {
      let final = stroke;
      if (SHAPE_TOOLS.has(tool) && shapeStartRef.current) {
        const end = e ? getCoords(e) : stroke.points[1] || shapeStartRef.current;
        final = { ...stroke, points: [shapeStartRef.current, end] };
      }
      if (final.points.length >= 2) {
        const next = [...strokesRef.current, final];
        setStrokes(next);
        addToHistory(next);
        sendDrawEnd(roomId, final);
      }
    }
    currentStrokeRef.current = null;
    shapeStartRef.current = null;
    requestAnimationFrame(redraw);
  };

  // ─── Laser Pointer ───
  const addLaserDot = (pt) => {
    const id = laserIdRef.current++;
    const z = zoom || 1;
    setLaserDots(prev => [...prev, { id, x: pt.x * z, y: pt.y * z }]);
    setTimeout(() => {
      setLaserDots(prev => prev.filter(d => d.id !== id));
    }, 600);
  };

  // ─── Text ───
  const handleTextSubmit = (text) => {
    if (!text.trim() || !textInput) return;
    const z = zoom || 1;
    const s = { points: [{ x: textInput.x / z, y: textInput.y / z }], color, brushSize, tool: 'text', text: text.trim(), timestamp: Date.now() };
    const next = [...strokesRef.current, s];
    setStrokes(next);
    addToHistory(next);
    sendDrawEnd(roomId, s);
    setTextInput(null);
  };

  // ─── Cursor ───
  const getCursor = () => {
    if (!canDraw) return 'not-allowed';
    switch (tool) {
      case 'text': return 'text';
      case 'eraser': return 'cell';
      case 'laser': return 'crosshair';
      case 'pencil': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' fill='%23F6B93B' stroke='%23333' stroke-width='1.5'/%3E%3C/svg%3E") 2 22, crosshair`;
      case 'pen': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath d='M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' fill='none' stroke='%23333' stroke-width='1.5'/%3E%3Ccircle cx='11' cy='11' r='2' fill='%23333'/%3E%3C/svg%3E") 2 20, crosshair`;
      case 'marker': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Crect x='8' y='2' width='8' height='16' rx='2' fill='%238B5CF6' stroke='%23333' stroke-width='1' transform='rotate(-45 12 10)'/%3E%3C/svg%3E") 4 20, crosshair`;
      case 'highlighter': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Crect x='8' y='2' width='8' height='16' rx='2' fill='%23FBBF24' fill-opacity='0.6' stroke='%23F59E0B' stroke-width='1' transform='rotate(-45 12 10)'/%3E%3C/svg%3E") 4 20, crosshair`;
      default: return 'crosshair';
    }
  };

  // Grid mode class
  const gridClass = gridMode === 'dots' ? 'canvas-dots' : gridMode === 'lines' ? 'canvas-lines' : '';

  return (
    <div ref={containerRef} className={`w-full h-full relative ${canvasDark ? 'bg-[#1a1a2e]' : 'bg-white'} ${gridClass}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: getCursor() }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Laser pointer dots */}
      {laserDots.map(dot => (
        <div key={dot.id} className="laser-dot" style={{ left: dot.x - 4, top: dot.y - 4 }} />
      ))}

      {/* Text Input */}
      {textInput?.visible && (
        <div className="absolute z-20" style={{ left: textInput.x, top: textInput.y - 10 }}>
          <input ref={textRef} type="text"
            className="bg-transparent border-b-2 border-blue-500 outline-none px-1 py-0.5 min-w-[140px]"
            style={{ fontSize: `${Math.max(brushSize * 3, 16)}px`, color, fontFamily: 'Inter, sans-serif' }}
            placeholder="Type here..."
            onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(e.target.value); else if (e.key === 'Escape') setTextInput(null); }}
            onBlur={e => e.target.value.trim() ? handleTextSubmit(e.target.value) : setTextInput(null)}
          />
          <div className="text-[10px] text-gray-400 mt-0.5">Enter ↵ confirm · Esc cancel</div>
        </div>
      )}

      {/* Remote Cursors */}
      {Object.entries(remoteCursors).map(([uid, { position, username }]) => (
        <div key={uid} className="absolute pointer-events-none z-10"
          style={{ left: position.x * (zoom || 1), top: position.y * (zoom || 1), transform: 'translate(-50%,-50%)' }}>
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.5 3.21V20.8l6.99-6.99H21L5.5 3.21z" />
          </svg>
          <span className="absolute left-4 top-4 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-md whitespace-nowrap shadow">{username}</span>
        </div>
      ))}

      {/* Drawing disabled */}
      {!canDraw && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-xl text-sm shadow-lg">
          Drawing is disabled for participants
        </div>
      )}

      {/* Tool + zoom badge */}
      {canDraw && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-[11px] text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50 capitalize font-medium">
            {tool === 'laser' ? '🔴 Laser' : tool} · {Math.round((zoom || 1) * 100)}%
          </span>
        </div>
      )}

      {/* Minimap */}
      <div className="minimap">
        <canvas ref={minimapRef} width={160} height={100} className="w-full h-full" />
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
